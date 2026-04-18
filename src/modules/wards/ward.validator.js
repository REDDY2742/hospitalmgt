const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Ward & Bed Management Validators
 */

const createWardSchema = Joi.object({
  wardName: Joi.string().sanitize().min(3).max(100).required(),
  wardCode: Joi.string().uppercase().alphanum().max(10).required(),
  wardType: Joi.string().valid(
    'general', 'icu', 'nicu', 'picu', 'maternity', 'surgical', 
    'orthopedic', 'pediatric', 'psychiatric', 'oncology', 
    'cardiac', 'neuro', 'burns', 'isolation', 'emergency'
  ).required(),
  floor: Joi.number().integer().min(0).max(50).required(),
  building: Joi.string().sanitize().optional(),
  totalBeds: Joi.number().integer().min(1).max(200).required(),
  chargePerDay: Joi.number().integer().min(0).required(), // paise
  facilities: Joi.array().items(Joi.string().sanitize()).optional(),
  headNurseId: Joi.string().uuid().optional(),
  description: Joi.string().sanitize().max(500).optional(),
  isActive: Joi.boolean().default(true)
});

const updateWardSchema = Joi.object({
  wardName: Joi.string().sanitize().min(3).max(100).optional(),
  wardCode: Joi.string().uppercase().alphanum().max(10).optional(),
  wardType: Joi.string().valid(
    'general', 'icu', 'nicu', 'picu', 'maternity', 'surgical', 
    'orthopedic', 'pediatric', 'psychiatric', 'oncology', 
    'cardiac', 'neuro', 'burns', 'isolation', 'emergency'
  ).optional(),
  floor: Joi.number().integer().min(0).max(50).optional(),
  building: Joi.string().sanitize().optional(),
  totalBeds: Joi.number().integer().min(1).max(200).optional()
    .messages({ 'number.min': 'Total beds cannot be reduced below current ward occupancy levels' }),
  chargePerDay: Joi.number().integer().min(0).optional(),
  facilities: Joi.array().items(Joi.string().sanitize()).optional(),
  headNurseId: Joi.string().uuid().optional(),
  description: Joi.string().sanitize().max(500).optional(),
  isActive: Joi.boolean().optional()
});

const addBedSchema = Joi.object({
  wardId: Joi.string().uuid().required(),
  bedNumber: Joi.string().regex(/^[A-Z0-9-]+$/i).max(10).required()
    .messages({ 'string.pattern.base': 'Bed number must be alphanumeric and can only include hyphens (e.g., A-101)' }),
  bedType: Joi.string().valid(
    'regular', 'icu', 'electric', 'pediatric', 'birthing', 'bariatric'
  ).required(),
  features: Joi.array().items(Joi.string().valid(
    'oxygen_port', 'suction', 'cardiac_monitor', 'ventilator_ready', 
    'call_button', 'side_rails', 'iv_pole'
  )).optional(),
  chargeOverridePerDay: Joi.number().integer().min(0).optional()
});

const allocateBedSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  wardId: Joi.string().uuid().required(),
  bedId: Joi.string().uuid().required(),
  primaryDoctorId: Joi.string().uuid().required(),
  admissionId: Joi.string().uuid().required(),
  allocationType: Joi.string().valid('planned', 'emergency', 'transfer').required(),
  notes: Joi.string().sanitize().max(500).optional()
});

const releaseBedSchema = Joi.object({
  bedId: Joi.string().uuid().required(),
  releaseReason: Joi.string().valid(
    'discharged', 'transferred', 'deceased', 'procedure', 'admin'
  ).required(),
  cleaningRequired: Joi.boolean().default(true),
  estimatedCleaningMinutes: Joi.number().integer().min(15).max(240).default(120),
  notes: Joi.string().sanitize().max(300).optional()
});

const transferPatientSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  fromBedId: Joi.string().uuid().required(),
  toBedId: Joi.string().uuid().required(),
  toWardId: Joi.string().uuid().required(),
  primaryDoctorId: Joi.string().uuid().optional(),
  transferReason: Joi.string().sanitize().min(10).max(500).required(),
  transferType: Joi.string().valid(
    'medical', 'patient_request', 'bed_management', 'upgrade', 'downgrade'
  ).required()
});

const markMaintenanceSchema = Joi.object({
  bedId: Joi.string().uuid().required(),
  maintenanceType: Joi.string().valid(
    'electrical', 'mechanical', 'cleaning_deep', 'mattress_replacement', 'inspection'
  ).required(),
  startDate: Joi.date().iso().min(new Date(Date.now() - 3600000)).required()
    .messages({ 'date.min': 'Maintenance start time cannot be more than 1 hour in the past' }),
  estimatedEndDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'Estimated end date must be after the start date' }),
  technician: Joi.string().sanitize().optional(),
  notes: Joi.string().sanitize().min(10).max(500).required()
});

const occupancyQuerySchema = Joi.object({
  wardId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required()
    .custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];
      if (startDate && (value - startDate) > (90 * 24 * 60 * 60 * 1000)) {
        return helpers.message('Occupancy query range cannot exceed 90 days');
      }
      return value;
    }),
  wardType: Joi.string().valid(
    'general', 'icu', 'nicu', 'picu', 'maternity', 'surgical', 
    'orthopedic', 'pediatric', 'psychiatric', 'oncology', 
    'cardiac', 'neuro', 'burns', 'isolation', 'emergency'
  ).optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'wardType').optional()
});

module.exports = {
  createWardSchema,
  updateWardSchema,
  addBedSchema,
  allocateBedSchema,
  releaseBedSchema,
  transferPatientSchema,
  markMaintenanceSchema,
  occupancyQuerySchema
};
