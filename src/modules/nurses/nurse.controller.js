const nurseService = require('./nurse.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const AppError = require('../../utils/appError');

/**
 * Hospital Nursing & Patient Care Controller
 * 
 * Orchestrates nursing workforce lifecycles, critical vital monitoring, 
 * medication safety gating, and structured clinical handovers.
 */

/**
 * --- Nursing Workforce & Profile ---
 */

/**
 * @description Registers specialized nursing credentials and ward assignments
 * @access PRIVATE [ADMIN, HR]
 */
const createNurseProfile = async (req, res, next) => {
  try {
    const profile = await nurseService.createNurseProfile(req.body, req.user);
    Response.sendCreated(res, profile, 'Nursing profile initiated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Securely retrieves nursing license data for accreditation audits
 */
const getNurseLicense = async (req, res, next) => {
  try {
    const license = await nurseService.getLicense(req.params.nurseId);
    Response.sendSuccess(res, license, 'Nursing credentials retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical Monitoring & MAR ---
 */

/**
 * @description Records vital signs with automated NEWS2 escalation and alerting
 * @security X-Critical-Alert: true header for acute cases
 */
const recordVitals = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const vitals = await nurseService.recordVitals(patientId, req.user.id, req.body);
    
    // Add Alert Header for High-NEWS2 scores (Service returns critical flag)
    if (vitals.news2Score >= 7 || vitals.isCritical) {
      res.setHeader('X-Critical-Alert', 'true');
    }

    Response.sendSuccess(res, vitals, 'Vitals recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Enforces 5-rights medication administration with wristband scan
 * @security 5-Rights Data (Right Patient, Drug, Dose, Route, Time) must be present
 */
const performMedicationAdministration = async (req, res, next) => {
  try {
    const { patientIdScan, medicationBarcode, drugId, dose, route } = req.body;
    
    // Safety Gateway: Validate 5-Rights presence
    if (!patientIdScan || !medicationBarcode || !drugId || !dose || !route) {
      return next(new AppError('ClinicalSafetyError: Incomplete 5-rights data for medication administration', 400));
    }

    const result = await nurseService.performMedicationAdministration(req.params.patientId, req.user.id, req.body);
    Response.sendSuccess(res, result, 'Medication administered and recorded in MAR');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Shift Transitions & Handover ---
 */

/**
 * @description Finalizes clinical handover with receiver-side verification
 * @security Only the receiving nurse can acknowledge the shift transition
 */
const acknowledgeHandover = async (req, res, next) => {
  try {
    const handover = await nurseService.getHandoverById(req.params.handoverId);
    if (!handover) return next(new AppError('Handover record not found', 404));

    if (handover.toNurseId !== req.user.id) {
      return next(new AppError('Forbidden: Only the receiving nurse can acknowledge this handover', 403));
    }

    const result = await nurseService.acknowledgeHandover(req.params.handoverId, req.user.id);
    Response.sendSuccess(res, result, 'Shift handover formally acknowledged by receiving nurse');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Ward Intelligence ---
 */

/**
 * @description Retrieves a real-time status snapshot of all clinical tasks in the ward
 */
const getWardNursingStatus = async (req, res, next) => {
  try {
    const wardId = req.user.assignedWardId || req.params.wardId;
    if (!wardId) return next(new AppError('LocationError: Ward ID is required for nursing census', 400));

    const status = await nurseService.getWardNursingStatus(wardId, req.query.shift);
    Response.sendSuccess(res, status, 'Ward nursing census retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNurseProfile,
  getNurseById: async (req, res, next) => Response.sendSuccess(res, await nurseService.getNurseById(req.params.nurseId)),
  updateNurseProfile: async (req, res, next) => Response.sendSuccess(res, await nurseService.updateNurse(req.params.nurseId, req.body, req.user)),
  getNursesByWard: async (req, res, next) => Response.sendSuccess(res, await nurseService.getNursesByWard(req.params.wardId)),
  listNurses: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await nurseService.getAllNurses(req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  searchNurses: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await nurseService.searchNurses(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  uploadLicenseCertificate: async (req, res, next) => Response.sendSuccess(res, await nurseService.updateLicense(req.params.nurseId, req.file, req.user)),
  getNurseLicense,
  assignNurseToWard: async (req, res, next) => Response.sendSuccess(res, await nurseService.assignNurseToWard(req.params.nurseId, req.body.wardId, req.user)),
  removeNurseFromWard: async (req, res, next) => Response.sendSuccess(res, await nurseService.assignNurseToWard(req.params.nurseId, null, req.user)),
  transferNurse: async (req, res, next) => Response.sendSuccess(res, await nurseService.assignNurseToWard(req.params.nurseId, req.body.newWardId, req.user)),
  getWardAssignmentHistory: async (req, res, next) => Response.sendSuccess(res, await nurseService.getAssignmentHistory(req.params.nurseId)),
  assignPatientToNurse: async (req, res, next) => Response.sendSuccess(res, await nurseService.assignPatientToNurse(req.body.nurseId, req.body.patientId, req.user)),
  unassignPatient: async (req, res, next) => Response.sendSuccess(res, await nurseService.removePatientAssignment(req.body.nurseId, req.body.patientId, req.user)),
  getMyPatients: async (req, res, next) => Response.sendSuccess(res, await nurseService.getNurseWorkload(req.user.role === 'NURSE' ? req.user.id : req.params.nurseId)),
  getNurseWorkload: async (req, res, next) => Response.sendSuccess(res, await nurseService.getNurseWorkload(req.params.nurseId)),
  getWardNursingStatus,
  recordVitals,
  getPatientVitalsHistory: async (req, res, next) => Response.sendSuccess(res, await nurseService.getVitalsHistory(req.params.patientId, req.query)),
  addNursingNote: async (req, res, next) => Response.sendSuccess(res, await nurseService.recordNursingNote(req.params.patientId, req.user.id, req.body)),
  getNursingNotes: async (req, res, next) => Response.sendSuccess(res, await nurseService.getNursingNotes(req.params.patientId, req.query)),
  performMedicationAdministration,
  getMedicationAdministrationRecord: async (req, res, next) => Response.sendSuccess(res, await nurseService.getMAR(req.params.patientId, req.query)),
  withholdMedication: async (req, res, next) => Response.sendSuccess(res, await nurseService.withholdMedication(req.params.patientId, req.body, req.user)),
  initiateShiftHandover: async (req, res, next) => Response.sendSuccess(res, await nurseService.shiftHandover(req.user.id, req.body.toNurseId, req.user.assignedWardId, req.body)),
  completeShiftHandover: async (req, res, next) => Response.sendSuccess(res, await nurseService.completeHandover(req.params.handoverId, req.user)),
  acknowledgeHandover,
  getHandoverHistory: async (req, res, next) => Response.sendSuccess(res, await nurseService.getHandovers(req.query)),
  getHandoverPDF: async (req, res, next) => {
    const buffer = await nurseService.generateHandoverReport(req.params.handoverId);
    Response.sendFileResponse(res, buffer, `Handover_${req.params.handoverId}.pdf`, 'application/pdf');
  },
  createNursingCarePlan: async (req, res, next) => Response.sendSuccess(res, await nurseService.createCarePlan(req.params.patientId, req.body, req.user)),
  updateCarePlan: async (req, res, next) => Response.sendSuccess(res, await nurseService.updateCarePlan(req.params.planId, req.body, req.user)),
  getPatientCarePlan: async (req, res, next) => Response.sendSuccess(res, await nurseService.getCarePlan(req.params.patientId)),
  getNursePerformanceMetrics: async (req, res, next) => Response.sendSuccess(res, await nurseService.getPerformanceMetrics(req.params.nurseId, req.query)),
  getNursingDashboard: async (req, res, next) => Response.sendSuccess(res, await nurseService.getDashboard(req.query)),
  getPatientNursingHistory: async (req, res, next) => Response.sendSuccess(res, await nurseService.getPatientHistory(req.params.patientId))
};
