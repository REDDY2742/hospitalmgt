const express = require('express');
const router = express.Router();
const patientController = require('./patient.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const { uploadMedicalDocument } = require('../../middleware/upload.middleware');
const { uploadLimiter } = require('../../middleware/rateLimit.middleware');
const {
  registerPatientSchema,
  updatePatientSchema,
  addVitalsSchema,
  admitPatientSchema,
  dischargePatientSchema,
  searchPatientsSchema
} = require('./patient.validator');

/**
 * Patient Management Routes
 * Base Path: /api/v1/patients
 */

// --- Public-facing (Own Access) ---

/**
 * @route   GET /api/v1/patients/me
 * @desc    Patient views their own medical profile
 */
router.get('/me',
  authenticate,
  authorize('patients:read_own'),
  patientController.getPatientById 
);

/**
 * @route   GET /api/v1/patients/me/appointments
 */
router.get('/me/appointments',
  authenticate,
  authorize('appointments:read_own'),
  patientController.getPatientAppointments
);

/**
 * @route   GET /api/v1/patients/me/bills
 */
router.get('/me/bills',
  authenticate,
  authorize('bills:read_own'),
  patientController.getPatientBills
);

// --- Staff Operational Routes ---

/**
 * @route   POST /api/v1/patients/register
 * @desc    Register a new patient record
 */
router.post('/register',
  authenticate,
  authorize('patients:create'),
  validate({ body: registerPatientSchema }),
  auditTrail,
  patientController.registerPatient
);

/**
 * @route   GET /api/v1/patients/
 * @desc    List all patients (paginated/filtered)
 */
router.get('/',
  authenticate,
  authorize('patients:read_all'),
  validate({ query: searchPatientsSchema }),
  patientController.listPatients
);

/**
 * @route   GET /api/v1/patients/search
 */
router.get('/search',
  authenticate,
  authorize('patients:search'),
  validate({ query: searchPatientsSchema }),
  patientController.searchPatients
);

/**
 * @route   GET /api/v1/patients/:patientId
 */
router.get('/:patientId',
  authenticate,
  authorize('patients:read'),
  patientController.getPatientById
);

/**
 * @route   PUT /api/v1/patients/:id
 */
router.put('/:id',
  authenticate,
  authorize('patients:update'),
  validate({ body: updatePatientSchema }),
  auditTrail,
  patientController.updatePatient
);

/**
 * @route   DELETE /api/v1/patients/:id
 */
router.delete('/:id',
  authenticate,
  authorize('patients:delete'),
  auditTrail,
  patientController.deletePatient
);

// --- Medical & Clinical Routes ---

/**
 * @route   GET /api/v1/patients/:id/medical-history
 */
router.get('/:id/medical-history',
  authenticate,
  authorize('patients:read_clinical'),
  patientController.getPatientMedicalHistory
);

/**
 * @route   GET /api/v1/patients/:id/vitals
 */
router.get('/:id/vitals',
  authenticate,
  authorize('patients:read_vitals'),
  patientController.getPatientVitals
);

/**
 * @route   POST /api/v1/patients/:id/vitals
 */
router.post('/:id/vitals',
  authenticate,
  authorize('patients:create_vitals'),
  validate({ body: addVitalsSchema }),
  auditTrail,
  patientController.addPatientVitals
);

/**
 * @route   GET /api/v1/patients/:id/admissions
 */
router.get('/:id/admissions',
  authenticate,
  authorize('patients:read_admissions'),
  patientController.getPatientAdmissions
);

/**
 * @route   POST /api/v1/patients/:id/admit
 */
router.post('/:id/admit',
  authenticate,
  authorize('patients:admit'),
  validate({ body: admitPatientSchema }),
  auditTrail,
  patientController.admitPatient
);

/**
 * @route   POST /api/v1/patients/:id/discharge
 */
router.post('/:id/discharge',
  authenticate,
  authorize('patients:discharge'),
  validate({ body: dischargePatientSchema }),
  auditTrail,
  patientController.dischargePatient
);

/**
 * @route   POST /api/v1/patients/:id/transfer
 */
router.post('/:id/transfer',
  authenticate,
  authorize('patients:transfer'),
  auditTrail,
  patientController.transferPatient
);

// --- Documents ---

/**
 * @route   POST /api/v1/patients/:id/documents
 */
router.post('/:id/documents',
  authenticate,
  authorize('patients:upload_document'),
  uploadLimiter,
  uploadMedicalDocument,
  auditTrail,
  patientController.uploadPatientDocument
);

/**
 * @route   GET /api/v1/patients/:id/documents
 */
router.get('/:id/documents',
  authenticate,
  authorize('patients:read_documents'),
  patientController.getPatientDocuments
);

// --- Reports ---

/**
 * @route   GET /api/v1/patients/:id/qr
 */
router.get('/:id/qr',
  authenticate,
  authorize('patients:read_qr'),
  patientController.generatePatientQR
);

/**
 * @route   GET /api/v1/patients/:id/report/export
 */
router.get('/:id/report/export',
  authenticate,
  authorize('patients:export_report'),
  patientController.exportPatientReport
);

module.exports = router;
