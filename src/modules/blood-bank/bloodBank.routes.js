const express = require('express');
const router = express.Router();
const bloodBankController = require('./bloodBank.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { 
  addBloodUnitSchema, 
  discardUnitSchema, 
  createRequestSchema, 
  crossmatchSchema, 
  registerDonorSchema, 
  recordDonationSchema 
} = require('./bloodBank.validator');

/**
 * Blood Bank & Hematology API Gateway
 * Base Path: /api/v1/blood-bank
 */

// --- Blood Unit Management ---

router.post('/units',
  authenticate,
  authorize('blood:create_unit'),
  validate({ body: addBloodUnitSchema }),
  bloodBankController.addBloodUnit
);

router.get('/units',
  authenticate,
  authorize('blood:read_units'),
  bloodBankController.getBloodInventory
);

router.get('/units/expiring',
  authenticate,
  authorize('blood:read_expiring'),
  bloodBankController.getExpiringUnits
);

router.get('/units/by-group',
  authenticate,
  authorize('blood:read_by_group'),
  bloodBankController.getInventoryByBloodGroup
);

router.get('/units/critical-alerts',
  authenticate,
  authorize('blood:read_alerts'),
  bloodBankController.getCriticalStockAlerts
);

router.get('/units/:id',
  authenticate,
  authorize('blood:read_unit'),
  bloodBankController.getBloodUnitById
);

router.put('/units/:id',
  authenticate,
  authorize('blood:update_unit'),
  bloodBankController.updateBloodUnit
);

router.post('/units/:id/discard',
  authenticate,
  authorize('blood:discard_unit'),
  validate({ body: discardUnitSchema }),
  auditMiddleware,
  bloodBankController.discardBloodUnit
);

router.get('/units/:id/history',
  authenticate,
  authorize('blood:read_history'),
  bloodBankController.getBloodUnitHistory
);

// --- Blood Request routes ---

router.post('/requests',
  authenticate,
  authorize('blood:create_request'),
  validate({ body: createRequestSchema }),
  bloodBankController.createBloodRequest
);

router.get('/requests',
  authenticate,
  authorize('blood:read_requests'),
  bloodBankController.listBloodRequests
);

router.get('/requests/:id',
  authenticate,
  authorize('blood:read_request'),
  bloodBankController.getBloodRequestById
);

router.put('/requests/:id',
  authenticate,
  authorize(['blood:update_request']),
  bloodBankController.updateBloodRequest
);

router.delete('/requests/:id',
  authenticate,
  authorize('blood:cancel_request'),
  bloodBankController.cancelBloodRequest
);

router.post('/requests/:id/fulfill',
  authenticate,
  authorize('blood:fulfill_request'),
  bloodBankController.fulfillBloodRequest
);

/**
 * Critical Medical Operation: Issue Blood
 * Exemption: bypass standard API rate limiting
 */
router.post('/requests/:id/issue',
  authenticate,
  authorize('blood:issue_unit'),
  auditMiddleware,
  bloodBankController.issueBlood
);

router.post('/requests/:id/crossmatch',
  authenticate,
  authorize('blood:perform_crossmatch'),
  validate({ body: crossmatchSchema }),
  bloodBankController.performCrossmatch
);

router.get('/requests/:id/crossmatch',
  authenticate,
  authorize('blood:read_crossmatch'),
  bloodBankController.getCrossmatchResult
);

// --- Return Workflow ---

router.post('/units/:id/return',
  authenticate,
  authorize('blood:return_unit'),
  auditMiddleware,
  bloodBankController.returnBloodUnit
);

// --- Donor routes ---

router.post('/donors',
  authenticate,
  authorize('donors:create'),
  validate({ body: registerDonorSchema }),
  bloodBankController.registerDonor
);

router.get('/donors',
  authenticate,
  authorize('donors:read_all'),
  bloodBankController.listDonors
);

router.get('/donors/:id',
  authenticate,
  authorize('donors:read'),
  bloodBankController.getDonorById
);

router.put('/donors/:id',
  authenticate,
  authorize('donors:update'),
  bloodBankController.updateDonor
);

router.get('/donors/:id/history',
  authenticate,
  authorize('donors:read_history'),
  bloodBankController.getDonorHistory
);

router.get('/donors/:id/eligibility',
  authenticate,
  authorize('donors:read_eligibility'),
  bloodBankController.checkDonorEligibility
);

router.post('/donors/:id/donate',
  authenticate,
  authorize('donors:create_donation'),
  validate({ body: recordDonationSchema }),
  bloodBankController.recordDonation
);

// --- Blood Camps ---

router.post('/camps',
  authenticate,
  authorize('camps:create'),
  bloodBankController.scheduleBloodCamp
);

router.get('/camps',
  authenticate, // All authenticated staff
  bloodBankController.scheduleBloodCamp // Using placeholder for list logic
);

// --- Dashboard & Reference ---

router.get('/dashboard',
  authenticate,
  authorize('blood:read_dashboard'),
  bloodBankController.getBloodBankDashboard
);

router.get('/compatibility-matrix',
  authenticate, // All authenticated staff
  bloodBankController.getCompatibilityMatrix
);

router.get('/reports/consumption',
  authenticate,
  authorize('blood:read_reports'),
  bloodBankController.getConsumptionReport
);

module.exports = router;
