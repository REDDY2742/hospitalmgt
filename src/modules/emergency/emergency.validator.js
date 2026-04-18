const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Emergency Department (ED) Validators
 * 
 * Engineered for sub-second critical paths: Minimal registration checks 
 * and rigorous physiological triage validation.
 */

/**
 * FAST REGISTRATION SCHEMA
 * Designed for 10ms validation latency to allow immediate triage assignment.
 */
const registerEmergencyPatientSchema = Joi.object({
  firstName: Joi.string().sanitize().max(50).optional(),
  lastName: Joi.string().sanitize().max(50).optional(),
  
  unknownPatient: Joi.boolean().default(false),
  unknownPatientTag: Joi.string().sanitize().when('unknownPatient', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'any.required': 'Unknown Patient Tag (e.g., Unknown Male Adult) is required for unidentified arrivals' }),
  
  approximateAge: Joi.number().integer().min(0).max(120).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'unknown').required(),
  
  arrivalMode: Joi.string().valid(
    'walk_in', 'ambulance', 'police', 'referred', 'brought_by_relatives'
  ).required(),
  
  chiefComplaint: Joi.string().sanitize().min(3).max(500).required(),
  
  initialTriageLevel: Joi.string().valid(
    'P1_critical', 'P2_urgent', 'P3_less_urgent', 'P4_minor'
  ).required().messages({
    'any.only': 'P1_critical triage requires immediate senior doctor notification (Code Red Protocol)'
  }),
  
  callerName: Joi.string().sanitize().optional(),
  callerPhone: Joi.string().phone().optional(), // Using custom extension
  knownAllergies: Joi.string().sanitize().max(300).optional()
});

/**
 * CLINICAL TRIAGE & PHYSIOLOGICAL ASSESSMENT
 * Enforces NEWS2 (National Early Warning Score) and Glasgow Coma Scale (GCS) rigor.
 */
const triagePatientSchema = Joi.object({
  triageLevel: Joi.string().valid(
    'P1_critical', 'P2_urgent', 'P3_less_urgent', 'P4_minor'
  ).required(),
  
  // Vitals Validation (Physiological Bounds)
  bloodPressureSystolic: Joi.number().integer().min(40).max(300).required(),
  bloodPressureDiastolic: Joi.number().integer().min(20).max(200).required(),
  pulse: Joi.number().integer().min(0).max(300).required(),
  respiratoryRate: Joi.number().integer().min(0).max(60).required(),
  temperature: Joi.number().min(25).max(45).required(), // Celsius
  oxygenSaturation: Joi.number().integer().min(0).max(100).required(),
  
  glasgowComaScale: Joi.number().integer().min(3).max(15).required(), // GCS 3-15
  painScore: Joi.number().integer().min(0).max(10).required(), // 0-10 VAS
  
  mechanismOfInjury: Joi.string().sanitize().max(500).optional(),
  allergiesChecked: Joi.boolean().required(),
  drugAlcoholFlag: Joi.boolean().default(false),
  
  // NEWS2 is auto-calculated in service but can be verified here if passed
  news2Score: Joi.number().integer().min(0).max(20).optional(),
  
  chiefComplaint: Joi.string().sanitize().min(3).max(1000).required(),
  clinicalFindings: Joi.string().sanitize().min(10).max(2000).required(),
  triageNurseNotes: Joi.string().sanitize().max(1000).optional()
});

/**
 * LIFE-CRITICAL CODE PROTOCOLS
 */
const activateCodeSchema = Joi.object({
  emergencyId: Joi.string().uuid().optional(),
  codeType: Joi.string().valid(
    'CODE_BLUE', 'CODE_RED', 'CODE_PINK', 'CODE_ORANGE', 'CODE_WHITE', 'MCI'
  ).required(),
  location: Joi.string().sanitize().min(3).max(200).required(),
  description: Joi.string().sanitize().min(10).max(500).required(),
  additionalInfo: Joi.string().sanitize().max(500).optional(),
  requestedResources: Joi.array().items(Joi.string().sanitize()).optional()
});

/**
 * CLINICAL DOCUMENTATION (TREATMENT NOTES)
 */
const treatmentNoteSchema = Joi.object({
  noteType: Joi.string().valid(
    'doctor_note', 'nursing_note', 'procedure_note', 'medication_given', 'observation'
  ).required(),
  content: Joi.string().sanitize().min(10).max(3000).required(),
  vitalsTaken: Joi.boolean().default(false),
  medicationsGiven: Joi.array().items(Joi.string().sanitize()).optional()
});

/**
 * ER DISPOSITION & EXIT LOGIC
 */
const dispositionSchema = Joi.object({
  disposition: Joi.string().valid(
    'admitted', 'discharged', 'transferred', 'left_without_treatment', 
    'deceased', 'left_against_advice'
  ).required(),
  
  dispositionNotes: Joi.string().sanitize().min(10).max(1000).required(),
  followUpRequired: Joi.boolean().required(),
  followUpDate: Joi.date().iso().greater('now').optional()
    .messages({ 'date.greater': 'Follow-up date must be in the future' }),
  
  // Dynamic Conditionals
  wardId: Joi.string().uuid().when('disposition', {
    is: 'admitted',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  facilityName: Joi.string().sanitize().when('disposition', {
    is: 'transferred',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  transferReason: Joi.string().sanitize().when('disposition', {
    is: 'transferred',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // High-Sensitivity: Deceased Logic
  timeOfDeath: Joi.date().iso().when('disposition', {
    is: 'deceased',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  causeOfDeath: Joi.string().sanitize().min(5).when('disposition', {
    is: 'deceased',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  confirmed: Joi.boolean().valid(true).when('disposition', {
    is: 'deceased',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({ 'any.only': 'Mortality recording requires explicit double-confirmation [confirmed: true]' })
});

module.exports = {
  registerEmergencyPatientSchema,
  triagePatientSchema,
  activateCodeSchema,
  treatmentNoteSchema,
  dispositionSchema
};
