const { 
  OTBooking, 
  OTTeam, 
  PreOpChecklist, 
  IntraOpNote, 
  ImplantLog, 
  OTRoom, 
  User, 
  Patient, 
  sequelize 
} = require('../../models');
const { redis } = require('../../config/redis');
const { getIO } = require('../../config/socket');
const { generateOTReportPDF } = require('../../utils/pdf.util');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Operation Theatre (OT) Management Service
 * 
 * Manages the high-precision surgical lifecycle: Slot mutexting, 
 * Mandatory safety gates (Pre-op Checklist), and Regulatory implant tracking.
 */

class OTService {
  /**
   * Surgical Scheduling & Resource Locking
   */
  async scheduleOperation(operationData, scheduledBy) {
    const { otRoomId, surgeonId, startTime, estimatedDuration } = operationData;
    const endTime = new Date(new Date(startTime).getTime() + estimatedDuration * 60 * 60 * 1000);

    // 1. Conflict Check (Room & Surgeon)
    const conflict = await OTBooking.findOne({
      where: {
        [sequelize.Op.or]: [
          { otRoomId, startTime: { [sequelize.Op.between]: [startTime, endTime] } },
          { surgeonId, startTime: { [sequelize.Op.between]: [startTime, endTime] } }
        ]
      }
    });
    if (conflict) throw new ConflictError('The OT Room or Surgeon is unavailable during this time slot');

    // 2. Redis Slot Lock (Avoid race conditions)
    const lockKey = `lock:ot_slot:${otRoomId}:${new Date(startTime).getTime()}`;
    const acquired = await redis.set(lockKey, 'LOCKED', 'NX', 'EX', 60);
    if (!acquired) throw new ConflictError('This OT slot is currently being booked by another administrator');

    const transaction = await sequelize.transaction();
    try {
      const year = new Date().getFullYear();
      const count = await OTBooking.count({ where: { createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } }, transaction });
      const otNumber = `OT-${year}-${String(count + 1).padStart(5, '0')}`;

      const booking = await OTBooking.create({
        ...operationData,
        otNumber,
        status: 'SCHEDULED',
        scheduledBy
      }, { transaction });

      await transaction.commit();
      return booking;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await redis.del(lockKey);
    }
  }

  /**
   * Mandatory Pre-operative Safety Gate
   */
  async submitPreOpChecklist(bookingId, checklistData, completedBy) {
    // 1. Verification of 100% completion requirement
    const requiredfields = [
      'identityVerified', 'consentSigned', 'siteMarked', 
      'allergiesChecked', 'npoCompliance', 'preOpVitals', 
      'anesthesiaAssessment'
    ];
    
    const isComplete = requiredfields.every(field => checklistData[field] === true);
    if (!isComplete) {
      throw new ValidationError('Pre-operative checklist must be 100% complete before surgical start');
    }

    const checklist = await PreOpChecklist.create({
      otBookingId: bookingId,
      ...checklistData,
      isComplete: true,
      completedBy,
      completedAt: new Date()
    });

    await OTBooking.update({ status: 'READY' }, { where: { id: bookingId } });
    return checklist;
  }

  /**
   * Surgical Start (Hard-Gate Validation)
   */
  async startOperation(bookingId, startedBy) {
    const booking = await OTBooking.findByPk(bookingId, { include: ['checklist'] });
    if (!booking || !booking.checklist || !booking.checklist.isComplete) {
      throw new AppError('Cannot start operation: Pre-operative safety gate (checklist) has not been finalized.', 403);
    }

    await booking.update({
      actualStartTime: new Date(),
      status: 'IN_PROGRESS',
      startedBy
    });

    const io = getIO();
    io.to('ot_floor').emit('OPERATION_STARTED', { otNumber: booking.otNumber, room: booking.otRoomId });
    
    return { success: true, startTime: booking.actualStartTime };
  }

  /**
   * Implant Tracking & Intra-operative Logging
   */
  async recordIntraOpDetails(bookingId, details, recordedBy) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Regulatory Implant Logging
      if (details.implants && details.implants.length > 0) {
        await ImplantLog.bulkCreate(details.implants.map(implant => ({
          otBookingId: bookingId,
          deviceId: implant.deviceId,
          serialNumber: implant.serialNumber,
          manufacturer: implant.manufacturer,
          isPermanent: true
        })), { transaction });
      }

      // 2. Clinical Notes
      const note = await IntraOpNote.create({
        otBookingId: bookingId,
        procedureDescription: details.description,
        findings: details.findings,
        bloodLoss: details.bloodLoss,
        anesthesiaNotes: details.anesthesia,
        recordedBy
      }, { transaction });

      await transaction.commit();
      return note;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Post-operative Finalization & Reporting
   */
  async endOperation(bookingId, summaryData, endedBy) {
    const booking = await OTBooking.findByPk(bookingId, {
      include: ['patient', 'surgeon', 'intraOpNote', 'implants']
    });

    const actualEndTime = new Date();
    const duration = Math.abs(actualEndTime - booking.actualStartTime) / 36e5; // hours

    const transaction = await sequelize.transaction();
    try {
      await booking.update({
        actualEndTime,
        duration,
        postOpDiagnosis: summaryData.diagnosis,
        status: 'COMPLETED',
        endedBy
      }, { transaction });

      // 1. Release Room to CLEANING
      await OTRoom.update({ status: 'CLEANING' }, { where: { id: booking.otId }, transaction });

      // 2. Generate Surgical Report
      const reportBuffer = await generateOTReportPDF(booking);
      // Logic for S3 upload would go here...

      await transaction.commit();
      
      const io = getIO();
      io.to('ot_floor').emit('OPERATION_COMPLETED', { otNumber: booking.otNumber });

      return { duration, reportGenerated: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * SBAR Handover Logic
   */
  async recoveryHandover(bookingId, sbarData, handedBy) {
    return {
      situation: sbarData.situation,
      background: sbarData.background,
      assessment: sbarData.assessment,
      recommendation: sbarData.recommendation,
      handedAt: new Date()
    };
  }

  /**
   * OT Master Schedule (Real-time Dashboard)
   */
  async getOTSchedule(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await OTBooking.findAll({
      where: { startTime: { [sequelize.Op.between]: [startOfDay, endOfDay] } },
      include: ['patient', 'surgeon', 'room'],
      order: [['startTime', 'ASC']]
    });

    return bookings;
  }
}

module.exports = new OTService();
