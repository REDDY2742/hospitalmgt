const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Nursing & Clinical Workforce Validation Schemas
 * 
 * Enforced standards for registry-license integrity, acute vitals monitoring (NEWS2), 
 * medication safety (5-Rights), and structured SBAR handovers.
 */

const createNurseProfileSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  nursingLicenseNumber: Joi.string().min(5).max(30).required(),
  nursingCouncil: Joi.string().min(5).max(100).required(),
  licenseExpiryDate: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Regulatory Error: Nursing license must be valid and cannot be expired.'
  }),
  nursingSpecialization: Joi.string().valid(
    'general', 'icu', 'nicu', 'picu', 'pediatric', 'maternity', 
    'oncology', 'psychiatric', 'emergency', 'ot_scrub', 
    'cardiac_care', 'renal_care', 'neurology'
  ).required(),
  yearsOfExperience: Joi.number().integer().min(0).max(50).required(),
  qualifications: Joi.array().items(Joi.object({
    degree: Joi.string().required(), // e.g., "B.Sc Nursing"
    institution: Joi.string().required(),
    year: Joi.number().integer().min(1970).max(new Date().getFullYear()).required(),
    isRegistered: Joi.boolean().default(false)
  })).min(1).required(),
  skills: Joi.array().items(Joi.string()).max(20).optional(),
  preferredShift: Joi.string().valid('morning', 'afternoon', 'night', 'any').optional(),
  assignedWardId: Joi.string().uuid().optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Clinical Observation (Telemetry) ---
 */

