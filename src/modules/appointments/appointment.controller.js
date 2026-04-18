const appointmentService = require('./appointment.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const AppError = require('../../utils/appError');

/**
 * Hospital Appointment Scheduling & Queue Management Controller
 * 
 * Orchestrates clinical consultation lifecycles, real-time OPD queue telemetry, 
 * doctor workstation synchronization, and administrative billing triggers.
 */

/**
 * --- Standard Scheduling CRUD ---
 */

/**
 * @description Reserves a new clinical slot with fail-fast availability check
 * @access PRIVATE [PATIENT, RECEPTIONIST, ADMIN]
 */
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime } = req.body;
    
    // 1. Fail-Fast: Controller-level slot pre-check
    const availability = await appointmentService.getAvailableSlots(doctorId, appointmentDate);
    const slot = availability.slots.find(s => s.time === appointmentTime);
    if (!slot || slot.status !== 'AVAILABLE') {
      return next(new AppError('AvailabilityError: Requested slot is physically unavailable or blocked', 409));
    }

    const appointment = await appointmentService.createAppointment(req.body, req.user);
    Response.sendCreated(res, appointment, 'Clinical appointment successfully scheduled');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieves full clinical context for an appointment
 * @access PRIVATE [DOCTOR, PATIENT, RECEPTIONIST, ADMIN]
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.appointmentId, req.user);
    Response.sendSuccess(res, appointment, 'Appointment details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Mass-cancellation of clinical slots (e.g., Physician Leave Scenario)
 * @access PRIVATE [ADMIN ONLY]
 */
const bulkCancelAppointments = async (req, res, next) => {
  try {
    const { appointmentIds, reason } = req.body;
    // 1. Safety Guard: Max 50 per operation
    if (!Array.isArray(appointmentIds) || appointmentIds.length > 50) {
      return next(new AppError('Protocol Error: Bulk operations are capped at 50 appointments per request', 400));
    }

    const result = await appointmentService.bulkCancel(appointmentIds, reason, req.user);
    Response.sendSuccess(res, result, 'Bulk cancellation completed and patients notified');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Queue & Telemetry Management ---
 */

/**
 * @description Serves a real-time snapshot of the doctor's OPD queue
 * @security X-Real-Time: true | Cache-Control: no-store
 */
const getAppointmentQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const queue = await appointmentService.getAppointmentQueue(doctorId, date);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Real-Time', 'true');
    
    Response.sendSuccess(res, queue, 'Real-time outpatient queue retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical Flow (Doctor Workstation) ---
 */

/**
 * @description Marks the commencement of a clinical consultation
 * @security Only the assigned physician can initiate the consultation
 */
const startConsultation = async (req, res, next) => {
  try {
    const appointment = await appointmentService.validateDoctorAffinity(req.params.appointmentId, req.user.id);
    if (!appointment) return next(new AppError('Forbidden: Only the assigned physician can start this consultation', 403));

    const result = await appointmentService.updateAppointmentStatus(req.params.appointmentId, 'IN_CONSULTATION', req.user.id);
    Response.sendSuccess(res, result, 'Consultation timer initiated');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Documents & Reports ---
 */

/**
 * @description Generates an OPD Consultation Slip with patient check-in validation
 */
const getConsultationSlipPDF = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.appointmentId);
    if (appointment.status !== 'CHECKED_IN') {
      return next(new AppError('FlowError: Consultation slips can only be generated after physical patient check-in', 400));
    }

    const { buffer, filename } = await appointmentService.generateOPDSlip(req.params.appointmentId);
    Response.sendFileResponse(res, buffer, filename, 'application/pdf');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointmentById,
  updateAppointment: async (req, res, next) => Response.sendSuccess(res, await appointmentService.updateAppointment(req.params.appointmentId, req.body, req.user)),
  cancelAppointment: async (req, res, next) => Response.sendSuccess(res, await appointmentService.cancelAppointment(req.params.appointmentId, req.body.reason, req.user)),
  rescheduleAppointment: async (req, res, next) => Response.sendSuccess(res, await appointmentService.rescheduleAppointment(req.params.appointmentId, req.body.newDate, req.body.newTime, req.body.reason, req.user)),
  listAppointments: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await appointmentService.getAll(req.query, params, req.user);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  searchAppointments: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await appointmentService.search(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  bulkCancelAppointments,
  getAvailableSlots: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getAvailableSlots(req.params.doctorId, req.query.date)),
  getDoctorAvailabilityCalendar: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getDoctorAvailabilityCalendar(req.params.doctorId, req.query.startDate, req.query.endDate)),
  getAvailableDoctors: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getAvailableDoctors(req.query.date, req.query.departmentId)),
  checkSlotAvailability: async (req, res, next) => Response.sendSuccess(res, await appointmentService.checkSlotAvailability(req.params.doctorId, req.query.date, req.query.time)),
  confirmAppointment: async (req, res, next) => Response.sendSuccess(res, await appointmentService.updateAppointmentStatus(req.params.appointmentId, 'CONFIRMED', req.user.id)),
  checkInPatient: async (req, res, next) => Response.sendSuccess(res, await appointmentService.updateAppointmentStatus(req.params.appointmentId, 'CHECKED_IN', req.user.id)),
  startConsultation,
  completeAppointment: async (req, res, next) => {
     const result = await appointmentService.updateAppointmentStatus(req.params.appointmentId, 'COMPLETED', req.user.id);
     Response.sendSuccess(res, result, 'Consultation completed and billing trigger dispatched');
  },
  markNoShow: async (req, res, next) => Response.sendSuccess(res, await appointmentService.updateAppointmentStatus(req.params.appointmentId, 'NO_SHOW', req.user.id)),
  markUrgent: async (req, res, next) => Response.sendSuccess(res, await appointmentService.updatePriority(req.params.appointmentId, 'urgent', req.user.id)),
  getAppointmentQueue,
  reorderQueue: async (req, res, next) => Response.sendSuccess(res, await appointmentService.reorderQueue(req.params.doctorId, req.body.queuePositions)),
  getQueuePosition: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getQueuePosition(req.params.appointmentId)),
  getEstimatedWaitTime: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getEstimatedWaitTime(req.params.appointmentId)),
  getAppointmentsByDoctor: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getByDoctor(req.params.doctorId, req.query)),
  getAppointmentsByPatient: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getByPatient(req.params.patientId, req.query)),
  getMyAppointments: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getMyAppointments(req.user.id)),
  getAppointmentsByDepartment: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getByDepartment(req.params.departmentId, req.query)),
  getTodayAppointments: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getToday(req.user)),
  getConsultationSlipPDF,
  getAppointmentConfirmationPDF: async (req, res, next) => {
    const { buffer, filename } = await appointmentService.generateConfirmationPDF(req.params.appointmentId);
    Response.sendFileResponse(res, buffer, filename, 'application/pdf');
  },
  getDailyReport: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getDailyReport(req.query.date)),
  getAppointmentStats: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getStats(req.query)),
  getNoShowReport: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getNoShowReport(req.query)),
  getDoctorUtilizationReport: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getDoctorUtilization(req.query)),
  getAppointmentTrend: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getTrend(req.query)),
  exportAppointmentReport: async (req, res, next) => Response.sendSuccess(res, await appointmentService.exportReport(req.query, req.user)),
  sendManualReminder: async (req, res, next) => Response.sendSuccess(res, await appointmentService.sendReminder(req.params.appointmentId, req.user.id)),
  getReminderLog: async (req, res, next) => Response.sendSuccess(res, await appointmentService.getReminderLog(req.params.appointmentId))
};
