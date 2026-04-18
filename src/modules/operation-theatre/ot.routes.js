const express = require('express');
const router = express.Router();
const otController = require('./ot.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { 
  createRoomSchema, 
  scheduleOpSchema, 
  teamSchema, 
  checklistSchema, 
  implantSchema, 
  postOpSchema 
} = require('./ot.validator');

/**
 * Operation Theatre (OT) & Surgical API Gateway
 * Base Path: /api/v1/ot
 * 
 * Enforces strict WHO-compliant surgical safety gates and 
 * regulatory implant traceability.
 */

// --- OT Room Management ---

router.post('/rooms',
  authenticate,
  authorize('ot:create_room'),
  validate({ body: createRoomSchema }),
  auditMiddleware,
  otController.createOTRoom
);

router.get('/rooms',
  authenticate,
  otController.getOTRooms
);

router.get('/rooms/availability',
  authenticate,
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); // Real-time surgical availability
    next();
  },
  otController.getOTRoomAvailability
);

router.post('/rooms/:roomId/ready',
  authenticate,
  authorize(['ot:update_room', 'nurse']),
  auditMiddleware,
  otController.markOTRoomReady
);

// --- Scheduling ---

router.post('/operations',
  authenticate,
  authorize(['surgeon', 'admin']),
  validate({ body: scheduleOpSchema }),
  auditMiddleware,
  otController.scheduleOperation
);

router.get('/operations/schedule',
  authenticate,
  authorize(['surgeon', 'nurse', 'anaesthesiologist', 'admin']),
  otController.getOTSchedule
);

router.delete('/operations/:id',
  authenticate,
  authorize(['surgeon', 'admin']),
  auditMiddleware,
  otController.cancelOperation
);

// --- Team Management ---

router.post('/operations/:otId/team',
  authenticate,
  authorize(['admin', 'surgeon']),
  validate({ body: teamSchema }),
  auditMiddleware,
  otController.assignOTTeam
);

// --- Pre-Operative & Safety Gate ---

router.get('/operations/:otId/checklist',
  authenticate,
  authorize(['surgeon', 'nurse', 'anaesthesiologist']),
  otController.getPreOpChecklist
);

router.put('/operations/:otId/checklist',
  authenticate,
  authorize(['nurse', 'anaesthesiologist']),
  validate({ body: checklistSchema }),
  auditMiddleware,
  otController.updatePreOpChecklist
);

router.post('/operations/:otId/checklist/complete',
  authenticate,
  authorize(['nurse']),
  auditMiddleware,
  otController.markChecklistComplete
);

// --- Intra-Operative ---

/**
 * MISSION CRITICAL: Commence Surgery
 * Hardware-Software Gate: Rejects if checklist is not 100%
 */
router.post('/operations/:otId/start',
  authenticate,
  authorize(['surgeon']),
  auditMiddleware,
  otController.startOperation
);

router.post('/operations/:otId/intra-op-notes',
  authenticate,
  authorize(['surgeon', 'scrub_nurse']),
  auditMiddleware,
  otController.recordIntraOpNotes
);

router.put('/operations/:otId/intra-op-notes',
  authenticate,
  authorize(['surgeon']),
  auditMiddleware,
  otController.recordIntraOpNotes // Auto-save support
);

/**
 * REGULATORY CRITICAL: Implant Tracking
 * Applies enhanced audit logging for device traceability
 */
router.post('/operations/:otId/implants',
  authenticate,
  authorize(['surgeon']),
  (req, res, next) => {
    req.auditTag = 'REGULATORY_CRITICAL_IMPLANT';
    next();
  },
  validate({ body: implantSchema }),
  auditMiddleware,
  otController.addImplantRecord
);

router.post('/operations/:otId/end',
  authenticate,
  authorize(['surgeon']),
  auditMiddleware,
  otController.endOperation
);

// --- Post-Operative & Disposition ---

router.post('/operations/:otId/post-op-notes',
  authenticate,
  authorize(['surgeon']),
  validate({ body: postOpSchema }),
  auditMiddleware,
  otController.recordPostOpNotes
);

router.post('/operations/:otId/handover',
  authenticate,
  authorize(['nurse', 'recovery_nurse']),
  auditMiddleware,
  otController.handoverToRecovery
);

router.post('/operations/:otId/transfer-ward',
  authenticate,
  authorize(['doctor', 'nurse', 'admin']),
  auditMiddleware,
  otController.transferToWard
);

// --- Reports ---

router.get('/reports/stats',
  authenticate,
  authorize(['admin', 'surgeon']),
  otController.getOTStats
);

router.get('/reports/utilization',
  authenticate,
  authorize(['admin']),
  otController.getOTUtilizationReport
);

module.exports = router;
