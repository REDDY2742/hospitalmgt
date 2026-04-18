const { 
  Consultation, 
  User, 
  Bill, 
  MedicalRecord, 
  Prescription, 
  sequelize 
} = require('../../models');
const { getIO } = require('../../config/socket');
const { generatePrescriptionPDF } = require('../../utils/pdf.util');
const { uploadToS3 } = require('../../utils/s3.util');
const { 
  NotFoundError, 
  ValidationError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Digital Health & Telemedicine Service
 * 
 * Orchestrates virtual consultations: Token-gated video rooms, 
 * ICD-10 compliant notes, and Tiered refund logic.
 */

class TelemedicineService {
  /**
   * Virtual Appointment Orchestration
   */
  async scheduleVideoConsultation(consultationData, scheduledBy) {
    const transaction = await sequelize.transaction();

    try {
      const { doctorId, patientId, dateTime } = consultationData;

      // 1. Availability & Conflict Check (Online Slot)
      const conflict = await Consultation.findOne({
        where: { doctorId, scheduledTime: dateTime, status: { [sequelize.Op.ne]: 'CANCELLED' } },
        transaction
      });
      if (conflict) throw new ConflictError('Doctor is already booked for a virtual consultation at this time');

      // 2. Generate Consultation ID (TELE-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const count = await Consultation.count({ 
        where: { createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } }, 
        transaction 
      });
      const consultationId = `TELE-${year}-${String(count + 1).padStart(6, '0')}`;

      // 3. Create Meeting Context
      const meetingRoomId = `room-${consultationId}-${Math.random().toString(36).substr(2, 9)}`;

      const consultation = await Consultation.create({
        ...consultationData,
        consultationId,
        meetingRoomId,
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        scheduledBy
      }, { transaction });

      // 4. Financial Integration (Upfront Pay-to-Join)
      await Bill.create({
        patientId,
        sourceModule: 'TELEMEDICINE',
        sourceId: consultation.id,
        amount: consultationData.fee,
        status: 'PENDING'
      }, { transaction });

      await transaction.commit();

      // Notifications logic...
      return consultation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Secure Artifact Generation (Video Token Gate)
   */
  async generateVideoToken(id, userId) {
    const consultation = await Consultation.findByPk(id);
    if (!consultation) throw new NotFoundError('Consultation not found');

    // 1. Participant Validation
    if (consultation.patientId !== userId && consultation.doctorId !== userId) {
      throw new AppError('Unauthorized: User is not a participant in this consultation', 403);
    }

    // 2. Proximity Gate (10-minute window)
    const now = new Date();
    const startTime = new Date(consultation.scheduledTime);
    const diffMins = (now - startTime) / (1000 * 60);

    if (diffMins < -10 || diffMins > consultation.duration + 30) {
      throw new AppError('Meeting room is not active. Please join within 10 minutes of scheduled time.', 400);
    }

    // 3. Agora RTC Token Generation (Placeholder)
    const token = `AGORA-TOKEN-${consultation.meetingRoomId}-${Date.now()}`;
    const channelName = consultation.meetingRoomId;

    return { token, channelName, appId: process.env.AGORA_APP_ID };
  }

  /**
   * Consultation Lifecycle: Start & Synchronization
   */
  async startConsultation(id, startedBy) {
    const consultation = await Consultation.findByPk(id);
    if (consultation.doctorId !== startedBy) {
      throw new AppError('Only the assigned doctor can formally start the consultation', 403);
    }

    await consultation.update({
      actualStartTime: new Date(),
      status: 'IN_PROGRESS'
    });

    const io = getIO();
    io.to(`consultation_${id}`).emit('DOCTOR_JOINED', { timestamp: new Date() });
    
    return { success: true };
  }

  /**
   * Clinical Finalization & Medical Record Push
   */
  async addConsultationNotes(id, noteData, doctorId) {
    const consultation = await Consultation.findByPk(id);
    if (consultation.doctorId !== doctorId) throw new AppError('Unauthorized', 403);

    const transaction = await sequelize.transaction();
    try {
      // 1. Persist Virtual Assessment (ICD-10 Compliant)
      const record = await MedicalRecord.create({
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        consultationId: id,
        type: 'TELEMEDICINE',
        ...noteData, // complaints, diagnosis, plan, followUp
        timestamp: new Date()
      }, { transaction });

      // 2. Finalize Consultation
      await consultation.update({ 
        status: 'COMPLETED',
        actualEndTime: new Date()
      }, { transaction });

      await transaction.commit();
      return record;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Tiered Refund Logic for Virtual Care
   */
  async cancelConsultation(id, reason, cancelledBy) {
    const consultation = await Consultation.findByPk(id);
    if (!consultation || consultation.status === 'CANCELLED') {
      throw new ValidationError('Consultation cannot be cancelled');
    }

    const now = new Date();
    const startTime = new Date(consultation.scheduledTime);
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    // Refund Policy: 100% > 24hr, 50% 2-24hr, 0% < 2hr
    let refundPercentage = 0;
    if (diffHours >= 24) refundPercentage = 100;
    else if (diffHours >= 2) refundPercentage = 50;

    const transaction = await sequelize.transaction();
    try {
      await consultation.update({ 
        status: 'CANCELLED', 
        cancellationReason: reason,
        refundPercentage 
      }, { transaction });

      // Trigger Gateway Refund...
      logger.info(`TELE CONSULT CANCELLED: ${id}. Refund eligible: ${refundPercentage}%`);

      await transaction.commit();
      return { refundPercentage };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Digital Sign-off & E-Prescription Delivery
   */
  async generateEPrescription(id, prescriptionData, doctorId) {
    const consultation = await Consultation.findByPk(id, { include: ['patient'] });
    
    // 1. Create Digital Record
    const prescription = await Prescription.create({
      consultationId: id,
      patientId: consultation.patientId,
      doctorId,
      items: prescriptionData.items,
      status: 'ACTIVE'
    });

    // 2. PDF Generation with QR Secure ID
    const pdfBuffer = await generatePrescriptionPDF(prescription, consultation.patient);
    const s3Key = `e-prescriptions/${id}.pdf`;
    const s3Url = await uploadToS3(pdfBuffer, s3Key, 'PRESCRIPTIONS');

    await prescription.update({ s3Url });
    return { s3Url };
  }
}

module.exports = new TelemedicineService();
