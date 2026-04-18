const { Op } = require('sequelize');
const { db } = require('../../config/db');
const { 
  MedicalRecord, Consultation, Patient, Diagnosis, Prescription, 
  Vitals, LaboratoryOrder, MedicalDocument, Allergy, ChronicCondition, 
  SurgicalHistory, Implant, Vaccination, AccessGrant, PHIAuditLog,
  ConsultationVersion, AllergyChangeLog
} = require('./medicalRecord.model'); // Assumed unified model import or separate
const { redis } = require('../../config/redis');
const { io } = require('../../app');
const { encryptField, decryptField } = require('../../utils/encryption.util');
const s3 = require('../../utils/s3.util');
const notificationService = require('../notifications/notification.service');
const pdfUtil = require('../../utils/pdf.util');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../utils/appError');
const logger = require('../../utils/logger').createChildLogger('medical-records');
const notificationQueue = require('../../queues/notification.queue');

/**
 * Hospital Medical Records (EHR) Service
 * 
 * Orchestrates mission-critical health information, clinical consultations,
 * forensic PHI audit trails, and role-based clinical data sharding.
 */

/**
 * @description Provisions a master medical record (EHR) with atomic MRN generation
 * @phi-sensitive
 */
async function createMedicalRecord(patientId, recordData, createdBy) {
  const transaction = await db.transaction();
  try {
    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) throw new NotFoundError('Patient not found');

    const existingRef = await MedicalRecord.findOne({ where: { patientId }, transaction });
    if (existingRef) throw new ConflictError('Patient already has an existing master medical record');

    // 1. Atomic MRN Generation: MRN-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const sequence = await redis.incr(`hms:mrn:counter:${year}`);
    const mrn = `MRN-${year}-${sequence.toString().padStart(6, '0')}`;

    // 2. Encryption Gating: Sensitive clinical data
    const encryptedHIV = recordData.hivStatus ? encryptField(recordData.hivStatus) : null;
    const encryptedPsych = recordData.psychiatricHistory ? encryptField(recordData.psychiatricHistory) : null;

    const medicalRecord = await MedicalRecord.create({
      patientId,
      mrn,
      ...recordData,
      hivStatus: encryptedHIV,
      psychiatricHistory: encryptedPsych,
      createdBy,
      isActive: true
    }, { transaction });

    await transaction.commit();

    // 3. Identification Cache
    await redis.set(`hms:mrn:${mrn}`, patientId);
    await redis.set(`hms:patient:mrn:${patientId}`, mrn);

    // 4. Forensic Audit
    await _logPHIAccess({
      action: 'MEDICAL_RECORD_CREATED',
      accessor: createdBy,
      patientId,
      mrn,
      module: 'medical-records'
    });

    return medicalRecord;
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error creating medical record: ${error.message}`);
    throw error;
  }
}

/**
 * @description Retrieves shaped medical record with strict clinical role-based sharding
 * @phi-sensitive
 */
async function getMedicalRecord(patientId, requestingUser) {
  const cacheKey = `hms:medrecord:${patientId}:${requestingUser.role}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const record = JSON.parse(cached);
    await _logPHIAccess({ action: 'PHI_ACCESS', accessor: requestingUser.id, role: requestingUser.role, patientId, level: 'CACHED' });
    return record;
  }

  const record = await MedicalRecord.findOne({
    where: { patientId },
    include: [
      { model: Allergy, where: { isActive: true }, required: false },
      { model: ChronicCondition, where: { isActive: true }, required: false },
      { model: Vaccination, required: false },
      { model: Consultation, limit: 10, order: [['createdAt', 'DESC']], required: false }
    ]
  });

  if (!record) throw new NotFoundError('Medical record not found');

  // Role-Based Sharding Logic
  const accessLevel = _calculateAccessLevel(requestingUser, patientId);
  const shapedRecord = await _shapeClinicalRecord(record, accessLevel, requestingUser.role);

  await _logPHIAccess({
    action: 'PHI_ACCESS',
    accessor: requestingUser.id,
    role: requestingUser.role,
    patientId,
    level: accessLevel
  });

  await redis.set(cacheKey, JSON.stringify(shapedRecord), 'EX', 300);
  return { medicalRecord: shapedRecord, accessLevel, lastUpdated: new Date() };
}

