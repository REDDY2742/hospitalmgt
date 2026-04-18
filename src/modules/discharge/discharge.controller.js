const dischargeService = require('./discharge.service');
const Response = require('../../utils/response.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Discharge Management Controller
 * 
 * Orchestrates the clinical, financial, and regulatory finalization of 
 * inpatient stays, including WHO-standard summaries, DAMA protocols, 
 * and certificate verification.
 */

/**
 * --- Discharge Initiation & Readiness ---
 */

/**
 * @description Initiate the multi-step discharge sequence for a patient
 * @access PRIVATE [DOCTOR, ADMIN]
 */
const initiateDischarge = async (req, res, next) => {
  try {
    const data = await dischargeService.startDischargeProcess(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Discharge process initiated', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update specific checklist items (Clinical, Pharmacy, Billing, etc.)
 * @access PRIVATE [DOCTOR, NURSE, ADMIN]
 */
const updateDischargeChecklist = async (req, res, next) => {
  try {
    const data = await dischargeService.setChecklistStatus(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Discharge checklist updated');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical Documentation (Summaries) ---
 */

/**
 * @description Author the final clinical discharge summary
 * @access PRIVATE [DOCTOR]
 */
const createDischargeSummary = async (req, res, next) => {
  try {
    const data = await dischargeService.saveSummary(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Discharge summary created', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve and log access to the legal Discharge Summary PDF
 * @access PRIVATE [DOCTOR, STAFF]
 */
const getDischargeSummaryPDF = async (req, res, next) => {
  try {
    // Medical-Legal Audit Tracking
    logger.info(`MEDICO_LEGAL_DOC_ACCESS: Clinical Summary fetched for Discharge ${req.params.id} by User ${req.user.id}`);
    
    const stream = await dischargeService.generateSummaryPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Hard-Gated Finalization ---
 */

/**
 * @description Hard-gated finalization of clinical stay
 * @access PRIVATE [DOCTOR, ADMIN]
 */
const finalizeDischarge = async (req, res, next) => {
  try {
    const discharge = await dischargeService.getReadinessStatus(req.params.id);
    const pending = [];

    // 1. Structural Readiness Gating
    if (!discharge.checklistComplete) pending.push('Discharge checklist must be 100% complete');
    if (!discharge.summaryFinalized) pending.push('Clinical discharge summary must be finalized');
    if (discharge.billingStatus !== 'PAID' && discharge.billingStatus !== 'INSURANCE_APPROVED') {
       pending.push('Financial clearance required: Bill must be PAID or Insurance Approved');
    }

    if (pending.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discharge Finalization Blocked', 
        pendingActions: pending 
      });
    }

    const data = await dischargeService.finalize(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Stay finalized - Room release triggered');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Multi-signature double-confirmation step for hospital exit
 * @access PRIVATE [RECEPTIONIST, ADMIN]
 */
const confirmDischarge = async (req, res, next) => {
  try {
    const { confirmed, confirmationCode } = req.body;
    if (!confirmed || !confirmationCode) {
      return next(new Error('Double-confirmation requires explicit "confirmed: true" flag and verified code'));
    }

    const data = await dischargeService.executePhysicalExit(req.params.id, confirmationCode);
    Response.sendSuccess(res, data, 'Stay confirmed - Patient record closed');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Public Verification (Zero-Auth) ---
 */

/**
 * @description Publicly verify the authenticity of a Discharge Certificate
 * @access PUBLIC [EXTERNAL]
 */
const verifyDischargeCertificate = async (req, res, next) => {
  try {
    const certificate = await dischargeService.verifyCert(req.query.code);
    if (!certificate) return res.status(404).json({ valid: false, message: 'Invalid certificate code' });

    // Masked clinical data for privacy
    const maskedName = certificate.patientName.replace(/(?<=.{2}).(?=.*.{2})/g, '*');
    
    Response.sendSuccess(res, {
      valid: true,
      patientName: maskedName,
      hospitalName: process.env.HOSPITAL_NAME || 'Antigravity Hospital Nexus',
      dischargeDate: certificate.date
    }, 'Certificate verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- High-Risk Protocols (DAMA) ---
 */

/**
 * @description Initiate Discharge Against Medical Advice (High-Liability)
 * @access PRIVATE [DOCTOR, ADMIN]
 */
const initiatDAMA = async (req, res, next) => {
  try {
    const data = await dischargeService.startDAMA(req.params.admissionId, req.user.id);
    Response.sendSuccess(res, data, 'DAMA process initiated - Medico-legal monitoring active');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateDischarge,
  getDischargeById: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getById(req.params.id)),
  updateDischarge: async (req, res, next) => Response.sendSuccess(res, await dischargeService.updateRecord(req.params.id, req.body)),
  cancelDischarge: async (req, res, next) => Response.sendSuccess(res, await dischargeService.abort(req.params.id, req.body.reason)),
  getDischargeByAdmission: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getByAdmission(req.params.admissionId)),
  listDischarges: async (req, res, next) => Response.sendSuccess(res, await dischargeService.listAll(req.query)),
  getPendingDischarges: async (req, res, next) => Response.sendSuccess(res, await dischargeService.listPending()),
  getDischargeChecklist: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getChecklist(req.params.id)),
  updateDischargeChecklist,
  createDischargeSummary,
  updateDischargeSummary: async (req, res, next) => Response.sendSuccess(res, await dischargeService.modifySummary(req.params.id, req.body)),
  getDischargeSummary: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getSummary(req.params.id)),
  getDischargeSummaryPDF,
  submitSummaryForReview: async (req, res, next) => Response.sendSuccess(res, await dischargeService.setForReview(req.params.id)),
  addSummaryAddendum: async (req, res, next) => Response.sendSuccess(res, await dischargeService.addAddendum(req.params.id, req.body)),
  finalizeDischarge,
  confirmDischarge,
  generateDischargeCertificate: async (req, res, next) => Response.sendSuccess(res, await dischargeService.issueCertificate(req.params.id)),
  getDischargeCertificatePDF: async (req, res, next) => {
    const stream = await dischargeService.generateCertPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
  },
  verifyDischargeCertificate,
  initiatDAMA,
  recordDAMAConsent: async (req, res, next) => Response.sendSuccess(res, await dischargeService.saveConsent(req.params.id, req.file)),
  finalizeDAMA: async (req, res, next) => Response.sendSuccess(res, await dischargeService.completeDAMA(req.params.id, req.user.id)),
  scheduleFollowUp: async (req, res, next) => Response.sendSuccess(res, await dischargeService.addFollowUp(req.params.id, req.body)),
  getFollowUpsByPatient: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getPatientConsultations(req.params.patientId)),
  updateFollowUp: async (req, res, next) => Response.sendSuccess(res, await dischargeService.modifyFollowUp(req.params.id, req.body)),
  sendDischargeInstructions: async (req, res, next) => Response.sendSuccess(res, await dischargeService.resendInstructions(req.params.id)),
  getDischargeAnalytics: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getAnalytics()),
  getAverageStayReport: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getStayStats(req.query)),
  getReadmissionReport: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getReadmissionStats(req.query)),
  getDischargeSummaryComplianceReport: async (req, res, next) => Response.sendSuccess(res, await dischargeService.getComplianceReport())
};
