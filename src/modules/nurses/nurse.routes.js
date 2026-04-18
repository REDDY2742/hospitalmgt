const express = require('express');
const router = express.Router();
const nurseController = require('./nurse.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadMedicalDocument: uploadMiddleware } = require('../../middleware/upload.middleware');

const {
  createNurseProfileSchema,
  updateNurseProfileSchema,
  recordVitalsSchema,
  medicationAdminSchema,
  shiftHandoverSchema,
  withholdMedicationSchema
} = require('./nurse.validator');

/**
 * Hospital Nursing & Patient Care API Gateway
 * Base Path: /api/v1/nurses
 * 
 * Orchestrates nursing workforce lifecycle, critical care (NEWS2) monitoring, 
 * medication safety (5-Rights), and structured clinical SBAR handovers.
 */

// Mock Post-Processing Middleware for Critical Vitals
const criticalAlertMiddleware = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    if (res.get('X-Critical-Alert') === 'true') {
      // Logic for Socket.io / SMS emergency trigger (Already in service, but reinforced here)
      // console.log('CRITICAL ALERT BROADCASTING: Patient Deterioration Detected');
    }
    originalSend.call(this, data);
  };
  next();
};

router.use(authenticate); // Global requirement for all nursing routes

// --- 1. Workforce & Profile Management ---

router.post('/', authorize(['ADMIN', 'HR']), validate({ body: createNurseProfileSchema }), auditMiddleware, nurseController.createNurseProfile);
router.get('/', authorize(['ADMIN', 'HR', 'HEAD_NURSE']), nurseController.listNurses);
router.get('/search', authorize(['ADMIN', 'HR', 'DOCTOR']), nurseController.searchNurses);
router.get('/by-ward/:wardId', authorize(['ADMIN', 'DOCTOR', 'HEAD_NURSE']), nurseController.getNursesByWard);

router.get('/:nurseId', authorize(['ADMIN', 'DOCTOR', 'NURSE']), nurseController.getNurseById);
router.put('/:nurseId', authorize(['ADMIN', 'HR', 'NURSE']), validate({ body: updateNurseProfileSchema }), auditMiddleware, nurseController.updateNurseProfile);

router.post('/:nurseId/license', authorize(['ADMIN', 'NURSE']), uploadMiddleware, nurseController.uploadLicenseCertificate);
router.get('/:nurseId/license', authorize('ADMIN'), nurseController.getNurseLicense);

// --- 2. Ward & Patient Assignment ---

router.post('/:nurseId/ward/assign', authorize(['ADMIN', 'HEAD_NURSE']), auditMiddleware, nurseController.assignNurseToWard);
router.post('/:nurseId/ward/remove', authorize(['ADMIN', 'HEAD_NURSE']), auditMiddleware, nurseController.removeNurseFromWard);
router.get('/:nurseId/ward/history', authorize(['ADMIN', 'HEAD_NURSE', 'NURSE']), nurseController.getWardAssignmentHistory);

router.post('/:nurseId/patients/assign', authorize(['ADMIN', 'HEAD_NURSE', 'NURSE']), auditMiddleware, nurseController.assignPatientToNurse);
router.post('/:nurseId/patients/unassign', authorize(['ADMIN', 'HEAD_NURSE', 'NURSE']), auditMiddleware, nurseController.unassignPatient);

router.get('/my/patients', authorize('NURSE'), nurseController.getMyPatients);
router.get('/:nurseId/patients', authorize(['ADMIN', 'HEAD_NURSE']), nurseController.getMyPatients);
router.get('/:nurseId/workload', authorize(['ADMIN', 'HEAD_NURSE', 'NURSE']), nurseController.getNurseWorkload);
router.get('/ward/:wardId/status', authorize(['NURSE', 'HEAD_NURSE', 'DOCTOR', 'ADMIN']), nurseController.getWardNursingStatus);

// --- 3. Clinical Observation & Medication (LEGAL RECORDS) ---

router.post('/vitals/:patientId', 
  authorize(['NURSE', 'DOCTOR']), 
  validate({ body: recordVitalsSchema }), 
  auditMiddleware, 
  criticalAlertMiddleware, 
  nurseController.recordVitals
);

router.get('/vitals/:patientId', authorize(['NURSE', 'DOCTOR', 'ADMIN']), nurseController.getPatientVitalsHistory);

router.post('/notes/:patientId', 
  authorize('NURSE'), 
  validate({ body: Joi.object({ content: Joi.string().required(), noteType: Joi.string().required() }) }), 
  auditMiddleware, 
  nurseController.addNursingNote
);

router.get('/notes/:patientId', authorize(['NURSE', 'DOCTOR', 'ADMIN']), nurseController.getNursingNotes);

router.post('/medication/:patientId/administer', 
  authorize('NURSE'), 
  validate({ body: medicationAdminSchema }), 
  auditMiddleware, 
  nurseController.performMedicationAdministration
);

router.get('/medication/:patientId/mar', authorize(['NURSE', 'DOCTOR', 'ADMIN']), nurseController.getMedicationAdministrationRecord);

router.post('/medication/:patientId/withhold', 
  authorize('NURSE'), 
  validate({ body: withholdMedicationSchema }), 
  auditMiddleware, 
  nurseController.withholdMedication
);

// --- 4. Clinical Shift Handover ---

router.post('/handover/initiate', authorize('NURSE'), validate({ body: shiftHandoverSchema }), auditMiddleware, nurseController.initiateShiftHandover);
router.post('/handover/:handoverId/complete', authorize('NURSE'), auditMiddleware, nurseController.completeShiftHandover);
router.post('/handover/:handoverId/acknowledge', authorize('NURSE'), auditMiddleware, nurseController.acknowledgeHandover);

router.get('/handover/ward/:wardId', authorize(['NURSE', 'HEAD_NURSE', 'ADMIN']), nurseController.getHandoverHistory);
router.get('/handover/:handoverId/pdf', authorize(['NURSE', 'HEAD_NURSE', 'ADMIN']), nurseController.getHandoverPDF);

// --- 5. Care Plans & Performance ---

router.post('/care-plan/:patientId', authorize(['NURSE', 'DOCTOR']), auditMiddleware, nurseController.createNursingCarePlan);
router.get('/care-plan/:patientId', authorize(['NURSE', 'DOCTOR', 'ADMIN']), nurseController.getPatientCarePlan);

router.get('/:nurseId/performance', authorize(['ADMIN', 'HEAD_NURSE', 'NURSE']), nurseController.getNursePerformanceMetrics);
router.get('/dashboard', authorize(['NURSE', 'HEAD_NURSE', 'ADMIN']), nurseController.getNursingDashboard);
router.get('/patient/:patientId/nursing-history', authorize(['NURSE', 'DOCTOR', 'ADMIN']), nurseController.getPatientNursingHistory);

module.exports = router;
