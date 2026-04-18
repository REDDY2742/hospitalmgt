const express = require('express');
const router = express.Router();
const insuranceController = require('./insurance.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');

const {
  addProviderSchema,
  updateProviderSchema,
  addPatientInsuranceSchema,
  createPreAuthSchema,
  updatePreAuthStatusSchema,
  createClaimSchema,
  processSettlementSchema,
  disputeClaimSchema,
  eligibilityQuerySchema
} = require('./insurance.validator');

/**
 * Hospital Insurance & TPA Routing Gateway
 * Base Path: /api/v1/insurance
 */

router.use(authenticate);

// --- 1. Carrier & TPA Providers ---

router.post('/providers', 
  authorize('insurance:create'), 
  validate(addProviderSchema, 'body'), 
  auditMiddleware, 
  insuranceController.addInsuranceProvider
);

router.get('/providers', authorize('insurance:read'), insuranceController.listInsuranceProviders);
router.get('/providers/search', authorize('insurance:read'), insuranceController.searchInsuranceProviders);
router.get('/providers/:providerId', authorize('insurance:read'), insuranceController.getInsuranceProviderById);

router.put('/providers/:providerId', 
  authorize('insurance:update'), 
  validate(updateProviderSchema, 'body'), 
  auditMiddleware, 
  insuranceController.updateInsuranceProvider
);

router.delete('/providers/:providerId', authorize('insurance:delete'), insuranceController.deactivateInsuranceProvider);

// --- 2. Patient Insurance Policies ---

router.post('/patients/:patientId/policies', 
  authorize('policies:create'), 
  validate(addPatientInsuranceSchema, 'body'), 
  auditMiddleware, 
  insuranceController.addPatientInsurance
);

router.get('/patients/:patientId/policies', authorize('policies:read'), insuranceController.getClaimsByPatient);

router.get('/patients/:patientId/eligibility/:providerId', 
  authorize('policies:read'), 
  validate(eligibilityQuerySchema, 'query'), 
  insuranceController.verifyInsuranceEligibility
);

// --- 3. Pre-Authorizations ---

router.post('/patients/:patientId/pre-auth', 
  authorize('pre-auth:create'), 
  validate(createPreAuthSchema, 'body'), 
  auditMiddleware, 
  insuranceController.createPreAuthorization
);

router.put('/pre-auth/:preAuthId/status', 
  authorize('pre-auth:update'), 
  validate(updatePreAuthStatusSchema, 'body'), 
  auditMiddleware, 
  insuranceController.updatePreAuthorizationStatus
);

// --- 4. Claims & Settlements ---

router.post('/claims', 
  authorize('claims:create'), 
  validate(createClaimSchema, 'body'), 
  auditMiddleware, 
  insuranceController.createInsuranceClaim
);

router.post('/claims/:claimId/settle', 
  authorize('claims:settle'), 
  validate(processSettlementSchema, 'body'), 
  auditMiddleware, 
  insuranceController.processClaimSettlement
);

router.post('/claims/:claimId/dispute', 
  authorize('claims:update'), 
  validate(disputeClaimSchema, 'body'), 
  auditMiddleware, 
  insuranceController.disputeInsuranceClaim
);

// --- 5. Governance & Dashboard ---

router.get('/dashboard', authorize('insurance:read'), insuranceController.getInsuranceDashboard);

module.exports = router;
