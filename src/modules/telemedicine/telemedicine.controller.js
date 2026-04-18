const telemedicineService = require('./telemedicine.service');
const Response = require('../../utils/response.util');
const logger = require('../../utils/logger.util');

/**
 * Telemedicine & Digital Consultation Controller
 * 
 * Orchestrates virtual healthcare encounters: Video room gatekeeping, 
 * secure e-prescriptions, and pre-consultation payment verification.
 */

/**
 * --- Consultation Management ---
 */

/**
 * @description Schedule a new video consultation
 * @access PRIVATE [PATIENT, STAFF]
 */
const scheduleConsultation = async (req, res, next) => {
  try {
    const data = await telemedicineService.scheduleTeleConsult(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Digital consultation scheduled', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description List upcoming digital consultations for a specific doctor
 * @access PRIVATE [DOCTOR]
 */
const getConsultationsByDoctor = async (req, res, next) => {
  try {
    const data = await telemedicineService.getDoctorConsultations(req.user.id, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Video Session Handlers ---
 */

/**
 * @description Generate secure Video API token (Agora/Twilio)
 * @access PRIVATE [DOCTOR, PATIENT]
 */
const generateVideoToken = async (req, res, next) => {
  try {
    const consult = await telemedicineService.getConsultationById(req.params.id);
    if (!consult) return next(new Error('Consultation not found'));

    // 1. Time-proximity Gate (±10 minute window)
    const now = new Date();
    const scheduledTime = new Date(consult.scheduledStartTime);
    const diffMins = Math.abs(now - scheduledTime) / (1000 * 60);

    if (diffMins > 10) {
      return next(new Error('Video room entry restricted. Room opens 10 minutes before the scheduled time.'));
    }

    const token = await telemedicineService.generateSecureVideoToken(req.params.id, req.user.id);
    Response.sendSuccess(res, { token }, 'Room access token generated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Patient-specific video room join logic
 * @access PRIVATE [PATIENT]
 */
const joinConsultation = async (req, res, next) => {
  try {
    const consult = await telemedicineService.getConsultationById(req.params.id);
    
    // 1. Ownership Validation
    if (consult.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You are not the registered patient for this consultation' });
    }

    const data = await telemedicineService.joinRoom(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Successfully joined consultation room');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical Documentation ---
 */

/**
 * @description Record secure clinical notes during/after session
 * @access PRIVATE [DOCTOR]
 */
const addConsultationNotes = async (req, res, next) => {
  try {
    const consult = await telemedicineService.getConsultationById(req.params.id);
    
    // 1. Identity Validation (Doctor-only)
    if (consult.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Clinical documents can only be authored by the assigned doctor' });
    }

    const data = await telemedicineService.saveConsultationNotes(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Clinical consultation notes saved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Financial Layer ---
 */

/**
 * @description Initiate pre-consultation payment request
 * @access PRIVATE [PATIENT]
 */
const initiatePayment = async (req, res, next) => {
  try {
    const consult = await telemedicineService.getConsultationById(req.params.id);
    
    if (consult.status !== 'SCHEDULED' || consult.paymentStatus === 'PAID') {
      return next(new Error('Payment can only be initiated for scheduled, unpaid consultations'));
    }

    const paymentLink = await telemedicineService.createPaymentOrder(req.params.id);
    Response.sendSuccess(res, paymentLink, 'Payment order created');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Verification of payment gateway cryptographic signature
 * @access PUBLIC [WEBHOOK]
 */
const verifyPayment = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
    const data = await telemedicineService.verifyPaymentSignature(req.body, signature);
    Response.sendSuccess(res, data, 'Payment verified and consultation confirmed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleConsultation,
  getConsultationById: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getConsultationById(req.params.id)),
  updateConsultation: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.updateConsult(req.params.id, req.body)),
  cancelConsultation: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.cancelConsult(req.params.id, req.body.reason)),
  rescheduleConsultation: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.reschedule(req.params.id, req.body.newTime)),
  listConsultations: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.listAll(req.query)),
  getConsultationsByPatient: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getPatientConsultations(req.user.id)),
  getConsultationsByDoctor,
  getUpcomingConsultations: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getUpcoming()),
  generateVideoToken,
  startConsultation: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.startSession(req.params.id, req.user.id)),
  endConsultation: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.endSession(req.params.id, req.user.id)),
  joinConsultation,
  getSessionStatus: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getRoomState(req.params.id)),
  addConsultationNotes,
  updateConsultationNotes: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.updateNotes(req.params.id, req.body)),
  getConsultationNotes: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getNotes(req.params.id)),
  addSymptoms: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.addSymptomLogs(req.params.id, req.body)),
  getConsultationSummary: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getSummary(req.params.id)),
  generateEPrescription: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.createEPrescription(req.params.id, req.body)),
  getEPrescription: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getPrescription(req.params.id)),
  getEPrescriptionPDF: async (req, res, next) => {
    const stream = await telemedicineService.getPrescriptionPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
  },
  sendEPrescriptionToPharmacy: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.routeToPharmacy(req.params.id)),
  scheduleFollowUp: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.addFollowUp(req.params.id, req.body)),
  createReferral: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.createSpecialistReferral(req.params.id, req.body)),
  getReferralById: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getReferral(req.params.id)),
  initiatePayment,
  verifyPayment,
  getPaymentStatus: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getPaymentStatus(req.params.id)),
  getDoctorOnlineAvailability: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getOnlineHours(req.params.doctorId)),
  setDoctorOnlineAvailability: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.setOnlineHours(req.user.id, req.body)),
  getAvailableDoctors: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getLiveDoctors()),
  getTeleMedicineDashboard: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getDashboard()),
  getConsultationAnalytics: async (req, res, next) => Response.sendSuccess(res, await telemedicineService.getAnalytics())
};
