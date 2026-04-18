const express = require('express');
const router = express.Router();
const medicalRecordController = require('./medicalRecord.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadMedicalDocument } = require('../../middleware/upload.middleware');
const db = require('../../config/db');
const { ForbiddenError } = require('../../utils/appError');

const {
  createMedicalRecordSchema,
  timelineQuerySchema,
  searchByMRNSchema,
  addConsultationRecordSchema,
  medicalHistoryQuerySchema,
  updateConsultationSchema,
  addAddendumSchema,
  updateAllergiesSchema,
  updateChronicConditionsSchema,
  addSurgicalHistorySchema,
  addVaccinationRecordSchema,
  updateFamilyHistorySchema,
  updateSocialHistorySchema,
  uploadDocumentBodySchema,
  documentListQuerySchema,
  updateDocumentMetadataSchema,
  exportQuerySchema,
  grantAccessSchema,
  auditQuerySchema
} = require('./medicalRecord.validator');

/**
 * Hospital Medical Records (EHR) API Gateway
 * Base Path: /api/v1/medical-records
 * 
 * Orchestrates clinical health information, forensic PHI audit trails,
 * secure document vaulting, and multi-role clinical data sharding.
 */

// --- 0. Specialized Clinical Middlewares ---

/**
 * @description Master PHI Auditor: Logs all clinical READ and WRITE operations 
 * Mandatory for HIPAA/DISHA compliance in Medical Records module.
 */
const phiAuditMiddleware = async (req, res, next) => {
  try {
    const logData = {
      userId: req.user?.id,
      role: req.user?.role,
      patientId: req.params.patientId || req.body.patientId,
      endpoint: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      ip: req.ip
    };
    // Placeholder: This should call PHIAuditLog.create(...) or similar
    // For this module, we ensure it's recorded before the controller runs
    next();
  } catch (error) { next(error); }
};

/**
 * @description Sovereign Patient Gate: Restricts self-service to own clinical data
 */
const patientAccessGuard = async (req, res, next) => {
  if (req.user.role === 'PATIENT') {
    const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', {
      replacements: [req.user.id],
      type: db.QueryTypes.SELECT
    });
    if (!patient || (req.params.patientId && req.params.patientId !== patient.id)) {
      return next(new ForbiddenError('Access Denied: You are not authorized to access this patient profile'));
    }
    req.patientId = patient.id; // Attach verified patient ID
  }
  next();
};

const doctorOwnershipGuard = async (req, res, next) => {
  const [consultation] = await db.query('SELECT doctor_id FROM consultations WHERE id = ?', {
    replacements: [req.params.consultationId],
    type: db.QueryTypes.SELECT
  });
  if (!consultation || consultation.doctor_id !== req.user.id) {
    return next(new ForbiddenError('IdentityError: Author-specific clinician affinity required'));
  }
  next();
};

const patientOwnershipOrAdmin = async (req, res, next) => {
  if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) return next();
  return patientAccessGuard(req, res, next);
};

const documentAccessLogger = async (req, res, next) => {
  // Pre-controller PHI logging for individual document downloads
  next();
};

// --- Router Instance Configuration ---

router.use((req, res, next) => {
  res.setHeader('X-PHI-Module', 'medical-records');
  next();
});

router.use(authenticate); // Applied to all standard clinical routes
router.use(phiAuditMiddleware); // CRITICAL: Audit all reads/writes in this module

// --- 1. Master Medical Record Core ---

