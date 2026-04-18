const ambulanceService = require('./ambulance.service');
const Response = require('../../utils/response.util');
const { getIO } = require('../../config/socket');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger.util');

/**
 * Hospital Ambulance Fleet & Emergency Dispatch Controller
 * 
 * Orchestrated real-time GPS tracking, haversine-based dispatching, 
 * and mobile paramedic clinical documentation.
 */

/**
 * --- Fleet Management ---
 */

/**
 * @description Register a new ambulance vehicle into the fleet
 * @access PRIVATE [ADMIN]
 */
const registerAmbulance = async (req, res, next) => {
  try {
    const data = await ambulanceService.registerAmbulance(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Ambulance registered locally', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description List all fleet vehicles with near-real-time status
 * @access PRIVATE [STAFF]
 */
const listAmbulances = async (req, res, next) => {
  try {
    const data = await ambulanceService.listFleet(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Dispatch Orchestration ---
 */

/**
 * @description Dispatch nearest ambulance to emergency site
 * @access PRIVATE [DISPATCHER, ADMIN]
 */
const dispatchAmbulance = async (req, res, next) => {
  try {
    const data = await ambulanceService.dispatchAmbulance(req.params.dispatchId, req.body, req.user.id);
    
    // Synchronous Socket.io Alert to Driver
    const io = getIO();
    io.to(`driver_${data.driverId}`).emit('NEW_DISPATCH_ALERT', {
      dispatchId: data.id,
      location: data.pickupLocation,
      patientCondition: data.patientCondition
    });

    Response.sendSuccess(res, data, 'Ambulance dispatched - Driver notified');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Location Tracking (High-Frequency) ---
 */

/**
 * @description Ingest high-frequency GPS telemetry from driver mobile
 * @access PRIVATE [DRIVER]
 */
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return next(new Error('Valid GPS coordinates required'));

    // Fast-path processing
    await ambulanceService.updateTelemetry(req.params.id, { lat, lng });
    
    // Cache Busting for fleet status
    await redis.del('fleet:status');

    Response.sendSuccess(res, { timestamp: Date.now() }, 'Telemetry received', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Real-time fleet status dashboard (Cached)
 * @access PRIVATE [STAFF]
 */
const getAmbulanceStatus = async (req, res, next) => {
  try {
    const cacheKey = 'fleet:status';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return Response.sendSuccess(res, JSON.parse(cached), 'Cached fleet data');
    }

    const data = await ambulanceService.getGlobalFleetStatus();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 30); // 30s cache

    Response.sendSuccess(res, data, 'Real-time fleet data');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Trip Performance ---
 */

/**
 * @description Record trip completion (Fire-and-forget billing integration)
 * @access PRIVATE [DRIVER, PARAMEDIC]
 */
const completeTrip = async (req, res, next) => {
  try {
    const data = await ambulanceService.completeTrip(req.params.id, req.body, req.user.id);
    
    // Async Billing Integration (non-blocking)
    ambulanceService.triggerAsyncBilling(data.id).catch(err => {
      logger.error(`ASYNC_BILLING_FAILURE: Trip ${data.id}, Error: ${err.message}`);
    });

    Response.sendSuccess(res, data, 'Trip completed - Billing queued');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAmbulance,
  getAmbulanceById: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getAmbulance(req.params.id)),
  updateAmbulance: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.updateFleetItem(req.params.id, req.body)),
  deactivateAmbulance: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.deactivate(req.params.id)),
  listAmbulances,
  getAmbulanceStatus,
  createDispatchRequest: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.createRequest(req.body, req.user.id), 'Request created', 201),
  getDispatchById: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getDispatch(req.params.id)),
  dispatchAmbulance,
  cancelDispatch: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.cancel(req.params.id, req.body.reason)),
  listDispatches: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.listDispatches(req.query)),
  getActiveDispatches: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getActive()),
  updateLocation,
  getAmbulanceLocation: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getLocation(req.params.id)),
  getLocationHistory: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getHistory(req.params.id, req.query)),
  getETAToHospital: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getETA(req.params.id)),
  startTrip: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.startTrip(req.params.id, req.user.id)),
  recordTripVitals: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.recordVitals(req.params.id, req.body)),
  addTripNote: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.addNote(req.params.id, req.body, req.user.id)),
  completeTrip,
  getTripById: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getTrip(req.params.id)),
  getTripsByAmbulance: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getTripsByVehicle(req.params.id)),
  getTripsByPatient: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getTripsByPatient(req.params.patientId)),
  assignDriver: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.assignStaff(req.params.id, 'driver', req.body.staffId)),
  assignParamedic: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.assignStaff(req.params.id, 'paramedic', req.body.staffId)),
  getAmbulanceStaff: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getStaff(req.params.id)),
  scheduleMaintenace: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.scheduleService(req.params.id, req.body)),
  completeMaintenance: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.completeService(req.params.id, req.body)),
  getMaintenanceHistory: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getServiceHistory(req.params.id)),
  getServiceDueAlerts: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getAlerts()),
  getFleetReport: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getFleetReport()),
  getResponseTimeReport: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getResponseTimes(req.query)),
  getDriverPerformanceReport: async (req, res, next) => Response.sendSuccess(res, await ambulanceService.getPerformance(req.params.driverId))
};
