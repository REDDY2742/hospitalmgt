const Joi = require('../../utils/joi.extensions');

/**
 * Telemedicine & Digital Care Validators
 * 
 * Engineered for high-fidelity virtual encounters: clinical history tracking,
 * secure digital prescribing, and rigorous doctor-availability scheduling.
 */

const HH_MM_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const TIME_MSG = "Please provide time in HH:MM format (24-hour)";

const scheduleConsultationSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  
  scheduledDate: Joi.date().iso().min('now').required()
    .messages({ 'date.min': 'Consultation must be scheduled for a future date' }),
  
  scheduledTime: Joi.string().regex(HH_MM_REGEX).required()
    .messages({ 'string.pattern.base': TIME_MSG }),
  
  // Logic: Must be at least 2 hours from now to allow for payment processing
  // This is handled via custom logic or simple future check in service, 
  // but Joi can help with basic date bounds.
  
  duration: Joi.number().valid(15, 30, 45, 60).required()
    .messages({ 'any.only': 'Consultation duration must be 15, 30, 45, or 60 minutes' }),
  
  consultationType: Joi.string().valid(
    'new_consultation', 'follow_up', 'second_opinion', 'specialist_referral', 'prescription_renewal'
  ).required(),
  
  previousConsultId: Joi.string().uuid().when('consultationType', {
    is: 'follow_up',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'any.required': 'Follow-up consultations require a reference to your previous appointment' }),
  
  chiefComplaint: Joi.string().sanitize().min(10).max(500).required()
    .messages({ 'string.min': 'Please provide a detailed description of your health concern (Min 10 characters)' }),
  
  symptoms: Joi.array().items(Joi.string().sanitize()).min(1).max(20).optional(),
  medicalHistory: Joi.string().sanitize().max(1000).optional(),
  currentMedications: Joi.array().items(Joi.string().sanitize()).optional(),
  
  reportUrls: Joi.array().items(Joi.string().uri()).max(10).optional(),
  
  preferredLanguage: Joi.string().valid(
    'english', 'hindi', 'tamil', 'telugu', 'kannada', 'bengali', 'marathi'
  ).optional(),
  
  deviceType: Joi.string().valid('mobile', 'tablet', 'laptop', 'desktop').optional()
});

const rescheduleConsultationSchema = Joi.object({
  newDate: Joi.date().iso().min('now').required(),
  newTime: Joi.string().regex(HH_MM_REGEX).required()
    .messages({ 'string.pattern.base': TIME_MSG }),
  reason: Joi.string().sanitize().min(10).max(500).required()
});

const addConsultationNotesSchema = Joi.object({
  chiefComplaint: Joi.string().sanitize().min(5).max(500).required(),
  historyOfPresentIllness: Joi.string().sanitize().min(10).max(3000).required(),
  pastMedicalHistory: Joi.string().sanitize().max(1000).optional(),
  familyHistory: Joi.string().sanitize().max(50).optional(),
  socialHistory: Joi.string().sanitize().max(500).optional(),
  reviewOfSystems: Joi.string().sanitize().max(1000).optional(),
  clinicalAssessment: Joi.string().sanitize().min(10).max(2000).required(),
  
  diagnosis: Joi.array().items(Joi.object({
    icd10Code: Joi.string().sanitize().optional(),
    description: Joi.string().sanitize().min(3).required()
  })).min(1).max(10).required(),
  
  managementPlan: Joi.string().sanitize().min(10).max(2000).required(),
  
  followUpRequired: Joi.boolean().required(),
  followUpDays: Joi.number().integer().min(1).max(365).when('followUpRequired', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  doctorNotes: Joi.string().sanitize().max(1000).optional()
});

const generateEPrescriptionSchema = Joi.object({
  medicines: Joi.array().items(Joi.object({
    name: Joi.string().sanitize().min(2).max(200).required(),
    genericName: Joi.string().sanitize().optional(),
    dosage: Joi.string().sanitize().required(),
    form: Joi.string().valid(
      'tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler'
    ).required(),
    frequency: Joi.string().valid(
      'once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 
      'every_6_hours', 'every_8_hours', 'as_needed', 'before_meals', 'after_meals'
    ).required(),
    duration: Joi.number().integer().min(1).max(365).required(), // days
    quantity: Joi.number().integer().min(1).required(),
    instructions: Joi.string().sanitize().max(300).optional()
  })).min(1).max(20).required(),
  
  additionalInstructions: Joi.string().sanitize().max(1000).optional(),
  dietaryAdvice: Joi.string().sanitize().max(500).optional(),
  activityRestrictions: Joi.string().sanitize().max(500).optional(),
  
  isControlledSubstance: Joi.boolean().default(false)
    .meta({ audit: 'ENHANCED_LOGGING_REQUIRED' })
});

const setDoctorAvailabilitySchema = Joi.object({
  onlineHours: Joi.array().items(Joi.object({
    dayOfWeek: Joi.string().valid(
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ).required(),
    startTime: Joi.string().regex(HH_MM_REGEX).required(),
    endTime: Joi.string().regex(HH_MM_REGEX).required(),
    slotDuration: Joi.number().valid(15, 30, 45, 60).required(),
    maxConsultations: Joi.number().integer().min(1).max(30).required(),
    isActive: Joi.boolean().default(true)
  })).min(1).max(7).required()
    .messages({ 'array.min': 'Please provide availability for at least one day' }),
  
  consultationFee: Joi.number().integer().min(0).required() // in paise
});

const cancelConsultationSchema = Joi.object({
  reason: Joi.string().sanitize().min(10).max(500).required()
    .messages({ 'string.min': 'Please provide a reason for cancellation (Min 10 characters)' }),
  refundRequested: Joi.boolean().default(true)
});

const videoTokenSchema = Joi.object({
  userType: Joi.string().valid('doctor', 'patient').required(),
  deviceInfo: Joi.object({
    browser: Joi.string().optional(),
    os: Joi.string().optional(),
    isMobile: Joi.boolean().optional()
  }).optional()
});

const addSymptomsSchema = Joi.object({
  symptoms: Joi.array().items(Joi.string().sanitize()).min(1).max(30).required(),
  symptomDuration: Joi.string().sanitize().max(100).required(),
  severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
  additionalNotes: Joi.string().sanitize().max(1000).optional(),
  currentMedications: Joi.array().items(Joi.string().sanitize()).optional(),
  allergies: Joi.array().items(Joi.string().sanitize()).optional()
});

module.exports = {
  scheduleConsultationSchema,
  rescheduleConsultationSchema,
  addConsultationNotesSchema,
  generateEPrescriptionSchema,
  setDoctorAvailabilitySchema,
  cancelConsultationSchema,
  videoTokenSchema,
  addSymptomsSchema
};