const recordVitalsSchema = Joi.object({
  bloodPressureSystolic: Joi.number().integer().min(40).max(300).required(),
  bloodPressureDiastolic: Joi.number().integer().min(20).max(200).required(),
  pulse: Joi.number().integer().min(0).max(300).required(),
  temperature: Joi.number().min(28).max(45).required().messages({
    'number.min': 'Clinical Error: Temperature should be in Celsius (Range 28-45).',
    'number.max': 'Clinical Error: Temperature should be in Celsius (Range 28-45).'
  }),
  respiratoryRate: Joi.number().integer().min(0).max(60).required(),
  oxygenSaturation: Joi.number().integer().min(0).max(100).required(),
  painScore: Joi.number().integer().min(0).max(10).required(),
  bloodGlucose: Joi.number().min(10).max(800).optional(),
  urinaryOutput: Joi.number().integer().min(0).optional(),
  glasgowComaScale: Joi.number().integer().min(3).max(15).optional(), // NEWS2 trigger: GCS < 15
  pupilLeftReaction: Joi.string().valid('brisk', 'sluggish', 'fixed').optional(),
  pupilRightReaction: Joi.string().valid('brisk', 'sluggish', 'fixed').optional(),
  weight: Joi.number().min(0.5).max(500).optional(),
  fluidIntake: Joi.number().integer().min(0).optional(),
  notes: Joi.string().max(500).optional(),
  recordedAt: Joi.date().iso().max('now').optional().custom((value, helpers) => {
    const diff = (Date.now() - new Date(value)) / (1000 * 60);
    if (diff > 60) return helpers.error('RecordedAt error: Vitals cannot be backdated more than 1 hour.');
    return value;
  })
}).custom((vals, helpers) => {
  if (vals.bloodPressureSystolic <= vals.bloodPressureDiastolic) {
    return helpers.error('any.invalid', { message: 'Clinical Integrity Error: Systolic pressure must be greater than diastolic' });
  }
  return vals;
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Medication Safety (MAR) ---
 */

const medicationAdministrationSchema = Joi.object({
  prescriptionId: Joi.string().uuid().required(),
  medicineId: Joi.string().uuid().required(),
  scheduledTime: Joi.date().iso().required(),
  administeredAt: Joi.date().iso().required().custom((value, helpers) => {
    const sched = new Date(helpers.state.ancestors[0].scheduledTime);
    const diff = Math.abs((new Date(value) - sched) / (1000 * 60));
    if (diff > 30) return helpers.error('any.invalid', { message: 'Safety Error: Administration time exceeds 30-minute window from schedule.' });
    return value;
  }),
  dose: Joi.string().min(2).max(50).required(),
  route: Joi.string().valid('oral', 'iv', 'im', 'sc', 'sublingual', 'topical', 'inhalation', 'rectal', 'ophthalmic', 'nasal').required(),
  site: Joi.string().max(100).optional(),
  patientVerificationMethod: Joi.string().valid('wristband_check', 'verbal_confirmation', 'barcode_scan').required(),
  // The 5-Rights Gating: MUST all be explicitly true
  patientIdConfirmed: Joi.boolean().valid(true).required(),
  drugNameConfirmed: Joi.boolean().valid(true).required(),
  doseConfirmed: Joi.boolean().valid(true).required(),
  routeConfirmed: Joi.boolean().valid(true).required(),
  timeConfirmed: Joi.boolean().valid(true).required(),
  patientReaction: Joi.string().max(300).optional(),
  notes: Joi.string().max(500).optional()
}).messages({
  'any.only': 'Safety Protocol Error: All 5 medication rights must be confirmed before administration.'
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Professional Handover (SBAR) ---
 */

const addNursingNoteSchema = Joi.object({
  noteType: Joi.string().valid(
    'assessment', 'intervention', 'patient_education', 
    'evaluation', 'handover_note', 'incident_report', 
    'sbar', 'family_communication', 'wound_care'
  ).required(),
  content: Joi.string().min(10).max(5000).required(),
  isUrgent: Joi.boolean().default(false),
  sbar: Joi.object({
    situation: Joi.string().min(10).required(),
    background: Joi.string().min(10).required(),
    assessment: Joi.string().min(10).required(),
    recommendation: Joi.string().min(10).required()
  }).when('noteType', { is: 'sbar', then: Joi.required(), otherwise: Joi.optional() }),
  attachmentUrl: Joi.string().uri().optional()
}).options({ abortEarly: false, stripUnknown: true });

const shiftHandoverSchema = Joi.object({
  toNurseId: Joi.string().uuid().required(),
  wardId: Joi.string().uuid().required(),
  shiftType: Joi.string().valid('morning_to_afternoon', 'afternoon_to_night', 'night_to_morning').required(),
  patients: Joi.array().items(Joi.object({
    patientId: Joi.string().uuid().required(),
    situation: Joi.string().min(10).max(500).required(),
    background: Joi.string().min(10).max(500).required(),
    assessment: Joi.string().min(10).max(500).required(),
    recommendation: Joi.string().min(10).max(500).required(),
    pendingTasks: Joi.array().items(Joi.string()).optional(),
    urgentFlags: Joi.array().items(Joi.string()).optional(),
    painScore: Joi.number().integer().min(0).max(10).required()
  })).min(1).required(),
  generalWardNotes: Joi.string().max(1000).optional(),
  equipmentStatus: Joi.string().max(500).optional(),
  incidentsDuringShift: Joi.string().max(1000).optional()
}).options({ abortEarly: false, stripUnknown: true });

const assignPatientSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  isPrimary: Joi.boolean().default(false),
  shiftType: Joi.string().valid('morning', 'afternoon', 'night').required(),
  notes: Joi.string().max(300).optional()
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createNurseProfileSchema,
  updateNurseProfileSchema: Joi.object({
    nursingSpecialization: Joi.string().optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    preferredShift: Joi.string().optional()
  }).min(1).options({ abortEarly: false, stripUnknown: true }),
  recordVitalsSchema,
  addNursingNoteSchema,
  medicationAdministrationSchema,
  shiftHandoverSchema,
  assignPatientSchema,
  withholdMedicationSchema: Joi.object({
    drugId: Joi.string().uuid().required(),
    reason: Joi.string().min(10).max(500).required()
  }).options({ abortEarly: false, stripUnknown: true })
};
