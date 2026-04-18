const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Appointment Scheduling & Queue Joi Custom Extensions
 */
const schedulingExtension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'scheduling.slot': 'Scheduling Protocol Error: Appointment time must be on a 15-minute boundary (e.g., :00, :15, :30, :45).',
    'scheduling.future': 'Availability Error: Selected appointment slot has already passed today.',
    'scheduling.transition': 'Workflow Error: Invalid status transition from {{#current}} to {{#requested}}.'
  },
  rules: {
    validateSlotTime: {
      validate(value, helpers) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(value)) return helpers.error('scheduling.slot');
        
        const minutes = parseInt(value.split(':')[1]);
        if (minutes % 15 !== 0) return helpers.error('scheduling.slot');
        
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(schedulingExtension);

/**
 * --- Clinical Booking Anchors ---
 */

const createAppointmentSchema = ExtendedJoi.object({
  patientId: ExtendedJoi.string().uuid().required(),
  doctorId: ExtendedJoi.string().uuid().required(),
  departmentId: ExtendedJoi.string().uuid().required(),
  appointmentDate: ExtendedJoi.date().iso().min('now').max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).required().messages({
    'date.min': 'Scheduling Error: Appointment date must be today or within 90 days',
    'date.max': 'Scheduling Error: Appointment date must be today or within 90 days'
  }),
  appointmentTime: ExtendedJoi.validateSlotTime().required(),
  appointmentType: ExtendedJoi.string().valid(
    'new_consultation', 'follow_up', 'procedure', 
    'telemedicine', 'second_opinion', 'emergency'
  ).required(),
  visitType: ExtendedJoi.string().valid('opd', 'ipd', 'daycare', 'emergency').required(),
  chiefComplaint: ExtendedJoi.string().min(5).max(500).required().messages({
    'string.min': 'Clinical Detail Error: Please describe chief complaint (minimum 5 characters)'
  }),
  priority: ExtendedJoi.string().valid('normal', 'urgent').default('normal'),
  referredByDoctorId: ExtendedJoi.string().uuid().optional(),
  insuranceId: ExtendedJoi.string().uuid().optional(),
  notes: ExtendedJoi.string().max(500).optional(),
  isFirstVisit: ExtendedJoi.boolean().default(false),
  preferredLanguage: ExtendedJoi.string().valid('english', 'hindi', 'tamil', 'telugu', 'kannada', 'bengali', 'marathi').optional()
}).custom((vals, helpers) => {
  // Logic: AppointmentDate + AppointmentTime must result in a future datetime
  const aptDateTime = new Date(`${vals.appointmentDate.toISOString().split('T')[0]}T${vals.appointmentTime}:00`);
  if (aptDateTime < new Date()) {
    return helpers.error('scheduling.future');
  }
  return vals;
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Workflow State Machine ---
 */

/**
 * @description Validates clinical lifecycle transitions
 * @stateTransitions 
 *   SCHEDULED → [confirmed, cancelled, rescheduled]
 *   CONFIRMED → [checked_in, cancelled, rescheduled, no_show]
 *   CHECKED_IN → [in_consultation, no_show]
 *   IN_CONSULTATION → [completed]
 */
const updateAppointmentStatusSchema = ExtendedJoi.object({
  status: ExtendedJoi.string().valid(
    'confirmed', 'checked_in', 'in_consultation', 
    'completed', 'no_show', 'cancelled', 'rescheduled'
  ).required(),
  notes: ExtendedJoi.string().max(500).optional(),
  actualStartTime: ExtendedJoi.date().iso().when('status', { is: 'in_consultation', then: ExtendedJoi.required() }),
  actualEndTime: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('actualStartTime')).when('status', { is: 'completed', then: ExtendedJoi.required() })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Logistics & Arrivals ---
 */

const checkInSchema = ExtendedJoi.object({
  arrivalTime: ExtendedJoi.date().iso().max('now').default(() => new Date()),
  verificationMethod: ExtendedJoi.string().valid('id_card', 'appointment_number', 'qr_code', 'verbal').required(),
  patientIdVerified: ExtendedJoi.boolean().valid(true).required().messages({
    'any.only': 'Identity Security Error: Patient identity must be verified before check-in'
  }),
  notes: ExtendedJoi.string().max(200).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Shift Transitions & Handover ---
 */

const completeAppointmentSchema = ExtendedJoi.object({
  actualDurationMinutes: ExtendedJoi.number().integer().min(1).max(480).required(),
  chiefComplaintResolved: ExtendedJoi.boolean().required(),
  followUpRequired: ExtendedJoi.boolean().required(),
  followUpDate: ExtendedJoi.date().iso().greater('now').when('followUpRequired', { is: true, then: ExtendedJoi.required() }),
  notes: ExtendedJoi.string().max(1000).optional(),
  diagnosisCodes: ExtendedJoi.array().items(ExtendedJoi.object({
    icd10Code: ExtendedJoi.string().optional(),
    description: ExtendedJoi.string().required()
  })).max(5).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Queue & Triage ---
 */

const reorderQueueSchema = ExtendedJoi.object({
  doctorId: ExtendedJoi.string().uuid().required(),
  date: ExtendedJoi.date().iso().min('now').required(),
  queue: ExtendedJoi.array().items(ExtendedJoi.object({
    appointmentId: ExtendedJoi.string().uuid().required(),
    newPosition: ExtendedJoi.number().integer().min(1).required()
  })).unique('appointmentId').unique('newPosition').min(1).required().messages({
    'array.unique': 'Queue Integrity Error: Duplicate appointments or positions in reorder request'
  }),
  reason: ExtendedJoi.string().min(5).max(200).required()
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema: ExtendedJoi.object({
    chiefComplaint: ExtendedJoi.string().min(5).max(500).optional(),
    notes: ExtendedJoi.string().max(500).optional()
  }).min(1).options({ abortEarly: false, stripUnknown: true }),
  rescheduleAppointmentSchema: ExtendedJoi.object({
    newDate: ExtendedJoi.date().iso().min('now').max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).required(),
    newTime: ExtendedJoi.validateSlotTime().required(),
    reason: ExtendedJoi.string().min(10).max(500).required().messages({
      'string.min': 'Logistics Error: Reschedule reason required (min 10 characters)'
    }),
    notifyPatient: ExtendedJoi.boolean().default(true),
    notifyDoctor: ExtendedJoi.boolean().default(true)
  }).options({ abortEarly: false, stripUnknown: true }),
  cancelAppointmentSchema: ExtendedJoi.object({
    reason: ExtendedJoi.string().min(5).max(500).required().messages({
      'string.min': 'Workflow Error: Cancellation reason required'
    }),
    suggestAlternative: ExtendedJoi.boolean().default(true)
  }).options({ abortEarly: false, stripUnknown: true }),
  bulkCancelSchema: ExtendedJoi.object({
    appointmentIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).max(50).required().messages({
      'array.max': 'Administrative Error: Bulk cancel accepts 1 to 50 appointments'
    }),
    reason: ExtendedJoi.string().min(10).required(),
    notifyPatients: ExtendedJoi.boolean().default(true),
    alternativeDoctorId: ExtendedJoi.string().uuid().optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  updateAppointmentStatusSchema,
  checkInSchema,
  completeAppointmentSchema,
  getAvailableSlotsQuerySchema: ExtendedJoi.object({
    doctorId: ExtendedJoi.string().uuid().required(),
    date: ExtendedJoi.date().iso().min('now').max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).required(),
    appointmentType: ExtendedJoi.string().optional(),
    includeBooked: ExtendedJoi.boolean().default(false)
  }).options({ abortEarly: false, stripUnknown: true }),
  getAvailableDoctorsQuerySchema: ExtendedJoi.object({
    departmentId: ExtendedJoi.string().uuid().required(),
    date: ExtendedJoi.date().iso().min('now').required(),
    time: ExtendedJoi.validateSlotTime().optional(),
    appointmentType: ExtendedJoi.string().optional(),
    page: ExtendedJoi.number().integer().min(1).default(1),
    limit: ExtendedJoi.number().integer().min(5).max(50).default(20)
  }).options({ abortEarly: false, stripUnknown: true }),
  appointmentListQuerySchema: ExtendedJoi.object({
    doctorId: ExtendedJoi.string().uuid().optional(),
    patientId: ExtendedJoi.string().uuid().optional(),
    status: ExtendedJoi.alternatives().try(ExtendedJoi.string(), ExtendedJoi.array()).optional(),
    startDate: ExtendedJoi.date().iso().optional(),
    endDate: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('startDate')).optional().custom((value, helpers) => {
      const diff = (new Date(value) - new Date(helpers.state.ancestors[0].startDate)) / (1000 * 60 * 60 * 24);
      if (diff > 90) return helpers.error('any.invalid', { message: 'Inquiry Error: Date range cannot exceed 90 days' });
      return value;
    }),
    page: ExtendedJoi.number().integer().min(1).default(1),
    limit: ExtendedJoi.number().integer().min(5).max(100).default(20),
    sortBy: ExtendedJoi.string().valid('appointmentDate', 'createdAt', 'status', 'doctorName', 'patientName').optional(),
    sortOrder: ExtendedJoi.string().valid('ASC', 'DESC').default('ASC')
  }).options({ abortEarly: false, stripUnknown: true }),
  reorderQueueSchema,
  appointmentStatsQuerySchema: ExtendedJoi.object({
    startDate: ExtendedJoi.date().iso().required(),
    endDate: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('startDate')).required().custom((value, helpers) => {
      const diff = (new Date(value) - new Date(helpers.state.ancestors[0].startDate)) / (1000 * 60 * 60 * 24);
      if (diff > 366) return helpers.error('any.invalid', { message: 'Analytics Error: Date range cannot exceed 366 days' });
      return value;
    })
  }).options({ abortEarly: false, stripUnknown: true }),
  sendReminderSchema: ExtendedJoi.object({
    channels: ExtendedJoi.array().items(ExtendedJoi.string().valid('email', 'sms', 'push')).min(1).required(),
    message: ExtendedJoi.string().max(300).optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  markUrgentSchema: ExtendedJoi.object({
    urgencyReason: ExtendedJoi.string().min(5).max(300).required(),
    notifyDoctor: ExtendedJoi.boolean().default(true)
  }).options({ abortEarly: false, stripUnknown: true })
};
