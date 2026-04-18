const express = require('express');
const router = express.Router();
const roomController = require('./room.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');

const {
  createRoomSchema,
  updateRoomSchema,
  allocateRoomSchema,
  maintenanceSchema,
  transferRoomSchema
} = require('./room.validator');

/**
 * Hospital Facilities & Room API Gateway
 * Base Path: /api/v1/rooms
 * 
 * Orchestrates clinical space allocation, high-fidelity sterilization 
 * cycles, and real-time census broadcasting.
 */

// Middleware to enforce zero-cache for availability routes
const noStore = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
};

router.use(authenticate); // Global requirement for all facilities routes

// --- 1. Room Management & Inventory ---

router.post('/', 
  authorize('ADMIN'), 
  validate({ body: createRoomSchema }), 
  auditMiddleware, 
  roomController.createRoom
);

router.get('/', authorize(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']), roomController.listRooms);
router.get('/search', roomController.searchRooms);

router.get('/availability', 
  noStore, 
  authorize(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']), 
  roomController.getRoomAvailability
);

router.get('/dashboard', authorize(['ADMIN', 'NURSE']), roomController.getHospitalRoomDashboard);
router.get('/by-ward/:wardId', roomController.getRoomsByWard);

router.get('/:roomId', roomController.getRoomById);
router.put('/:roomId', authorize('ADMIN'), validate({ body: updateRoomSchema }), auditMiddleware, roomController.updateRoom);
router.delete('/:roomId', authorize('ADMIN'), auditMiddleware, roomController.deactivateRoom);

router.get('/:roomId/availability', noStore, roomController.checkRoomAvailability);

router.get('/:roomId/calendar', 
  authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), 
  roomController.getRoomCalendar
);

router.get('/:roomId/occupancy-history', 
  authorize(['ADMIN', 'NURSE']), 
  roomController.getRoomOccupancyHistory
);

router.get('/:roomId/revenue', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  roomController.getRoomRevenue
);

// --- 2. Bed Allocation & Patient Transfer ---

router.post('/:roomId/allocate', 
  authorize(['DOCTOR', 'ADMIN', 'RECEPTIONIST']), 
  validate({ body: allocateRoomSchema }), 
  auditMiddleware, 
  roomController.allocateRoom
);

router.post('/:roomId/release', 
  authorize(['DOCTOR', 'NURSE', 'ADMIN']), 
  auditMiddleware, 
  roomController.releaseRoom
);

router.post('/:roomId/transfer', 
  authorize(['DOCTOR', 'ADMIN']), 
  validate({ body: transferRoomSchema }), 
  auditMiddleware, 
  roomController.transferPatientRoom
);

// --- 3. Maintenance & Sterilization ---

router.post('/:roomId/maintenance', 
  authorize('ADMIN'), 
  validate({ body: maintenanceSchema }), 
  auditMiddleware, 
  roomController.markRoomMaintenance
);

router.post('/:roomId/maintenance/complete', 
  authorize(['ADMIN', 'NURSE']), 
  auditMiddleware, 
  roomController.completeMaintenance
);

router.post('/:roomId/cleaning', 
  authorize(['NURSE', 'ADMIN']), 
  auditMiddleware, 
  roomController.markRoomCleaning
);

router.post('/:roomId/cleaning/complete', 
  authorize(['NURSE', 'ADMIN']), 
  auditMiddleware, 
  roomController.markCleaningComplete
);

// --- 4. Amenities & Financial Policy ---

router.put('/:roomId/amenities', authorize('ADMIN'), auditMiddleware, roomController.updateRoomAmenities);
router.get('/:roomId/amenities', roomController.getRoomAmenities);

router.put('/:roomId/charges', 
  authorize('ADMIN'), 
  auditMiddleware, 
  roomController.updateRoomCharges
);

// --- 5. Executive Reports ---

router.get('/reports/utilization', authorize('ADMIN'), roomController.getRoomUtilizationReport);

module.exports = router;
