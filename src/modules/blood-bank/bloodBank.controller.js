const bloodBankService = require('./bloodBank.service');
const Response = require('../../utils/response.util');
const { getIO } = require('../../config/socket');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger.util');

/**
 * Hospital Blood Bank & Hematology Controller
 * 
 * Orchestrates life-saving biological inventory, donor lifecycles, 
 * and thermal-compliant issuing protocols.
 */

// Helper to emit real-time inventory status changes
const emitStatusChange = (unitId, status) => {
  const io = getIO();
  io.to('blood-bank').emit('INVENTORY_STATUS_CHANGE', { unitId, status, timestamp: Date.now() });
};

/**
 * --- Blood Unit Management ---
 */

/**
 * @description Register a new blood unit/bag into inventory
 * @access PRIVATE [BLOOD_BANK_STAFF, ADMIN]
 */
const addBloodUnit = async (req, res, next) => {
  try {
    const data = await bloodBankService.addBloodUnit(req.body, req.user.id);
    emitStatusChange(data.id, data.status);
    Response.sendSuccess(res, data, 'Blood unit added to inventory', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Record biological discard of a unit
 * @access PRIVATE [BLOOD_BANK_MANAGER]
 */
const discardBloodUnit = async (req, res, next) => {
  try {
    const { reason, supervisorId } = req.body;
    if (!reason || !supervisorId) {
      return next(new Error('Discard reason and supervisor authentication required'));
    }
    const data = await bloodBankService.discardUnit(req.params.id, reason, supervisorId, req.user.id);
    emitStatusChange(req.params.id, 'DISCARDED');
    Response.sendSuccess(res, data, 'Blood unit discarded with audit trail');
  } catch (error) {
    next(error);
  }
};

/**
 * @description List current inventory summaries
 * @access PRIVATE [STAFF]
 */
const getBloodInventory = async (req, res, next) => {
  try {
    const data = await bloodBankService.getBloodBankInventory(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Blood Requests & Issuing ---
 */

/**
 * @description Physical issuance of blood unit to surgery/ward
 * @access PRIVATE [BLOOD_BANK_STAFF]
 */
const issueBlood = async (req, res, next) => {
  try {
    const { unitId, requestId } = req.body;

    // 1. Mandatory Crossmatch Verification
    const crossmatch = await bloodBankService.getCrossmatchRecord(unitId, requestId);
    if (!crossmatch || crossmatch.result !== 'COMPATIBLE') {
      return next(new Error('Cannot issue blood: Compatible crossmatch record not found for this unit'));
    }

    const data = await bloodBankService.issueBloodUnit(unitId, requestId, req.user.id);
    emitStatusChange(unitId, 'ISSUED');
    Response.sendSuccess(res, data, 'Blood unit issued successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Cold-chain compliant return of unused blood units
 * @access PRIVATE [BLOOD_BANK_STAFF, NURSE]
 */
const returnBloodUnit = async (req, res, next) => {
  try {
    const data = await bloodBankService.returnBloodUnit(req.params.id, req.body, req.user.id);
    emitStatusChange(req.params.id, 'AVAILABLE');
    Response.sendSuccess(res, data, 'Blood unit returned to inventory');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Dashboard & Matrices ---
 */

/**
 * @description Retrieve ABO/Rh Compatibility Matrix (Cached 24hr)
 * @access PRIVATE [ALL STAFF]
 */
const getCompatibilityMatrix = async (req, res, next) => {
  try {
    const cacheKey = 'matrix:blood_compatibility';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return Response.sendSuccess(res, JSON.parse(cached), 'Cached matrix data');
    }

    const data = await bloodBankService.getCompatibilityMatrix();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400); // 24hr cache

    Response.sendSuccess(res, data, 'Real-time matrix data');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Global blood bank operational overview
 * @access PRIVATE [ADMIN, MANAGER]
 */
const getBloodBankDashboard = async (req, res, next) => {
  try {
    const data = await bloodBankService.getBloodBankDashboard();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBloodUnit,
  getBloodUnitById: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getUnitById(req.params.id)),
  updateBloodUnit: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.updateUnit(req.params.id, req.body)),
  discardBloodUnit,
  getBloodInventory,
  getInventoryByBloodGroup: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getInventoryByGroup(req.params.group)),
  getExpiringUnits: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getExpiringUnits(req.query.days || 3)),
  getBloodUnitHistory: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getUnitHistory(req.params.id)),
  createBloodRequest: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.requestBloodUnit(req.body, req.user.id), 'Request created', 201),
  getBloodRequestById: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getRequestById(req.params.id)),
  updateBloodRequest: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.updateRequest(req.params.id, req.body)),
  cancelBloodRequest: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.cancelRequest(req.params.id, req.body.reason)),
  listBloodRequests: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.listRequests(req.query)),
  fulfillBloodRequest: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.fulfillRequest(req.params.id, req.body.unitIds)),
  issueBlood,
  returnBloodUnit,
  registerDonor: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.registerDonor(req.body), 'Donor registered', 201),
  getDonorById: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getDonorById(req.params.id)),
  updateDonor: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.updateDonor(req.params.id, req.body)),
  getDonorHistory: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getDonorHistory(req.params.id)),
  checkDonorEligibility: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.checkEligibility(req.params.id)),
  listDonors: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.listDonors(req.query)),
  scheduleBloodCamp: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.scheduleCamp(req.body), 'Camp scheduled', 201),
  recordDonation: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.recordDonation(req.body, req.user.id)),
  performCrossmatch: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.performCrossmatch(req.body, req.user.id)),
  getCrossmatchResult: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getCrossmatch(req.params.id)),
  getBloodBankDashboard,
  getCompatibilityMatrix,
  getConsumptionReport: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getConsumptionReport(req.query)),
  getCriticalStockAlerts: async (req, res, next) => Response.sendSuccess(res, await bloodBankService.getCriticalAlerts())
};
