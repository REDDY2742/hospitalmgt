const express = require('express');
const router = express.Router();
const labController = require('./lab.controller'); // This will be implemented next
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const {
  createOrderSchema,
  collectSampleSchema,
  enterResultsSchema,
  verifyResultsSchema,
  addTestToMasterSchema
} = require('./lab.validator');

/**
 * Clinical Laboratory Gateway
 * Base Path: /api/v1/lab
 */

// --- Test Master Management ---

router.post('/tests',
  authenticate,
  authorize('lab:create_test'),
  validate({ body: addTestToMasterSchema }),
  auditTrail,
  labController.addTestToMaster
);

router.get('/tests',
  authenticate,
  authorize('lab:read_test_list'),
  labController.getLabTestCatalog
);

router.get('/tests/catalog',
  authenticate,
  authorize('lab:read_catalog'),
  labController.getLabTestCatalog
);

router.get('/tests/:testId',
  authenticate,
  authorize('lab:read_test'),
  labController.getTestById
);

router.put('/tests/:testId',
  authenticate,
  authorize('lab:update_test'),
  auditTrail,
  labController.updateTestMaster
);

router.delete('/tests/:testId',
  authenticate,
  authorize('lab:delete_test'),
  auditTrail,
  labController.deactivateTest
);

router.post('/tests/:testId/reference-ranges',
  authenticate,
  authorize('lab:update_ranges'),
  auditTrail,
  labController.updateReferenceRanges
);

// --- Diagnostic Order Orchestration ---

router.post('/orders',
  authenticate,
  authorize('lab:create_order'),
  validate({ body: createOrderSchema }),
  auditTrail,
  labController.createLabTestOrder
);

router.get('/orders',
  authenticate,
  authorize('lab:read_orders'),
  labController.listOrders
);

router.get('/orders/workload',
  authenticate,
  authorize('lab:read_workload'),
  labController.getLabWorkload
);

router.get('/orders/:id',
  authenticate,
  authorize('lab:read_order'),
  labController.getOrderById
);

router.put('/orders/:id/assign',
  authenticate,
  authorize('lab:assign_technician'),
  labController.assignTechnician
);

router.post('/orders/:id/cancel',
  authenticate,
  authorize('lab:cancel_order'),
  auditTrail,
  labController.cancelOrder
);

router.get('/orders/patient/:patientId',
  authenticate,
  authorize('lab:read_patient_orders'),
  labController.getOrdersByPatient
);

// --- Barcode & Sample Tracking ---

router.post('/orders/:id/sample',
  authenticate,
  authorize('lab:collect_sample'),
  validate({ body: collectSampleSchema }),
  auditTrail,
  labController.collectSample
);

router.put('/orders/:id/sample',
  authenticate,
  authorize('lab:update_sample'),
  auditTrail,
  labController.updateSampleCondition
);

router.post('/orders/:id/sample/reject',
  authenticate,
  authorize('lab:reject_sample'),
  auditTrail,
  labController.rejectSample
);

// --- Result Entry & Critical Protocols ---

router.post('/orders/:id/results',
  authenticate,
  authorize('lab:enter_results'),
  validate({ body: enterResultsSchema }),
  auditTrail,
  labController.enterLabResults
);

router.put('/orders/:id/results',
  authenticate,
  authorize('lab:update_results'),
  auditTrail,
  labController.updateLabResults
);

router.post('/orders/:id/verify',
  authenticate,
  authorize('lab:verify_results'),
  validate({ body: verifyResultsSchema }),
  auditTrail,
  labController.verifyLabResults
);

router.get('/orders/:id/results',
  authenticate,
  authorize('lab:read_results'),
  labController.getLabResults
);

router.get('/orders/:id/results/pdf',
  authenticate,
  authorize('lab:read_pdf'),
  labController.getReportPDF
);

router.post('/orders/:id/addendum',
  authenticate,
  authorize('lab:add_addendum'),
  auditTrail,
  labController.addResultAddendum
);

// --- Operational Insights ---

router.get('/dashboard',
  authenticate,
  authorize('lab:read_dashboard'),
  labController.getLabDashboardStats
);

router.get('/reports/tat',
  authenticate,
  authorize('lab:read_tat_report'),
  labController.getTATReport
);

router.get('/reports/workload',
  authenticate,
  authorize('lab:read_workload_report'),
  labController.getWorkloadReport
);

module.exports = router;