/**
 * @description Orchestrates clinical encounter documentation with automated chronic-diagnosis detection
 * @phi-sensitive
 */
async function addConsultationRecord(patientId, consultationData, doctorId) {
  const transaction = await db.transaction();
  try {
    const record = await MedicalRecord.findOne({ where: { patientId }, transaction });
    if (!record) throw new NotFoundError('Master Medical Record not found');

    // 1. Diagnosis Analysis: Atomic chronic condition detection
    const newChronicDetected = [];
    for (const diag of consultationData.diagnoses || []) {
      if (diag.type === 'CHRONIC') {
        const exists = await ChronicCondition.findOne({ where: { patientId, icd10Code: diag.icd10Code }, transaction });
        if (!exists) {
          await ChronicCondition.create({
            patientId,
            name: diag.description,
            icd10Code: diag.icd10Code,
            diagnosedBy: doctorId,
            currentStatus: 'ACTIVE'
          }, { transaction });
          newChronicDetected.push(diag.description);
        }
      }
    }

    // 2. Encryption: Private doctor thoughts
    const internalNotes = consultationData.internalDoctorNotes ? encryptField(consultationData.internalDoctorNotes) : null;

    const consultation = await Consultation.create({
      ...consultationData,
      patientId,
      doctorId,
      internalDoctorNotes: internalNotes,
      doctorSignatureTimestamp: new Date()
    }, { transaction });

    await transaction.commit();

    // 3. Cache Invalidation Patterns
    await _invalidateRecordCache(patientId);

    // 4. Async Logistics
    await notificationQueue.add('GENERATE_OPD_BILL', { consultationId: consultation.id });
    if (newChronicDetected.length) {
      await notificationService.sendAlert(doctorId, 'CHRONIC_DIAGNOSIS', `New chronic conditions detected: ${newChronicDetected.join(', ')}`);
    }

    return consultation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * @description Enforces clinical duration limits (24h) for note modification with version-preservation
 */
async function updateConsultationRecord(consultationId, updateData, updatedBy) {
  const transaction = await db.transaction();
  try {
    const consultation = await Consultation.findByPk(consultationId, { transaction, lock: true });
    if (consultation.doctorId !== updatedBy) throw new ForbiddenError('IdentityError: Only the authoring clinician can edit these notes');

    // 24-Hour Forensic Window
    const hoursSinceCreation = (Date.now() - new Date(consultation.createdAt)) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) throw new ValidationError('Clinical notes can only be edited within 24 hours. Please use the addendum feature.');

    // 1. History Preservation
    await ConsultationVersion.create({
      consultationId,
      version: consultation.version,
      content: JSON.stringify(consultation.toJSON())
    }, { transaction });

    // 2. Data Update
    await consultation.update({ ...updateData, version: consultation.version + 1 }, { transaction });
    await transaction.commit();

    await _invalidateRecordCache(consultation.patientId);
    return consultation;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * @description Registers allergies with real-time drug-interaction cross-checks
 */
async function updateAllergies(patientId, allergiesData, updatedBy) {
  const { operation, allergy } = allergiesData;
  const transaction = await db.transaction();
  try {
    const mr = await MedicalRecord.findOne({ where: { patientId }, transaction });
    
    if (operation === 'add') {
      await Allergy.create({ ...allergy, patientId, updatedBy }, { transaction });
      
      // SAFETY CROSS-CHECK: Scan active medications
      const activeMeds = await Prescription.findAll({ where: { patientId, status: 'ACTIVE' }, transaction });
      for (const med of activeMeds) {
        if (med.substanceName === allergy.substanceName) {
          // Trigger Critical Alert
          await notificationService.sendEmergencyAlert(updatedBy, 'DRUG_ALLERGY_CONFLICT', `CRITICAL: Patient has active prescription for ${med.substanceName} which was just listed as an allergy.`);
          io.to(`user_${updatedBy}`).emit('SAFETY_ALERT', { type: 'ALLERGY_CONFLICT', message: `Immediate conflict with active meds detected.` });
        }
      }
    }

    await transaction.commit();
    await _invalidateRecordCache(patientId);
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * @description Orchestrates secure clinical document archival with server-side encryption
 */
async function uploadMedicalDocument(patientId, fileData, uploadedBy) {
  const { buffer, originalname, mimetype, documentType, isConfidential } = fileData;
  
  // 1. S3 Archival logic
  const year = new Date().getFullYear();
  const uuid = Math.random().toString(36).substring(7);
  const s3Key = `documents/${patientId}/${year}/${uuid}-${originalname}`;

  const upload = await s3.uploadFile(buffer, s3Key, process.env.PATIENT_DOCUMENTS_BUCKET, {
    ContentType: mimetype,
    Metadata: { uploadedBy, patientId, isConfidential: String(isConfidential) }
  });

  // 2. Metadata Database Anchoring
  const doc = await MedicalDocument.create({
    patientId,
    documentType,
    title: originalname,
    s3Key: isConfidential ? encryptField(s3Key) : s3Key, // Encrypt key for confidential docs
    s3Bucket: process.env.PATIENT_DOCUMENTS_BUCKET,
    mimeType: mimetype,
    isConfidential,
    uploadedBy,
    uploadedAt: new Date()
  });

  const downloadUrl = await s3.getSignedUrl(process.env.PATIENT_DOCUMENTS_BUCKET, s3Key, 900);

  await _logPHIAccess({ action: 'MEDICAL_DOCUMENT_UPLOADED', accessor: uploadedBy, patientId, docId: doc.id });
  return { documentId: doc.id, downloadUrl, s3Key };
}

/**
 * --- Internal Intelligence Helpers ---
 */

async function _logPHIAccess(logData) {
  await PHIAuditLog.create({
    ...logData,
    timestamp: new Date()
  });
  logger.info(`PHI Access: ${logData.action} by ${logData.accessor} on patient ${logData.patientId}`);
}

async function _invalidateRecordCache(patientId) {
  const keys = await redis.keys(`hms:medrecord:${patientId}:*`);
  if (keys.length) await redis.del(keys);
}

function _calculateAccessLevel(user, patientId) {
  if (user.role === 'ADMIN') return 'ADMIN';
  if (user.role === 'PATIENT' && user.id === patientId) return 'FULL_OWNER';
  if (user.role === 'DOCTOR') {
    // Check assignment (Mock logic)
    return user.assignedPatients.includes(patientId) ? 'FULL_CLINICAL' : 'LIMITED_CLINICAL';
  }
  return 'RESTRICTED';
}

async function _shapeClinicalRecord(record, accessLevel, role) {
  const plain = record.get({ plain: true });
  
  // Restrict Demographics/Administrative for specific roles
  if (role === 'RECEPTIONIST') {
    return { mrn: plain.mrn, demographics: plain.patient }; // Demographic subset
  }

  // Clinical Decryption for Authorized Leads
  if (accessLevel === 'FULL_CLINICAL' || accessLevel === 'FULL_OWNER') {
    if (plain.hivStatus) plain.hivStatus = decryptField(plain.hivStatus);
    if (plain.psychiatricHistory) plain.psychiatricHistory = decryptField(plain.psychiatricHistory);
  } else {
    // Scrub sensitive fields for limited access
    delete plain.hivStatus;
    delete plain.psychiatricHistory;
  }

  // Remove internal notes from Patient view
  if (role === 'PATIENT') {
    plain.consultations = plain.consultations.map(c => {
      delete c.internalDoctorNotes;
      return c;
    });
  }

  return plain;
}

module.exports = {
  createMedicalRecord,
  getMedicalRecord,
  addConsultationRecord,
  updateConsultationRecord,
  updateAllergies,
  uploadMedicalDocument,
  getPatientDocuments: async (patientId, filters, user) => { /* logic */ },
  getDocumentDownloadURL: async (docId, user) => { /* logic */ },
  getMedicalSummary: async (patientId) => { /* logic */ },
  getPatientTimeline: async (patientId, filters) => { /* logic */ },
  addVaccinationRecord: async (patientId, data, by) => { /* logic */ },
  grantRecordAccess: async (patientId, to, data, by) => { /* logic */ },
  revokeRecordAccess: async (patientId, grantId, by) => { /* logic */ },
  getMedicalRecordAuditTrail: async (patientId, filters) => { /* logic */ }
};
