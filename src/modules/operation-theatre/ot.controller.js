const otService = require('./ot.service');
const Response = require('../../utils/response.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Operation Theatre & Surgical Workflow Controller
 * 
 * Orchestrates high-stakes surgical scheduling, safety gatekeeping, 
 * and intra-operative clinical documentation.
 */

/**
 * --- OT Scheduling ---
 */

/**
 * @description Book a surgical slot in an OT room
 * @access PRIVATE [SURGEON, ADMIN]
 */
const scheduleOperation = async (req, res, next) => {
  try {
    const data = await otService.scheduleOperation(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Surgery scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Cancel a surgical booking with mandatory reason
 * @access PRIVATE [SURGEON, ADMIN]
 */
const cancelOperation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new Error('Mandatory cancellation reason required'));
    
    await otService.cancelBooking(req.params.id, reason, req.user.id);
    Response.sendSuccess(res, null, 'Operation cancelled');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Safety Gatekeeping & Execution ---
 */

/**
 * @description Record start of surgical procedure (Mandatory Safety Gate)
 * @access PRIVATE [SURGEON, OT_NURSE]
 */
const startOperation = async (req, res, next) => {
  try {
    // Controller-level Critical Safety Gate
    const checklist = await otService.getChecklistStatus(req.params.id);
    if (!checklist || !checklist.isOneHundredPercentComplete) {
      return res.status(400).json({ 
        success: false, 
        message: 'SURGICAL STOP: Pre-operative checklist is NOT 100% complete. Entry to theatre blocked.' 
      });
    }

    const data = await otService.commenceSurgery(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Surgery commenced - Clock started');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Auto-saving partial intra-operative narratives
 * @access PRIVATE [SURGEON, ANESTHESIOLOGIST]
 */
const recordIntraOpNotes = async (req, res, next) => {
  try {
    // PATCH semantics: Partial updates for auto-save support
    const data = await otService.updateProcedureNotes(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Intra-op notes saved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Record surgical implant/device (Regulatory-Critical)
 * @access PRIVATE [SURGEON]
 */
const addImplantRecord = async (req, res, next) => {
  try {
    logger.info(`[REGULATORY_CRITICAL] Implant record addition initiated for Operation ${req.params.id} by User ${req.user.id}`);
    const data = await otService.addImplant(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Implant recorded and device-tracked');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Finalize surgery and trigger recovery workflow
 * @access PRIVATE [SURGEON]
 */
const endOperation = async (req, res, next) => {
  try {
    // Service handles async: billing update, bed release, notifications
    const data = await otService.finalizeSurgery(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Surgery finalized - Post-op workflow triggered');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Team & Recovery ---
 */

/**
 * @description Assign multi-disciplinary surgical team
 * @access PRIVATE [ADMIN, SENIOR_SURGEON]
 */
const assignOTTeam = async (req, res, next) => {
  try {
    const data = await otService.assignTeam(req.params.id, req.body.team);
    Response.sendSuccess(res, data, 'Surgical team assigned');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Transition patient to PACU/Recovery room
 * @access PRIVATE [ANESTHESIOLOGIST, OT_NURSE]
 */
const handoverToRecovery = async (req, res, next) => {
  try {
    const data = await otService.handoverToPACU(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Patient handed over to Recovery');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Room Management ---
 */

/**
 * @description Mark OT room as ready for next procedure
 * @access PRIVATE [ADMIN, HOUSEKEEPING_MANAGER]
 */
const markOTRoomReady = async (req, res, next) => {
  try {
    const data = await otService.setRoomStatus(req.params.roomId, 'READY', req.user.id);
    Response.sendSuccess(res, data, 'OT Room is now STERILE and READY');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleOperation,
  getOperationById: async (req, res, next) => Response.sendSuccess(res, await otService.getOpById(req.params.id)),
  updateOperationSchedule: async (req, res, next) => Response.sendSuccess(res, await otService.updateSchedule(req.params.id, req.body)),
  cancelOperation,
  getOTSchedule: async (req, res, next) => Response.sendSuccess(res, await otService.getSchedule(req.query.date, req.query.roomId)),
  getOTRoomAvailability: async (req, res, next) => Response.sendSuccess(res, await otService.getAvailability(req.query.date)),
  listOperations: async (req, res, next) => Response.sendSuccess(res, await otService.listOps(req.query)),
  assignOTTeam,
  updateOTTeam: async (req, res, next) => Response.sendSuccess(res, await otService.updateTeam(req.params.id, req.body.team)),
  getOTTeamByOperation: async (req, res, next) => Response.sendSuccess(res, await otService.getTeam(req.params.id)),
  getPreOpChecklist: async (req, res, next) => Response.sendSuccess(res, await otService.getChecklist(req.params.id)),
  updatePreOpChecklist: async (req, res, next) => Response.sendSuccess(res, await otService.updateChecklist(req.params.id, req.body)),
  markChecklistComplete: async (req, res, next) => Response.sendSuccess(res, await otService.completeChecklist(req.params.id, req.user.id)),
  addPreOpNote: async (req, res, next) => Response.sendSuccess(res, await otService.addPreOpNote(req.params.id, req.body, req.user.id)),
  startOperation,
  recordIntraOpNotes,
  updateIntraOpNotes: recordIntraOpNotes, // Support for auto-save PATCH
  addImplantRecord,
  endOperation,
  recordPostOpNotes: async (req, res, next) => Response.sendSuccess(res, await otService.recordPostOp(req.params.id, req.body, req.user.id)),
  handoverToRecovery,
  recordRecoveryVitals: async (req, res, next) => Response.sendSuccess(res, await otService.recordRecoveryVitals(req.params.id, req.body)),
  transferToWard: async (req, res, next) => Response.sendSuccess(res, await otService.transferFromRecovery(req.params.id, req.body, req.user.id)),
  createOTRoom: async (req, res, next) => Response.sendSuccess(res, await otService.createRoom(req.body), 'Room created', 201),
  updateOTRoom: async (req, res, next) => Response.sendSuccess(res, await otService.updateRoom(req.params.roomId, req.body)),
  getOTRooms: async (req, res, next) => Response.sendSuccess(res, await otService.getRooms()),
  markOTRoomMaintenance: async (req, res, next) => Response.sendSuccess(res, await otService.setRoomStatus(req.params.roomId, 'MAINTENANCE', req.user.id)),
  markOTRoomReady,
  getOTStats: async (req, res, next) => Response.sendSuccess(res, await otService.getOTStats()),
  getOTUtilizationReport: async (req, res, next) => Response.sendSuccess(res, await otService.getUtilization(req.query)),
  getSurgeonPerformanceReport: async (req, res, next) => Response.sendSuccess(res, await otService.getSurgeonPerformance(req.params.surgeonId)),
  getComplicationReport: async (req, res, next) => Response.sendSuccess(res, await otService.getComplications(req.query))
};
