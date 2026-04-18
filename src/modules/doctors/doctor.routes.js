const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const {
  createDoctorSchema,
  updateScheduleSchema,
  blockSlotSchema,
  applyLeaveSchema,
  manageLeaveSchema
} = require('./doctor.validator');

/**
 * Doctor Management Gateway
 * Base Path: /api/v1/doctors
 */

// --- Admin & HR Oversight ---

/**
 * @route   POST /api/v1/doctors
 * @desc    Onboard a new physician and create clinical profile
 */
router.post('/',
  authenticate,
  authorize('doctors:create'),
  validate({ body: createDoctorSchema }),
  auditTrail,
  doctorController.createDoctor
);

/**
 * @route   GET /api/v1/doctors
 * @desc    List all physicians (HR view)
 */
router.get('/',
  authenticate,
  authorize('doctors:read_all'),
  doctorController.getAllDoctors
);

/**
 * @route   PUT /api/v1/doctors/:doctorId
 */
router.put('/:doctorId',
  authenticate,
  authorize('doctors:update'),
  auditTrail,
  doctorController.updateDoctor
);

/**
 * @route   DELETE /api/v1/doctors/:doctorId
 */
router.delete('/:doctorId',
  authenticate,
  authorize('doctors:delete'),
  auditTrail,
  doctorController.deleteDoctor
);

// --- Patient & Public Discovery ---

/**
 * @route   GET /api/v1/doctors/available
 */
router.get('/available',
  authenticate,
  authorize('doctors:read_available'),
  doctorController.getAvailableDoctors
);

/**
 * @route   GET /api/v1/doctors/by-department/:deptId
 */
router.get('/by-department/:deptId',
  authenticate,
  authorize('doctors:read_by_dept'),
  doctorController.getDoctorsByDept
);

/**
 * @route   GET /api/v1/doctors/by-specialization
 */
router.get('/by-specialization',
  authenticate,
  authorize('doctors:read_by_spec'),
  doctorController.getDoctorsBySpecialization
);

/**
 * @route   GET /api/v1/doctors/:doctorId/profile
 */
router.get('/:doctorId/profile',
  authenticate,
  authorize('doctors:read_profile'),
  doctorController.getDoctorProfile
);

/**
 * @route   GET /api/v1/doctors/:doctorId/availability
 */
router.get('/:doctorId/availability',
  authenticate,
  authorize('doctors:read_availability'),
  doctorController.getDoctorAvailability
);

// --- Physician Self-Management ---

/**
 * @route   GET /api/v1/doctors/my/profile
 */
router.get('/my/profile',
  authenticate,
  authorize('doctors:read_self'),
  doctorController.getMyProfile
);

/**
 * @route   PUT /api/v1/doctors/my/schedule
 */
router.put('/my/schedule',
  authenticate,
  authorize('doctors:update_self_schedule'),
  validate({ body: updateScheduleSchema }),
  auditTrail,
  doctorController.updateMySchedule
);

/**
 * @route   POST /api/v1/doctors/my/schedule/block
 */
router.post('/my/schedule/block',
  authenticate,
  authorize('doctors:block_self_slots'),
  validate({ body: blockSlotSchema }),
  auditTrail,
  doctorController.blockMySlot
);

/**
 * @route   POST /api/v1/doctors/my/leave
 */
router.post('/my/leave',
  authenticate,
  authorize('doctors:apply_leave'),
  validate({ body: applyLeaveSchema }),
  auditTrail,
  doctorController.applyMyLeave
);

/**
 * @route   GET /api/v1/doctors/my/patients
 */
router.get('/my/patients',
  authenticate,
  authorize('doctors:read_own_patients'),
  doctorController.getMyPatients
);

/**
 * @route   GET /api/v1/doctors/my/stats
 */
router.get('/my/stats',
  authenticate,
  authorize('doctors:read_own_stats'),
  doctorController.getMyStats
);

// --- Specialized Oversight ---

/**
 * @route   GET /api/v1/doctors/:doctorId/stats
 */
router.get('/:doctorId/stats',
  authenticate,
  authorize('doctors:read_stats'),
  doctorController.getDoctorStats
);

/**
 * @route   PUT /api/v1/doctors/:doctorId/leave/:leaveId
 */
router.put('/:doctorId/leave/:leaveId',
  authenticate,
  authorize('doctors:manage_leave'),
  validate({ body: manageLeaveSchema }),
  auditTrail,
  doctorController.manageLeave
);

module.exports = router;
