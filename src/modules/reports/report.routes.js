const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { 
  reportRateLimiter, 
  reportRateLimiter: rateLimit // Reuse or specific
} = require('../../middleware/rateLimit.middleware');
const { 
  roleDashboardFilter,
  additionalAccountantVerify,
  superAdminLogger,
  applyAsyncReportGate,
  cacheHeaders,
  exportOwnershipValidator
} = require('../../middleware/report.middleware');

const { 
  dashboardQuerySchema,
  reportQuerySchema,
  financeReportQuerySchema,
  kpiQuerySchema,
  auditReportQuerySchema,
  exportRequestSchema
} = require('./report.validator');

/**
 * Hospital Business Intelligence & Analytics API Gateway
 * Base Path: /api/v1/reports
 * 
 * Orchestrates clinical performance visibility, financial audits, and 
 * high-fidelity data exporting with asynchronous temporal gating.
 */

// --- 1. Modular Dashboards ---

router.get('/dashboards/live',
  authenticate,
  // High-performance path: Skip validation/authorization, serve from Redis
  reportController.getLiveHospitalStats
);

// Grouped Dashboards with common middlewares
const dashboardMiddlewareChain = [
  authenticate,
  roleDashboardFilter, // Enforces ward/doctor specific data visibility
  cacheHeaders,        // Injects X-Cache-Status
  validate({ query: dashboardQuerySchema })
];

router.get('/dashboards/admin', ...dashboardMiddlewareChain, authorize(['ADMIN', 'SUPER_ADMIN']), reportController.getAdminDashboard);
router.get('/dashboards/doctor', ...dashboardMiddlewareChain, authorize('DOCTOR'), reportController.getDoctorDashboard);
router.get('/dashboards/nurse', ...dashboardMiddlewareChain, authorize('NURSE'), reportController.getNurseDashboard);
router.get('/dashboards/pharmacy', ...dashboardMiddlewareChain, authorize(['PHARMACIST', 'ADMIN']), reportController.getPharmacyDashboard);
router.get('/dashboards/accounts', ...dashboardMiddlewareChain, authorize(['ACCOUNTANT', 'ADMIN']), reportController.getAccountsDashboard);

// --- 2. Patient & Clinical Reports ---

router.get('/patients/summary',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  reportRateLimiter,
  applyAsyncReportGate, // Auto-queues if range > 90 days
  validate({ query: reportQuerySchema }),
  reportController.getPatientReport
);

router.get('/clinical/doctor-performance',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ query: reportQuerySchema }),
  reportController.getDoctorPerformanceReport
);

router.get('/clinical/occupancy',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ query: reportQuerySchema }),
  reportController.getOccupancyReport
);

// --- 3. Financial & Revenue Reports ---

router.get('/financial/revenue',
  authenticate,
  authorize(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  additionalAccountantVerify, // Layer 2 security for financial PII
  validate({ query: financeReportQuerySchema }),
  reportController.getRevenueReport
);

router.get('/financial/pnl',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  additionalAccountantVerify,
  reportController.getProfitLossSnapshot
);

// --- 4. KPI & Executive Summary ---

router.get('/kpi/hospital',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ query: kpiQuerySchema }),
  reportController.getHospitalKPIReport
);

// --- 5. Compliance & Security Audit ---

router.get('/audit/trail',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  superAdminLogger, // Logs every access to the security logs
  validate({ query: auditReportQuerySchema }),
  reportController.getAuditReport
);

// --- 6. Export Management ---

router.post('/exports/request',
  authenticate,
  reportRateLimiter,
  validate({ body: exportRequestSchema }),
  reportController.requestReportExport
);

router.get('/exports/:jobId/download',
  authenticate,
  exportOwnershipValidator, // Validates jobId user mapping vs requester
  reportController.downloadExport
);

router.get('/exports/my',
  authenticate,
  reportController.listMyExports
);

module.exports = router;
