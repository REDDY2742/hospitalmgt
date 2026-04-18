const QRCode = require('qrcode');
const { 
  Patient, 
  Admission, 
  MedicalRecord, 
  Vital, 
  Bed, 
  Bill, 
  AuditLog, 
  sequelize 
} = require('../../models');
const { redis } = require('../../config/redis');
const { uploadToS3 } = require('../../utils/s3.util');
const { sendPatientWelcome, sendDischargeInstructions } = require('../../utils/email.util');
const { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError, 
  AppError, 
  ConflictError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Patient Management Service
 * 
 * Handles complex clinical workflows including registration, 
 * admission (IPD), discharge, and role-based medical data retrieval.
 */

class PatientService {
  /**
   * Register a new patient
   */
  async registerPatient(patientData, registeredBy) {
    const transaction = await sequelize.transaction();

    try {
      const { email, phone, profilePhoto } = patientData;

      // 1. Generate Unique Patient ID (PAT-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const count = await Patient.count({ where: { 
        createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } 
      }, transaction });
      const patientId = `PAT-${year}-${String(count + 1).padStart(6, '0')}`;

      // 2. Generate QR Code
      const qrData = JSON.stringify({ patientId, name: patientData.name });
      const qrCodeBuffer = await QRCode.toBuffer(qrData);
      const qrKey = `qr-codes/${patientId}.png`;
      await uploadToS3(qrCodeBuffer, qrKey, 'PATIENT_DOCUMENTS');

      // 3. Handle Profile Photo Upload
      let photoUrl = null;
      if (profilePhoto) {
        const photoKey = `profiles/${patientId}-${Date.now()}.jpg`;
        photoUrl = await uploadToS3(profilePhoto, photoKey, 'PROFILE_IMAGES');
      }

      // 4. Create Patient Record
      const patient = await Patient.create({
        ...patientData,
        patientId,
        qrCodeUrl: qrKey,
        profilePhoto: photoUrl,
        registeredBy
      }, { transaction });

      // 5. Create Initial Medical Record Shell
      await MedicalRecord.create({
        patientId: patient.id,
        summary: 'Initial registration record created',
        allergyInfo: patientData.allergies || 'None documented',
        chronicConditions: patientData.chronicConditions || 'None documented'
      }, { transaction });

      // 6. Auditing
      await AuditLog.create({
        userId: registeredBy,
        action: 'CREATE',
        module: 'patients',
        resourceId: patient.id,
        newValue: { patientId, name: patient.name }
      }, { transaction });

      await transaction.commit();

      // Async Notifications
      sendPatientWelcome(email, { patientId, name: patient.name });

      return patient;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Patient Registration Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Patient with Role-Based Filtering
   */
  async getPatientById(patientId, requestingUser) {
    const cacheKey = `patient:profile:${patientId}`;
    const cachedData = await redis.get(cacheKey);

    let patient;
    if (cachedData) {
      patient = JSON.parse(cachedData);
    } else {
      patient = await Patient.findByPk(patientId, {
        include: [{ model: MedicalRecord, as: 'medicalHistory' }, { model: Vital, limit: 5 }]
      });

      if (!patient) throw new NotFoundError('Patient not found');
      await redis.set(cacheKey, JSON.stringify(patient), 'EX', 300);
    }

    // Role-Based Data Filtering
    const { role, id: userId } = requestingUser;
    let filteredData = { ...patient };

    if (role === 'PATIENT' && patient.userId !== userId) {
      throw new ForbiddenError('Access denied to other patient records');
    }

    if (role === 'RECEPTIONIST') {
      // Receptionist sees only non-clinical info
      delete filteredData.medicalHistory;
      delete filteredData.vitals;
    } else if (role === 'NURSE') {
      // Nurse sees vitals and notes but maybe not full confidential history
      delete filteredData.medicalHistory.sensitiveNotes;
    }

    // Audit Access
    AuditLog.create({
      userId,
      action: 'READ',
      module: 'patients',
      resourceId: patient.id,
      success: true
    });

    return filteredData;
  }

  /**
   * Update Patient Record
   */
  async updatePatient(patientId, updateData, updatedBy) {
    const transaction = await sequelize.transaction();

    try {
      const patient = await Patient.findByPk(patientId, { transaction });
      if (!patient) throw new NotFoundError('Patient not found');

      const previousValue = { ...patient.get() };
      const whitelist = ['name', 'phone', 'emergencyContact', 'allergies', 'chronicConditions', 'insuranceDetails'];
      
      const sanitizedUpdate = {};
      Object.keys(updateData).forEach(key => {
        if (whitelist.includes(key)) sanitizedUpdate[key] = updateData[key];
      });

      await patient.update(sanitizedUpdate, { transaction });

      await AuditLog.create({
        userId: updatedBy,
        action: 'UPDATE',
        module: 'patients',
        resourceId: patient.id,
        previousValue,
        newValue: sanitizedUpdate
      }, { transaction });

      await transaction.commit();
      await redis.del(`patient:profile:${patientId}`);

      return patient;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Admit Patient (IPD Workflow)
   */
  async admitPatient(patientId, admissionData) {
    const transaction = await sequelize.transaction();

    try {
      const { wardId, roomId, bedId, doctorId } = admissionData;

      // 1. Check Bed Availability
      const bed = await Bed.findByPk(bedId, { transaction });
      if (!bed || bed.status !== 'AVAILABLE') {
        throw new ConflictError('Selected bed is not available');
      }

      // 2. Generate IPD Number (IPD-YYYY-XXXXX)
      const year = new Date().getFullYear();
      const count = await Admission.count({ 
        where: { createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } }, 
        transaction 
      });
      const ipdNumber = `IPD-${year}-${String(count + 1).padStart(5, '0')}`;

      // 3. Create Admission Record
      const admission = await Admission.create({
        ...admissionData,
        patientId,
        ipdNumber,
        status: 'ADMITTED',
        admissionDate: new Date()
      }, { transaction });

      // 4. Update Resource Status
      await bed.update({ status: 'OCCUPIED' }, { transaction });
      await Patient.update({ status: 'IN_PATIENT' }, { where: { id: patientId }, transaction });

      await transaction.commit();
      return admission;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Discharge Patient
   */
  async dischargePatient(patientId, dischargeData) {
    const transaction = await sequelize.transaction();

    try {
      const admission = await Admission.findOne({ 
        where: { patientId, status: 'ADMITTED' }, 
        transaction 
      });

      if (!admission) throw new NotFoundError('No active admission found for this patient');

      // 1. Financial Clearance Check
      const unpaidBills = await Bill.count({ where: { patientId, status: 'UNPAID' }, transaction });
      if (unpaidBills > 0 && !dischargeData.isEmergencyDischarge) {
        throw new AppError('Cannot discharge: Outstanding bills exist', 400);
      }

      // 2. Release Bed
      await Bed.update({ status: 'AVAILABLE' }, { where: { id: admission.bedId }, transaction });

      // 3. Finalize Admission
      await admission.update({
        status: 'DISCHARGED',
        dischargeDate: new Date(),
        dischargeSummary: dischargeData.summary
      }, { transaction });

      await Patient.update({ status: 'OUT_PATIENT' }, { where: { id: patientId }, transaction });

      await transaction.commit();

      // Notifications
      sendDischargeInstructions(patientId, dischargeData.summary);

      return { message: 'Patient discharged successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Full-Text Search and Advanced Filtering
   */
  async searchPatients(query, filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = {
      isDeleted: false,
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.like]: `%${query}%` } },
        { patientId: { [sequelize.Op.like]: `%${query}%` } },
        { phone: { [sequelize.Op.like]: `%${query}%` } }
      ]
    };

    if (filters.bloodGroup) where.bloodGroup = filters.bloodGroup;
    if (filters.status) where.status = filters.status;

    const { rows, count } = await Patient.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      patients: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    };
  }
}

module.exports = new PatientService();
