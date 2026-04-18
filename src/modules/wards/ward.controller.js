const wardService = require('./ward.service');
const Response = require('../../utils/response.util');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger.util');

/**
 * Hospital Ward & Bed Operational Controller
 * 
 * Orchestrates physical capacity management, patient throughput, 
 * and housekeeping state-machine.
 */

/**
 * --- Ward Management ---
 */

/**
 * @description Create a new hospital ward
 * @access PRIVATE [ADMIN]
 */
const createWard = async (req, res, next) => {
  try {
    const data = await wardService.createWard(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Ward created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get ward metadata by ID
 * @access PRIVATE [STAFF]
 */
const getWardById = async (req, res, next) => {
  try {
    const data = await wardService.getWardById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update ward configurations
 * @access PRIVATE [ADMIN]
 */
const updateWard = async (req, res, next) => {
  try {
    const data = await wardService.updateWard(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Ward updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Soft-delete a ward (Admin only)
 * @access PRIVATE [ADMIN]
 */
const deleteWard = async (req, res, next) => {
  try {
    await wardService.deleteWard(req.params.id, req.user.id);
    Response.sendSuccess(res, null, 'Ward deactivated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description List all wards with real-time occupancy stats
 * @access PRIVATE [STAFF]
 */
const listWards = async (req, res, next) => {
  try {
    const data = await wardService.listWards();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Generate occupancy analytical report for a ward
 * @access PRIVATE [ADMIN, SENIOR_NURSE]
 */
const getWardOccupancyReport = async (req, res, next) => {
  try {
    const data = await wardService.getWardReport(req.params.id, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Hospital-wide occupancy command center (Cached)
 * @access PRIVATE [ADMIN, MEDICAL_DIRECTOR]
 */
const getHospitalOccupancyDashboard = async (req, res, next) => {
  try {
    const cacheKey = 'dashboard:occupancy';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return Response.sendSuccess(res, JSON.parse(cached), 'Cached dashboard data', 200, { isCached: true });
    }

    const data = await wardService.getGlobalDashboard();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 120); // 2 min cache

    Response.sendSuccess(res, data, 'Real-time dashboard data', 200, { isCached: false });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Assign head nurse to lead a ward
 * @access PRIVATE [ADMIN]
 */
const assignHeadNurse = async (req, res, next) => {
  try {
    const data = await wardService.assignHeadNurse(req.params.id, req.body.nurseId);
    Response.sendSuccess(res, data, 'Head nurse assigned');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Bed Management ---
 */

/**
 * @description Add a new bed to a specific ward
 * @access PRIVATE [ADMIN]
 */
const addBed = async (req, res, next) => {
  try {
    const data = await wardService.addBed(req.params.wardId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Bed added', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Real-time bed availability (No-Cache)
 * @access PRIVATE [STAFF]
 */
const getBedAvailability = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const data = await wardService.getBedAvailability(req.params.wardId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Formal bed allocation to a patient
 * @access PRIVATE [ADMIN, DOCTOR]
 */
const allocateBed = async (req, res, next) => {
  try {
    const { wardId, bedId } = req.params;
    
    // Controller-side verification of ward/bed relationship
    const isValid = await wardService.verifyBedBelongsToWard(bedId, wardId);
    if (!isValid) {
      return next(new Error('Selected bed does not belong to the specified ward'));
    }

    const data = await wardService.allocateBed(req.body.patientId, bedId, req.user.id);
    Response.sendSuccess(res, data, 'Bed allocated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Release patient from bed (Post-discharge)
 * @access PRIVATE [NURSE, DOCTOR]
 */
const releaseBed = async (req, res, next) => {
  try {
    const data = await wardService.releaseBed(req.params.bedId, req.user.id);
    Response.sendSuccess(res, data, 'Bed released to cleaning status');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Intra-hospital patient transfer (Bed-to-Bed)
 * @access PRIVATE [ADMIN, DOCTOR]
 */
const transferPatient = async (req, res, next) => {
  try {
    const data = await wardService.transferPatient(req.params.bedId, {
      ...req.body,
      transferredBy: req.user.id
    });
    Response.sendSuccess(res, data, 'Patient transfer completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Mark bed for technical maintenance
 * @access PRIVATE [ADMIN, MAINTENANCE]
 */
const markBedMaintenance = async (req, res, next) => {
  try {
    const data = await wardService.setBedStatus(req.params.bedId, 'MAINTENANCE', req.user.id);
    Response.sendSuccess(res, data, 'Bed marked for maintenance');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Confirm housekeeping/cleaning completion
 * @access PRIVATE [NURSE, HOUSEKEEPING]
 */
const markBedCleaningDone = async (req, res, next) => {
  try {
    const data = await wardService.setBedStatus(req.params.bedId, 'AVAILABLE', req.user.id);
    Response.sendSuccess(res, data, 'Bed is now AVAILABLE');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Reporting ---
 */

/**
 * @description 30-day occupancy movement analytics
 * @access PRIVATE [ADMIN]
 */
const getOccupancyTrend = async (req, res, next) => {
  try {
    const data = await wardService.getOccupancyTrend();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Exports for all handlers
module.exports = {
  createWard,
  getWardById,
  updateWard,
  deleteWard,
  listWards,
  getWardOccupancyReport,
  getHospitalOccupancyDashboard,
  assignHeadNurse,
  addBed,
  getBedById: async (req, res, next) => Response.sendSuccess(res, await wardService.getBedById(req.params.id)),
  updateBed: async (req, res, next) => Response.sendSuccess(res, await wardService.updateBed(req.params.id, req.body)),
  listBeds: async (req, res, next) => Response.sendSuccess(res, await wardService.listBeds(req.params.wardId, req.query)),
  getBedAvailability,
  allocateBed,
  releaseBed,
  transferPatient,
  markBedMaintenance,
  markBedCleaningDone,
  getBedHistory: async (req, res, next) => Response.sendSuccess(res, await wardService.getBedHistory(req.params.bedId)),
  assignNurseToWard: async (req, res, next) => Response.sendSuccess(res, await wardService.assignNurse(req.params.id, req.body.nurseId)),
  getNursesByWard: async (req, res, next) => Response.sendSuccess(res, await wardService.getWardNurses(req.params.id)),
  getOccupancyTrend
};
