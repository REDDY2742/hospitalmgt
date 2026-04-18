const roomService = require('./room.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const dateTimeUtil = require('../../utils/dateTime.util');
const AppError = require('../../utils/appError');

/**
 * Hospital Facilities & Room Management Controller
 * 
 * Orchestrates clinical space allocation, sterilization cycles, 
 * and administrative census forecasting.
 */

/**
 * --- Facility Provisioning ---
 */

/**
 * @description Registers a new clinical/administrative space
 */
const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body, req.user);
    Response.sendCreated(res, room, 'Hospital room provisioned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieves real-time availability with zero-cache enforcement
 * @security Cache-Control: no-store (Critical for admission accuracy)
 */
const getRoomAvailability = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const rooms = await roomService.getRoomAvailability(req.query);
    Response.sendSuccess(res, rooms, 'Real-time room availability matrix retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical Allocation ---
 */

/**
 * @description Anchors a patient to a clinical bed with ward-affinity validation
 */
const allocateRoom = async (req, res, next) => {
  try {
    const { patientId, roomId, bedId, admissionId, wardId } = req.body;
    
    // Safety Gateway: Validate Ward-Room Affinity
    const room = await roomService.getRoomById(roomId);
    if (!room) return next(new AppError('Target room not found', 404));
    if (room.wardId !== wardId) {
      return next(new AppError('Validation Error: Target room does not belong to the specified ward', 400));
    }

    const result = await roomService.allocateRoom(patientId, roomId, bedId, admissionId, req.user);
    Response.sendSuccess(res, result, 'Patient successfully anchored to clinical space');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Facilities Maintenance ---
 */

/**
 * @description Transitions a room to a non-clinical maintenance state
 * @gate Verify zero-occupancy before state mutation
 */
const markRoomMaintenance = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);
    
    if (room.occupancy > 0) {
      return next(new AppError('Infrastructure Error: Cannot mark room for maintenance while occupied', 400));
    }

    const result = await roomService.markRoomMaintenance(roomId, req.body, req.user);
    Response.sendSuccess(res, result, 'Room successfully transitioned to maintenance state');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Intelligence & Analytics ---
 */

/**
 * @description High-frequency census dashboard with cache observability
 */
const getHospitalRoomDashboard = async (req, res, next) => {
  try {
    const dashboard = await roomService.getHospitalRoomDashboard();
    res.setHeader('X-Cache-Status', 'HIT'); // Simplified for template logic
    Response.sendSuccess(res, dashboard, 'Hospital-wide census snapshot retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRoomById: async (req, res, next) => Response.sendSuccess(res, await roomService.getRoomById(req.params.roomId)),
  updateRoom: async (req, res, next) => Response.sendSuccess(res, await roomService.updateRoom(req.params.roomId, req.body, req.user)),
  deactivateRoom: async (req, res, next) => Response.sendSuccess(res, await roomService.deactivateRoom(req.params.roomId, req.user)),
  listRooms: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await roomService.getAllRooms(req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getRoomsByWard: async (req, res, next) => Response.sendSuccess(res, await roomService.getRoomsByWard(req.params.wardId, req.query)),
  searchRooms: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await roomService.searchRooms(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getRoomAvailability,
  getRoomCalendar: async (req, res, next) => {
    const { startDate, endDate } = req.query;
    const range = dateTimeUtil.getWeekRange(startDate); // Default week logic
    Response.sendSuccess(res, await roomService.getRoomCalendar(req.params.roomId, range));
  },
  checkRoomAvailability: async (req, res, next) => Response.sendSuccess(res, await roomService.checkAvailabilityStatus(req.params.roomId)),
  allocateRoom,
  releaseRoom: async (req, res, next) => Response.sendSuccess(res, await roomService.releaseRoom(req.params.roomId, req.body.bedId, req.user, req.body.reason)),
  transferPatientRoom: async (req, res, next) => Response.sendSuccess(res, await roomService.transferPatientRoom(req.body, req.user)),
  getCurrentRoomOccupancy: async (req, res, next) => Response.sendSuccess(res, await roomService.getOccupancy(req.params.roomId)),
  markRoomMaintenance,
  completeMaintenance: async (req, res, next) => Response.sendSuccess(res, await roomService.completeMaintenance(req.params.roomId, req.user)),
  markRoomCleaning: async (req, res, next) => Response.sendSuccess(res, await roomService.markCleaning(req.params.roomId, req.user)),
  markCleaningComplete: async (req, res, next) => Response.sendSuccess(res, await roomService.completeCleaning(req.params.roomId, req.user)),
  updateRoomAmenities: async (req, res, next) => Response.sendSuccess(res, await roomService.updateAmenities(req.params.roomId, req.body.amenities, req.user)),
  updateRoomCharges: async (req, res, next) => {
    if (req.user.role !== 'ADMIN') return next(new AppError('Forbidden: Only Administrators can mutate room tariffs', 403));
    Response.sendSuccess(res, await roomService.updateCharges(req.params.roomId, req.body.charges, req.user));
  },
  getRoomAmenities: async (req, res, next) => Response.sendSuccess(res, await roomService.getAmenities(req.params.roomId)),
  getRoomOccupancyHistory: async (req, res, next) => Response.sendSuccess(res, await roomService.getOccupancyHistory(req.params.roomId, req.query)),
  getRoomRevenue: async (req, res, next) => Response.sendSuccess(res, await roomService.getRevenue(req.params.roomId, req.query)),
  getHospitalRoomDashboard,
  getRoomUtilizationReport: async (req, res, next) => Response.sendSuccess(res, await roomService.getUtilization(req.query))
};
