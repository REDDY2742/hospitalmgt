const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const db = require('../../config/db'); // For HOD verification

const {
  createDepartmentSchema,
  updateDepartmentSchema,
  changeHODSchema,
  updateBudgetSchema
} = require('./department.validator');

/**
 * Hospital Organizational & Department API Gateway
 * Base Path: /api/v1/departments
 * 
 * Orchestrates institutional structure, HOD governance, 
 * clinical staff mobility, and cost-center budgetary oversight.
 */

// --- 0. Specialized Architectural Middlewares ---

/**
 * @description Inherent HOD Guard: Checks if req.user is the master of requested dept
 * Allows restricted data access to departmental leads
 */
const deptHODGuard = async (req, res, next) => {
  const deptId = req.params.deptId;
  if (!deptId) return next();

  try {
    const [department] = await db.query('SELECT hod_id FROM departments WHERE id = ?', {
      replacements: [deptId],
      type: db.QueryTypes.SELECT
    });

    if (department && department.hod_id === req.user.id) {
      req.isHODOfDept = true;
      return next();
    }
    // Fallback to RBAC check in next middleware
    next();
  } catch (error) {
    next(error);
  }
};

// Global authentication for all organizational routes
router.use(authenticate);

// --- 1. Institutional CRUD & Org Chart ---

router.post('/', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: createDepartmentSchema }), 
  departmentController.createDepartment
);

router.get('/', departmentController.listDepartments);
router.get('/search', departmentController.searchDepartments);

router.get('/org-chart', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
}, departmentController.getHospitalOrgChart);

router.get('/hospital-summary', authorize(['ADMIN', 'SUPER_ADMIN']), departmentController.getHospitalDepartmentSummary);

router.get('/:deptId', departmentController.getDepartmentById);

router.put('/:deptId', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: updateDepartmentSchema }), 
  departmentController.updateDepartment
);

router.post('/:deptId/deactivate', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  departmentController.deactivateDepartment
);

router.post('/:deptId/reactivate', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  departmentController.reactivateDepartment
);

// --- 2. HOD Leadership Governance ---

router.get('/:deptId/hod', departmentController.getCurrentHOD);

router.put('/:deptId/hod', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: changeHODSchema }), 
  auditMiddleware, 
  departmentController.changeDepartmentHOD
);

router.get('/:deptId/hod/history', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  departmentController.getHODHistory
);

// --- 3. Workforce Mobility & Census ---

router.get('/:deptId/staff', 
  deptHODGuard,
  authorize(['ADMIN', 'HR', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentStaff
);

router.get('/:deptId/staff/count', departmentController.getDepartmentStaffCount);
router.get('/:deptId/doctors', departmentController.getDepartmentDoctors);

router.post('/:deptId/staff/assign', authorize(['ADMIN', 'HR']), departmentController.assignStaffToDepartment);
router.post('/:deptId/staff/remove', authorize(['ADMIN', 'HR']), departmentController.removeStaffFromDepartment);

router.post('/:deptId/staff/transfer', 
  authorize(['ADMIN', 'HR']), 
  auditMiddleware, 
  departmentController.transferStaff
);

router.get('/:deptId/patients', 
  deptHODGuard,
  authorize(['DOCTOR', 'NURSE', 'ADMIN', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentPatients
);

// --- 4. Departmental Schedule & Logistics ---

router.get('/:deptId/schedule', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate'); // Real-time
  next();
}, departmentController.getDepartmentSchedule);

router.get('/:deptId/operating-hours', departmentController.getDepartmentOperatingHours);

router.put('/:deptId/operating-hours', 
  deptHODGuard,
  authorize(['ADMIN', (req) => req.isHODOfDept]), 
  departmentController.updateDepartmentOperatingHours
);

// --- 5. Market Services & Catalogs ---

router.get('/:deptId/services', departmentController.getDepartmentServices);

router.post('/:deptId/services', 
  deptHODGuard,
  authorize(['ADMIN', (req) => req.isHODOfDept]), 
  departmentController.addDepartmentService
);

router.delete('/:deptId/services/:serviceId', 
  deptHODGuard,
  authorize(['ADMIN', (req) => req.isHODOfDept]), 
  departmentController.removeDepartmentService
);

// --- 6. Fiscal Statistics & Reports ---

router.get('/:deptId/stats', 
  deptHODGuard,
  authorize(['ADMIN', 'DOCTOR', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentStats
);

router.get('/:deptId/revenue', 
  deptHODGuard,
  authorize(['ADMIN', 'ACCOUNTANT', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentRevenue
);

router.get('/:deptId/budget', 
  deptHODGuard,
  authorize(['ADMIN', 'ACCOUNTANT', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentBudget
);

router.put('/:deptId/budget', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  validate({ body: updateBudgetSchema }), 
  departmentController.updateDepartmentBudget
);

router.get('/:deptId/performance', 
  deptHODGuard,
  authorize(['ADMIN', 'SUPER_ADMIN', (req) => req.isHODOfDept]), 
  departmentController.getDepartmentPerformanceReport
);

router.get('/:deptId/report/export', 
  deptHODGuard,
  authorize(['ADMIN', (req) => req.isHODOfDept]), 
  departmentController.exportDepartmentReport
);

module.exports = router;
