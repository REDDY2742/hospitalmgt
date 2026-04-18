const express = require('express');
const router = express.Router();
const wardController = require('./ward.controller'); // This will be implemented next
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const {
  createWardSchema,
  allocateBedSchema,
  transferBedSchema,
  releaseBedSchema,
  maintenanceSchema
} = require('./ward.validator');

/**
 * Ward & Bed Gateway
 * Base Path: /api/v1/wards
 */

// --- Ward Master Management ---

router.post('/',
  authenticate,
  authorize('wards:create'),
  validate({ body: createWardSchema }),
  auditTrail,
  wardController.createWard
);

router.get('/',
  authenticate,
  authorize('wards:read_all'),
  wardController.listWards
);

router.get('/occupancy-dashboard',
  authenticate,
  authorize('wards:read_dashboard'),
  wardController.getHospitalOccupancyDashboard
);

router.get('/:wardId',
  authenticate,
  authorize('wards:read_ward'),
  wardController.getWardById
);

router.put('/:wardId',
  authenticate,
  authorize('wards:update_ward'),
  auditTrail,
  wardController.updateWard
);

router.delete('/:wardId',
  authenticate,
  authorize('wards:delete_ward'),
  auditTrail,
  wardController.deleteWard
);

router.get('/:wardId/occupancy-report',
  authenticate,
  authorize('wards:read_report'),
  wardController.getWardOccupancyReport
);

// --- Bed Management & Real-time State ---

router.get('/:wardId/beds',
  authenticate,
  authorize('beds:read_list'),
  wardController.listBedsByWard
);

/**
 * High-frequency availability endpoint
 * Bypasses HTTP cache to rely on Redis mutex/cache for sub-second precision
 */
router.get('/:wardId/beds/availability',
  authenticate,
  authorize('beds:read_availability'),
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
  },
  wardController.getBedAvailability
);

router.post('/:wardId/beds',
  authenticate,
  authorize('beds:create_bed'),
  auditTrail,
  wardController.addBedToWard
);

router.put('/:wardId/beds/:bedId',
  authenticate,
  authorize('beds:update_bed'),
  auditTrail,
  wardController.updateBed
);

router.get('/:wardId/beds/:bedId',
  authenticate,
  authorize('beds:read_bed'),
  wardController.getBedById
);

router.post('/:wardId/beds/:bedId/allocate',
  authenticate,
  authorize('beds:allocate'),
  validate({ body: allocateBedSchema }),
  auditTrail,
  wardController.allocateBed
);

router.post('/:wardId/beds/:bedId/release',
  authenticate,
  authorize('beds:release'),
  validate({ body: releaseBedSchema }),
  auditTrail,
  wardController.releaseBed
);

router.post('/:wardId/beds/:bedId/transfer',
  authenticate,
  authorize('beds:transfer'),
  validate({ body: transferBedSchema }),
  auditTrail,
  wardController.transferPatient
);

router.post('/:wardId/beds/:bedId/maintenance',
  authenticate,
  authorize('beds:set_maintenance'),
  validate({ body: maintenanceSchema }),
  auditTrail,
  wardController.markBedMaintenance
);

router.post('/:wardId/beds/:bedId/cleaning-done',
  authenticate,
  authorize('beds:finish_cleaning'),
  auditTrail,
  wardController.finishCleaningManually
);

// --- Nursing Operations ---

router.post('/:wardId/assign-nurse',
  authenticate,
  authorize('wards:assign_nurse'),
  auditTrail,
  wardController.assignNurseToWard
);

router.get('/:wardId/nurses',
  authenticate,
  authorize('wards:read_nurses'),
  wardController.getWardNurses
);

module.exports = router;
