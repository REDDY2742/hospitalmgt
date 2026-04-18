const express = require('express');
const router = express.Router();
const emergencyController = require('./emergency.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { emergencyLimiter } = require('../../middleware/rateLimit.middleware');
const { 
  registerEmergencySchema, 
  triageSchema, 
  activateCodeSchema, 
  admitERSchema, 
  recordDeceasedSchema 
} = require('./emergency.validator');

/**
 * Emergency Department API Gateway
 * Base Path: /api/v1/emergency
 * 
 * Hardened for life-critical reliability and zero-latency audit logs.
 * All routes are exempt from standard rate limits (using emergencyLimiter).
 */

// Global Middleware for all ER routes
router.use(authenticate);
router.use(emergencyLimiter);
router.use(auditMiddleware); // Every action is medico-legal record
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

/** --- Registration & Triage --- */

router.post('/register',
  authorize('emergency:register'),
  validate({ body: registerEmergencySchema }),
  emergencyController.registerEmergencyPatient
);

router.get('/patients',
  authorize('emergency:read_active'),
  emergencyController.listActiveERPatients
);

router.get('/patients/:id',
  authorize('emergency:read_detail'),
  emergencyController.getEmergencyPatientById
);

router.put('/patients/:id',
  authorize('emergency:update'),
  emergencyController.updateEmergencyPatient
);

router.post('/patients/:id/triage',
  authorize('emergency:triage'),
  validate({ body: triageSchema }),
  emergencyController.triagePatient
);

router.put('/patients/:id/triage',
  authorize('emergency:triage'),
  validate({ body: triageSchema }),
  emergencyController.updateTriage
);

/** --- Clinical Actions --- */

router.post('/patients/:id/treatment-notes',
  authorize('emergency:treatment'),
  emergencyController.addTreatmentNote
);

router.post('/patients/:id/vitals',
  authorize('emergency:treatment'),
  emergencyController.updateVitals
);

router.post('/patients/:id/lab-order',
  authorize('emergency:order_lab'),
  emergencyController.orderEmergencyLab
);

router.post('/patients/:id/medication',
  authorize('emergency:order_meds'),
  emergencyController.orderEmergencyMedication
);

router.post('/patients/:id/escalate',
  authorize('emergency:escalate'),
  emergencyController.escalateEmergency
);

/** --- Code Protocols (HIGHEST PRIORITY) --- */

router.post('/codes/activate',
  authorize('emergency:activate_code'),
  validate({ body: activateCodeSchema }),
  // Controller handles Socket.io broadcast before response
  emergencyController.activateCodeProtocol
);

router.post('/codes/:codeId/deactivate',
  authorize('emergency:activate_code'),
  emergencyController.deactivateCodeProtocol
);

router.get('/codes/active',
  authorize('emergency:read_codes'),
  emergencyController.getActiveCodeProtocols
);

router.post('/codes/:codeId/response-log',
  authorize('emergency:log_response'),
  emergencyController.logCodeResponse
);

/** --- Disposition --- */

router.post('/patients/:id/admit',
  authorize('emergency:disposition'),
  validate({ body: admitERSchema }),
  emergencyController.admitFromEmergency
);

router.post('/patients/:id/discharge',
  authorize('emergency:disposition'),
  emergencyController.dischargeFromEmergency
);

router.post('/patients/:id/transfer',
  authorize('emergency:disposition'),
  emergencyController.transferToAnotherFacility
);

router.post('/patients/:id/deceased',
  authorize('emergency:record_deceased'),
  // Sensitivity Gate: Requires admin verification
  (req, res, next) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SENIOR_DOCTOR') {
      return res.status(403).json({ message: 'Deceased recording requires senior clinical/admin authorization' });
    }
    next();
  },
  validate({ body: recordDeceasedSchema }),
  emergencyController.recordDeceased
);

/** --- Dashboards & Analytics --- */

router.get('/dashboard',
  authorize('emergency:read_dashboard'),
  emergencyController.getERDashboard
);

router.get('/wait-times',
  authorize('emergency:read_wait_times'),
  emergencyController.getERWaitTimes
);

router.get('/analytics',
  authorize('emergency:read_analytics'),
  emergencyController.getERAnalyticsReport
);

router.get('/triage-summary/:id',
  authorize('emergency:read_detail'),
  emergencyController.getTriageSummary
);

router.get('/patients/:patientId/history',
  authorize('emergency:read_detail'),
  emergencyController.getERPatientHistory
);

module.exports = router;
