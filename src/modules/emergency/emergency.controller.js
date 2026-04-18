const emergencyService = require('./emergency.service');
const Response = require('../../utils/response.util');
const { getIO } = require('../../config/socket');
const logger = require('../../utils/logger.util');

/**
 * Hospital Emergency & Critical Care Controller
 * 
 * Orchestrates life-critical workflows with zero-latency priority 
 * and protocol-based clinical responses.
 */

/**
 * --- Patient Registration & Triage ---
 */

/**
 * @description Fast Emergency Registration (Sub-200ms target)
 * @access PRIVATE [RECEPTIONIST, NURSE, ADMIN]
 * @note EMERGENCY_LIMITER exemption: No rate limiting applied
 */
const registerEmergencyPatient = async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Fast path: Minimal fields, heavy lifting moved async or handled in service
    const data = await emergencyService.registerEmergencyPatient(req.body, req.user.id);
    
    const processingTime = Date.now() - startTime;
    if (processingTime > 200) {
      logger.warn(`ER_LATENCY_ALERT: Registration took ${processingTime}ms`);
    }

    Response.sendSuccess(res, data, 'Emergency patient registered', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get emergency record by ID
 * @access PRIVATE [ER_STAFF]
 */
const getEmergencyPatientById = async (req, res, next) => {
  try {
    const data = await emergencyService.getERPatientById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Formal Triage processing (Vitals + Severity)
 * @access PRIVATE [NURSE, DOCTOR]
 */
const triagePatient = async (req, res, next) => {
  try {
    const data = await emergencyService.triagePatient(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Triage assessment recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * @description List active ER floor patients by triage priority
 * @access PRIVATE [ER_STAFF]
 */
const listActiveERPatients = async (req, res, next) => {
  try {
    const data = await emergencyService.listActiveERPatients(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Code Protocols ---
 */

/**
 * @description Activate Hospital Protocol (Code Blue, Red, Pink)
 * @access PRIVATE [DOCTOR, NURSE, ADMIN]
 */
const activateCodeProtocol = async (req, res, next) => {
  try {
    const io = getIO();
    const { codeType, location } = req.body;

    // 1. Synchronous Broadcast (Zero-latency alert)
    io.of('/emergency').emit('CODE_PROTOCOL_ACTIVATED', {
      codeType,
      location,
      activatedBy: req.user.id,
      timestamp: Date.now()
    });

    // 2. Persistent Record Creation
    const data = await emergencyService.activateCodeProtocol(req.params.id, req.body.codeType, req.user.id);
    
    Response.sendSuccess(res, data, `${codeType} Protocol Activated Hospital-Wide`, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Log arrival time and identity of code responders
 * @access PRIVATE [STAFF]
 */
const logCodeResponse = async (req, res, next) => {
  try {
    const data = await emergencyService.logCodeResponse(req.params.codeId, {
      responderId: req.user.id,
      arrivalTime: new Date().toISOString()
    });
    Response.sendSuccess(res, data, 'Response time recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Disposition ---
 */

/**
 * @description Convert ER patient to In-Patient (IPD) Admission
 * @access PRIVATE [ADMIN, DOCTOR]
 */
const admitFromEmergency = async (req, res, next) => {
  try {
    const data = await emergencyService.admitFromEmergency(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Patient admitted to IPD');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Emergency Discharge (Disposition: Home/LAMA)
 * @access PRIVATE [DOCTOR]
 */
const dischargeFromEmergency = async (req, res, next) => {
  try {
    const data = await emergencyService.dischargeFromEmergency(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Emergency patient discharged');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Sensitive: Death certificate / Mortgage documentation
 * @access PRIVATE [ADMIN, SENIOR_DOCTOR]
 */
const recordDeceased = async (req, res, next) => {
  try {
    if (!req.body.confirmed) {
      return next(new Error('Double confirmation [confirmed: true] required for recording deceased status'));
    }

    const data = await emergencyService.recordDeceased(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Patient deceased status recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Dashboard & Reports ---
 */

/**
 * @description Real-time ER Operational Command Center
 * @access PRIVATE [ADMIN, ER_CHARGE_NURSE]
 */
const getERDashboard = async (req, res, next) => {
  try {
    const data = await emergencyService.getERDashboard();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerEmergencyPatient,
  getEmergencyPatientById,
  updateEmergencyPatient: async (req, res, next) => Response.sendSuccess(res, await emergencyService.updatePatient(req.params.id, req.body)),
  triagePatient,
  updateTriage: async (req, res, next) => Response.sendSuccess(res, await emergencyService.updateTriage(req.params.id, req.body)),
  listActiveERPatients,
  addTreatmentNote: async (req, res, next) => Response.sendSuccess(res, await emergencyService.addNote(req.params.id, req.body, req.user.id)),
  updateVitals: async (req, res, next) => Response.sendSuccess(res, await emergencyService.updateVitals(req.params.id, req.body)),
  orderEmergencyLab: async (req, res, next) => Response.sendSuccess(res, await emergencyService.orderLab(req.params.id, req.body, req.user.id)),
  orderEmergencyMedication: async (req, res, next) => Response.sendSuccess(res, await emergencyService.orderMedication(req.params.id, req.body, req.user.id)),
  escalateEmergency: async (req, res, next) => Response.sendSuccess(res, await emergencyService.escalate(req.params.id, req.body, req.user.id)),
  activateCodeProtocol,
  deactivateCodeProtocol: async (req, res, next) => Response.sendSuccess(res, await emergencyService.deactivateCode(req.params.codeId, req.user.id)),
  getActiveCodeProtocols: async (req, res, next) => Response.sendSuccess(res, await emergencyService.getActiveCodes()),
  logCodeResponse,
  admitFromEmergency,
  dischargeFromEmergency,
  transferToAnotherFacility: async (req, res, next) => Response.sendSuccess(res, await emergencyService.transfer(req.params.id, req.body, req.user.id)),
  recordDeceased,
  getERDashboard,
  getERWaitTimes: async (req, res, next) => Response.sendSuccess(res, await emergencyService.getWaitTimes()),
  getERPatientHistory: async (req, res, next) => Response.sendSuccess(res, await emergencyService.getHistory(req.params.patientId)),
  getERAnalyticsReport: async (req, res, next) => Response.sendSuccess(res, await emergencyService.getAnalytics(req.query)),
  getTriageSummary: async (req, res, next) => Response.sendSuccess(res, await emergencyService.getTriageSummary(req.params.id))
};
