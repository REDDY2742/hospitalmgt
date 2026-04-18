const express = require('express');
const router = express.Router();
const dischargeController = require('./discharge.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { strictRateLimiter } = require('../../middleware/rateLimit.middleware');
const { 
  uploadMedicalDocument, 
  logPDFAccess 
} = require('../../middleware/upload.middleware');

const { 
  initiateDischargeSchema, 
  updateChecklistSchema, 
  createSummarySchema, 
  finalizeDischargeSchema, 
  confirmExitSchema, 
  scheduleFollowUpSchema, 
  damaInitiationSchema 
} = require('./discharge.validator');

/**
 * Hospital Discharge & Clinical Exit API Gateway
 * Base Path: /api/v1/discharge
 * 
 * Secure medico-legal finalization of clinical stays under triple-signatures.
 */

// --- 1. Discharge Lifecycle ---

router.post('/initiate',
  authenticate,
  authorize(['doctor', 'admin']),
  validate({ body: initiateDischargeSchema }),
  auditMiddleware, // All writes are medical-legal records
  dischargeController.initiateDischarge
);

router.get('/',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  dischargeController.listDischarges
);

router.get('/pending',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  dischargeController.getPendingDischarges
);

router.get('/:id',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  dischargeController.getDischargeById
);

router.put('/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  auditMiddleware,
  dischargeController.updateDischarge
);

router.delete('/:id/cancel',
  authenticate,
  authorize(['doctor', 'admin']),
  auditMiddleware,
  dischargeController.cancelDischarge
);

router.get('/admission/:admissionId',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  dischargeController.getDischargeByAdmission
);

router.get('/:id/checklist',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  dischargeController.getDischargeChecklist
);

router.put('/:id/checklist',
  authenticate,
  authorize(['nurse', 'doctor', 'admin']),
  validate({ body: updateChecklistSchema }),
  auditMiddleware,
  dischargeController.updateDischargeChecklist
);

// --- 2. Discharge Summary (Clinical Documentation) ---

router.post('/:id/summary',
  authenticate,
  authorize('doctor'),
  validate({ body: createSummarySchema }),
  auditMiddleware,
  dischargeController.createDischargeSummary
);

router.put('/:id/summary',
  authenticate,
  authorize('doctor'),
  auditMiddleware,
  dischargeController.updateDischargeSummary
);

router.get('/:id/summary',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  dischargeController.getDischargeSummary
);

router.get('/:id/summary/pdf',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  logPDFAccess, // Legal tracking of document access
  dischargeController.getDischargeSummaryPDF
);

router.post('/:id/summary/submit',
  authenticate,
  authorize('doctor'),
  auditMiddleware,
  dischargeController.submitSummaryForReview
);

router.post('/:id/summary/addendum',
  authenticate,
  authorize('doctor'),
  auditMiddleware,
  dischargeController.addSummaryAddendum
);

// --- 3. Finalization & Double-Confirmation ---

router.post('/:id/finalize',
  authenticate,
  authorize(['doctor', 'admin']),
  validate({ body: finalizeDischargeSchema }),
  auditMiddleware,
  dischargeController.finalizeDischarge
);

router.post('/:id/confirm',
  authenticate,
  authorize('admin'),
  validate({ body: confirmExitSchema }),
  auditMiddleware, // Double-confirmation exit guard
  dischargeController.confirmDischarge
);

router.get('/:id/certificate',
  authenticate,
  authorize(['admin', 'doctor', 'patient']),
  dischargeController.generateDischargeCertificate
);

router.get('/:id/certificate/pdf',
  authenticate,
  authorize(['admin', 'doctor', 'patient']),
  logPDFAccess,
  dischargeController.getDischargeCertificatePDF
);

// --- 4. Public Certificate Verification (Zero Auth) ---

router.get('/verify/:certificateNumber',
  // NO authenticate
  strictRateLimiter, // 10 req/min
  dischargeController.verifyDischargeCertificate
);

// --- 5. High-Risk Protocols (DAMA) ---

router.post('/:id/dama/initiate',
  authenticate,
  authorize(['doctor', 'admin']),
  validate({ body: damaInitiationSchema }),
  auditMiddleware, // Medico-legal DAMA tracking
  dischargeController.initiatDAMA
);

router.post('/:id/dama/consent',
  authenticate,
  authorize(['doctor', 'admin']),
  uploadMedicalDocument.single('damaForm'),
  auditMiddleware,
  dischargeController.recordDAMAConsent
);

router.post('/:id/dama/finalize',
  authenticate,
  authorize(['doctor', 'admin']),
  auditMiddleware,
  dischargeController.finalizeDAMA
);

// --- 6. Continuity Care (Follow-up) ---

router.post('/:id/follow-up',
  authenticate,
  authorize(['doctor', 'admin']),
  validate({ body: scheduleFollowUpSchema }),
  auditMiddleware,
  dischargeController.scheduleFollowUp
);

router.get('/follow-ups/patient/:patientId',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  dischargeController.getFollowUpsByPatient
);

router.post('/:id/instructions/resend',
  authenticate,
  authorize(['doctor', 'admin', 'nurse']),
  dischargeController.sendDischargeInstructions
);

// --- 7. Operational Analytics ---

router.get('/analytics/summary',
  authenticate,
  authorize('admin'),
  dischargeController.getDischargeAnalytics
);

router.get('/analytics/average-stay',
  authenticate,
  authorize(['admin', 'doctor']),
  dischargeController.getAverageStayReport
);

module.exports = router;