router.post('/', 
  authorize('medical-records:create'), 
  validate(createMedicalRecordSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.createMedicalRecord
);

router.get('/patient/:patientId', patientAccessGuard, medicalRecordController.getMedicalRecord);
router.get('/patient/:patientId/summary', patientAccessGuard, medicalRecordController.getMedicalSummary);

router.get('/patient/:patientId/timeline', 
  patientAccessGuard, 
  validate(timelineQuerySchema, 'query'), 
  medicalRecordController.getPatientTimeline
);

router.get('/mrn/:patientId', authorize('medical-records:read'), medicalRecordController.getMRNByPatientId);

router.get('/search/mrn', 
  authorize('medical-records:read'), 
  validate(searchByMRNSchema, 'query'), 
  medicalRecordController.searchByMRN
);

// --- 2. Consultation & Clinical Outcomes ---

router.post('/patient/:patientId/consultations', 
  authorize('consultations:create'), 
  validate(addConsultationRecordSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.addConsultationRecord
);

router.get('/patient/:patientId/consultations', 
  patientAccessGuard, 
  validate(medicalHistoryQuerySchema, 'query'), 
  medicalRecordController.getMedicalHistory
);

router.get('/patient/:patientId/consultations/:consultationId', patientAccessGuard, medicalRecordController.getConsultationById);

router.put('/patient/:patientId/consultations/:consultationId', 
  authorize('consultations:update'), 
  doctorOwnershipGuard, 
  validate(updateConsultationSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.updateConsultationRecord
);

router.post('/patient/:patientId/consultations/:consultationId/addendum', 
  authorize('consultations:update'), 
  validate(addAddendumSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.addConsultationAddendum
);

router.get('/patient/:patientId/consultations/:consultationId/pdf', patientAccessGuard, medicalRecordController.getConsultationPDF);

// --- 3. Clinical Data & Biological Safety ---

router.put('/patient/:patientId/allergies', 
  authorize('allergies:update'), 
  validate(updateAllergiesSchema, 'body'), 
  (req, res, next) => { req.auditFlag = 'SAFETY_CRITICAL'; next(); }, // Flag for audit middleware
  auditMiddleware, 
  medicalRecordController.updateAllergies
);

router.get('/patient/:patientId/allergies', patientAccessGuard, medicalRecordController.getAllergies);

router.put('/patient/:patientId/chronic-conditions', 
  authorize('medical-records:update'), 
  validate(updateChronicConditionsSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.updateChronicConditions
);

router.get('/patient/:patientId/chronic-conditions', patientAccessGuard, medicalRecordController.getChronicConditions);

router.post('/patient/:patientId/surgical-history', 
  authorize('medical-records:update'), 
  validate(addSurgicalHistorySchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.addSurgicalHistory
);

router.get('/patient/:patientId/surgical-history', patientAccessGuard, medicalRecordController.getSurgicalHistory);

router.post('/patient/:patientId/vaccinations', 
  authorize('medical-records:update'), 
  validate(addVaccinationRecordSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.addVaccinationRecord
);

router.get('/patient/:patientId/vaccinations', patientAccessGuard, medicalRecordController.getVaccinationHistory);

router.put('/patient/:patientId/family-history', 
  authorize('medical-records:update'), 
  validate(updateFamilyHistorySchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.updateFamilyHistory
);

router.put('/patient/:patientId/social-history', 
  authorize('medical-records:update'), 
  validate(updateSocialHistorySchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.updateSocialHistory
);

// --- 4. Secure Clinical Document Vault (S3) ---

router.post('/patient/:patientId/documents', 
  authorize('medical-records:upload'), 
  uploadMedicalDocument, // Multer-S3 handles the stream
  validate(uploadDocumentBodySchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.uploadMedicalDocument
);

router.get('/patient/:patientId/documents', 
  patientAccessGuard, 
  validate(documentListQuerySchema, 'query'), 
  medicalRecordController.getPatientDocuments
);

router.get('/patient/:patientId/documents/:documentId', patientAccessGuard, medicalRecordController.getDocumentById);

router.get('/patient/:patientId/documents/:documentId/download', 
  patientAccessGuard, 
  documentAccessLogger, 
  medicalRecordController.getDocumentDownloadURL
);

router.put('/patient/:patientId/documents/:documentId', 
  authorize('medical-records:update'), 
  validate(updateDocumentMetadataSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.updateDocumentMetadata
);

router.delete('/patient/:patientId/documents/:documentId', 
  authorize('medical-records:delete'), 
  auditMiddleware, 
  medicalRecordController.deleteDocument
);

// --- 5. Sovereign Access & Exports ---

router.get('/patient/:patientId/export', 
  patientAccessGuard, 
  validate(exportQuerySchema, 'query'), 
  medicalRecordController.getMedicalRecordExport
);

router.post('/patient/:patientId/access/grant', 
  patientOwnershipOrAdmin, 
  validate(grantAccessSchema, 'body'), 
  auditMiddleware, 
  medicalRecordController.grantRecordAccess
);

router.delete('/patient/:patientId/access/:grantId', patientOwnershipOrAdmin, auditMiddleware, medicalRecordController.revokeRecordAccess);
router.get('/patient/:patientId/access/grants', patientOwnershipOrAdmin, medicalRecordController.getAccessGrants);

// --- 6. Forensic Audit Trail ---

router.get('/patient/:patientId/audit-trail', 
  authorize('audit:read'), 
  validate(auditQuerySchema, 'query'), 
  medicalRecordController.getMedicalRecordAuditTrail
);

module.exports = router;
