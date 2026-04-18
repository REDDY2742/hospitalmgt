const express = require('express');
const router = express.Router();
const staffController = require('./staff.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');
const { additionalAccountantVerify } = require('../../middleware/staff.middleware');

const { 
  onboardStaffSchema, 
  applyLeaveSchema, 
  processPayrollSchema, 
  attendanceCorrectionSchema, 
  assignShiftSchema, 
  swapRequestSchema 
} = require('./staff.validator');

/**
 * Staff & HR Management API Gateway
 * Base Path: /api/v1/staff
 * 
 * Secure workforce lifecycle management from recruitment to payroll finalization.
 */

// --- 1. Staff Profile Management ---

router.post('/',
  authenticate,
  authorize(['ADMIN', 'HR']),
  validate({ body: onboardStaffSchema }),
  staffController.onboardStaff
);

router.get('/',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.listStaff
);

router.get('/my/profile',
  authenticate,
  staffController.getMyProfile
);

router.put('/my/profile',
  authenticate,
  staffController.updateMyProfile
);

router.get('/by-department/:deptId',
  authenticate,
  authorize(['ADMIN', 'HR', 'DEPT_HOD']),
  staffController.getStaffByDepartment
);

router.get('/:id',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  staffController.getStaffById
);

router.put('/:id',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.updateStaffProfile
);

router.post('/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  auditMiddleware, // Medico-legal accountability for access revocation
  staffController.deactivateStaff
);

router.post('/:id/reactivate',
  authenticate,
  authorize('ADMIN'),
  staffController.reactivateStaff
);

router.post('/:id/documents',
  authenticate,
  authorize(['ADMIN', 'HR']),
  uploadMiddleware.array('documents', 5),
  staffController.uploadStaffDocument
);

router.get('/:id/documents',
  authenticate,
  authorize(['ADMIN', 'HR', 'SELF']), // Custom role-logic in controller/service
  staffController.getStaffDocuments
);

router.get('/:id/performance',
  authenticate,
  authorize(['ADMIN', 'HR', 'SELF']),
  staffController.getStaffPerformanceReport
);

router.post('/:id/performance-note',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  staffController.addPerformanceNote
);

// --- 2. Attendance ---

router.post('/attendance/check-in',
  authenticate,
  staffController.checkIn
);

router.post('/attendance/check-out',
  authenticate,
  staffController.checkOut
);

router.get('/attendance/my',
  authenticate,
  staffController.getAttendanceByStaff // Controller handles self-logic
);

router.get('/attendance/date/:date',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  staffController.getAttendanceByDate
);

router.put('/attendance/:attendanceId/correct',
  authenticate,
  authorize(['ADMIN', 'HR']),
  validate({ body: attendanceCorrectionSchema }),
  auditMiddleware,
  staffController.correctAttendance
);

router.get('/attendance/reports/absent',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.getAbsenteeReport
);

// --- 3. Shifts ---

router.post('/shifts',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.createShift
);

router.get('/shifts/schedule',
  authenticate,
  staffController.getShiftSchedule
);

router.get('/shifts/my',
  authenticate,
  staffController.getMyShifts
);

router.post('/shifts/assign',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  validate({ body: assignShiftSchema }),
  staffController.assignShift
);

router.post('/shifts/swap-request',
  authenticate,
  validate({ body: swapRequestSchema }),
  staffController.swapShiftRequest
);

router.put('/shifts/swap/:swapId/approve',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  staffController.approveShiftSwap
);

// --- 4. Leave Management ---

router.post('/leave/apply',
  authenticate,
  validate({ body: applyLeaveSchema }),
  staffController.applyLeave
);

router.get('/leave/my',
  authenticate,
  staffController.getMyLeaves
);

router.get('/leave/balance',
  authenticate,
  staffController.getLeaveBalance
);

router.put('/leave/:id/approve',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  auditMiddleware,
  staffController.approveLeave
);

router.put('/leave/:id/reject',
  authenticate,
  authorize(['ADMIN', 'HR', 'MANAGER']),
  auditMiddleware,
  staffController.rejectLeave
);

router.delete('/leave/:id',
  authenticate,
  staffController.cancelLeave
);

// --- 5. Payroll ---

router.use('/payroll', additionalAccountantVerify); // Layer 2 security for payroll

router.post('/payroll/process',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate({ body: processPayrollSchema }),
  auditMiddleware,
  staffController.processPayroll
);

router.get('/payroll/my',
  authenticate,
  staffController.getMyPayslips
);

router.get('/payroll/my/:id/pdf',
  authenticate,
  staffController.getPayslipPDF
);

router.get('/payroll/:staffId',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
  staffController.getPayslipsByStaff // logic in controller
);

// --- 6. Training & Compliance ---

router.post('/training',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.scheduleTraining
);

router.post('/training/:trainingId/attend',
  authenticate,
  staffController.markTrainingAttendance
);

router.post('/training/:trainingId/certifications',
  authenticate,
  authorize(['ADMIN', 'HR']),
  uploadMiddleware.single('certification'),
  staffController.uploadCertification
);

router.get('/training/certifications/expiring',
  authenticate,
  authorize(['ADMIN', 'HR']),
  staffController.getExpiringCertifications
);

module.exports = router;
