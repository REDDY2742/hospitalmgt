const express = require('express');
const router = express.Router();
const ambulanceController = require('./ambulance.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadLimiter } = require('../../middleware/rateLimit.middleware');
const { 
  registerAmbulanceSchema, 
  createDispatchRequestSchema, 
  updateLocationSchema, 
  completeTripSchema, 
  scheduleMaintenanceSchema 
} = require('./ambulance.validator');

/**
 * Ambulance & Emergency Logistics API Gateway
 * Base Path: /api/v1/ambulance
 * 
 * Hardened for real-time GPS telemetry and zero-latency emergency dispatching.
 */

// --- Fleet Management ---

router.post('/fleet',
  authenticate,
  authorize('fleet:create'),
  validate({ body: registerAmbulanceSchema }),
  ambulanceController.registerAmbulance
);

router.get('/fleet',
  authenticate,
  authorize(['fleet:read', 'dispatcher']),
  ambulanceController.listAmbulances
);

router.get('/fleet/status',
  authenticate,
  authorize(['fleet:read', 'dispatcher', 'doctor', 'er_staff']),
  ambulanceController.getAmbulanceStatus
);

router.get('/fleet/:id',
  authenticate,
  authorize(['fleet:read', 'dispatcher']),
  ambulanceController.getAmbulanceById
);

router.post('/fleet/:id/assign-driver',
  authenticate,
  authorize('fleet:assign_staff'),
  ambulanceController.assignDriver
);

router.post('/fleet/:id/assign-paramedic',
  authenticate,
  authorize('fleet:assign_staff'),
  ambulanceController.assignParamedic
);

// --- Dispatch routes ---

router.post('/dispatch',
  authenticate,
  authorize(['dispatcher', 'admin', 'receptionist']),
  validate({ body: createDispatchRequestSchema }),
  auditMiddleware,
  // Emergency dispatch: No rate limiting applied at controller/infra level
  ambulanceController.createDispatchRequest
);

router.get('/dispatch/active',
  authenticate,
  authorize(['dispatcher', 'admin', 'doctor']),
  ambulanceController.getActiveDispatches
);

router.post('/dispatch/:dispatchId/assign',
  authenticate,
  authorize(['dispatcher', 'admin']),
  auditMiddleware,
  ambulanceController.dispatchAmbulance
);

// --- Location Tracking (High-Frequency) ---

/**
 * LIGHTWEIGHT TELEMETRY GATEWAY
 * Skips full RBAC check for speed; relies on device/user token verified by authenticate.
 */
router.post('/location/:id',
  authenticate, // Fast JWT verify
  validate({ body: updateLocationSchema }),
  ambulanceController.updateLocation
);

router.get('/location/:id',
  authenticate,
  authorize(['dispatcher', 'admin', 'doctor']),
  ambulanceController.getAmbulanceLocation
);

router.get('/location/:id/history',
  authenticate,
  authorize(['dispatcher', 'admin']),
  ambulanceController.getLocationHistory
);

router.get('/location/:id/eta',
  authenticate,
  authorize(['dispatcher', 'admin', 'er_staff']),
  ambulanceController.getETAToHospital
);

// --- Trip Management ---

router.post('/trips/:dispatchId/start',
  authenticate,
  authorize(['driver', 'paramedic']),
  ambulanceController.startTrip
);

router.post('/trips/:tripId/vitals',
  authenticate,
  authorize(['paramedic']),
  ambulanceController.recordTripVitals
);

router.post('/trips/:tripId/complete',
  authenticate,
  authorize(['driver', 'paramedic', 'admin']),
  validate({ body: completeTripSchema }),
  ambulanceController.completeTrip
);

router.get('/trips/patient/:patientId',
  authenticate,
  authorize(['admin', 'doctor']),
  ambulanceController.getTripsByPatient
);

// --- Maintenance ---

router.post('/maintenance/:id',
  authenticate,
  authorize('fleet:maintenance'),
  uploadLimiter, // Rate limit maintenance doc uploads
  validate({ body: scheduleMaintenanceSchema }),
  ambulanceController.scheduleMaintenace
);

// --- Reports ---

router.get('/reports/fleet',
  authenticate,
  authorize('admin'),
  ambulanceController.getFleetReport
);

router.get('/reports/response-times',
  authenticate,
  authorize('admin'),
  ambulanceController.getResponseTimeReport
);

module.exports = router;
