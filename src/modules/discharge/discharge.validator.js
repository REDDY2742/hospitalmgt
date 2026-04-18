const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Discharge & Clinical Exit Validators
 * 
 * Engineered for high-fidelity clinical finalization: WHO-standard summaries,
 * triple-clearance accountability, and mission-critical DAMA protections.
 */

const HH_MM_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const initiateDischargeSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  admissionId: Joi.string().uuid().required(),
  
  anticipatedDischargeDate: Joi.date().iso().min('now').required()
    .messages({ 'date.min': 'Anticipated discharge date cannot be in the past' }),
  
  anticipatedDischargeTime: Joi.string().regex(HH_MM_REGEX).required()
    .messages({ 'string.pattern.base': 'Please provide time in HH:MM format (24-hour)' }),
  
  dischargeType: Joi.string().valid(
    'regular', 'against_medical_advice', 'transfer_to_facility', 'deceased', 'absconded'
  ).required(),
  
  primaryDoctorId: Joi.string().uuid().required(),
  estimatedBillAmount: Joi.number().integer().min(0).optional(), // in paise
  insuranceClaimInitiated: Joi.boolean().default(false),
  notes: Joi.string().sanitize().max(500).optional()
});

const createDischargeSummarySchema = Joi.object({
  admissionDiagnosis: Joi.string().sanitize().min(5).max(500).required(),
  
  finalDiagnosis: Joi.array().items(Joi.object({
    icd10Code: Joi.string().sanitize().optional(),
    description: Joi.string().sanitize().min(3).required()
  })).min(1).max(10).required()
    .meta({ checkDivergenceFromAdmission: true }), // Hint for clinical review if diagnosis changed
  
  clinicalCourse: Joi.string().sanitize().min(50).max(5000).required()
    .messages({ 'string.min': 'Clinical course narrative must be at least 50 characters for medico-legal adequacy' }),
  
  proceduresPerformed: Joi.array().items(Joi.object({
    procedureName: Joi.string().sanitize().required(),
    date: Joi.date().iso().required(),
    outcome: Joi.string().sanitize().required(),
    surgeon: Joi.string().sanitize().optional()
  })).max(20).optional(),
  
  significantLabValues: Joi.array().items(Joi.object({
    testName: Joi.string().sanitize().required(),
    value: Joi.string().sanitize().required(),
    unit: Joi.string().sanitize().required(),
    date: Joi.date().iso().required(),
    isAbnormal: Joi.boolean().default(false)
  })).max(30).optional(),
  
  medicationsDuringStay: Joi.array().items(Joi.string().sanitize()).max(50).optional(),
  
  dischargeMedications: Joi.array().items(Joi.object({
    name: Joi.string().sanitize().required(),
    dosage: Joi.string().sanitize().required(),
    frequency: Joi.string().sanitize().required(),
    duration: Joi.string().sanitize().required(),
    instructions: Joi.string().sanitize().optional()
  })).min(0).max(30).required(),
  
  dietaryInstructions: Joi.string().sanitize().min(5).max(1000).required(),
  activityInstructions: Joi.string().sanitize().min(5).max(1000).required(),
  woundCareInstructions: Joi.string().sanitize().max(500).optional(),
  
  warningSymptoms: Joi.array().items(Joi.string().sanitize()).min(1).max(20).required()
    .messages({ 'array.min': 'At least one warning symptom instruction is required for patient safety' }),
  
  dischargeCondition: Joi.string().valid(
    'recovered', 'improved', 'same', 'deteriorated', 'deceased'
  ).required(),
  
  // High-priority for Deceased condition
  timeOfDeath: Joi.date().iso().when('dischargeCondition', { is: 'deceased', then: Joi.required(), otherwise: Joi.optional() }),
  causeOfDeath: Joi.string().sanitize().when('dischargeCondition', { is: 'deceased', then: Joi.required(), otherwise: Joi.optional() }),
  
  complications: Joi.string().sanitize().max(1000).optional(),
  followUpDate: Joi.date().iso().greater('now').optional(),
  followUpDepartment: Joi.string().sanitize().optional(),
  referralNotes: Joi.string().sanitize().max(500).optional(),
  
  restrictions: Joi.object({
    driving: Joi.boolean().default(false),
    alcohol: Joi.boolean().default(false),
    smoking: Joi.boolean().default(false),
    workRestrictionDays: Joi.number().integer().min(0).default(0)
  }).optional()
});

const updateChecklistSchema = Joi.object({
  checklist: Joi.object({
    finalDiagnosisConfirmed: Joi.boolean().required(),
    dischargeSummaryComplete: Joi.boolean().required(),
    dischargeMedicationsPrescribed: Joi.boolean().required(),
    allInvestigationsReviewed: Joi.boolean().required(),
    billGenerated: Joi.boolean().required(),
    billPaidOrInsuranceApproved: Joi.boolean().required(),
    insurancePreClearance: Joi.boolean().required(),
    followUpScheduled: Joi.boolean().required(),
    patientCounselingDone: Joi.boolean().required(),
    familyCounselingDone: Joi.boolean().required(),
    dischargeInstructionsGiven: Joi.boolean().required(),
    valuablesReturned: Joi.boolean().required(),
    consentFormsComplete: Joi.boolean().required()
  }).required()
});

const finalizeDischargeSchema = Joi.object({
  actualDischargeTime: Joi.date().iso().max('now').required()
    .messages({ 'date.max': 'Actual discharge time cannot be in the future' }),
  
  transportArrangement: Joi.string().valid(
    'own', 'ambulance', 'hospital_vehicle', 'public'
  ).required(),
  
  escortedBy: Joi.string().sanitize().optional(),
  finalNotes: Joi.string().sanitize().max(500).optional()
});

const confirmDischargeSchema = Joi.object({
  confirmed: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Explicit physical exit confirmation is required' }),
  confirmationCode: Joi.string().length(6).required()
    .messages({ 'string.length': 'Please provide the 6-digit confirmation code' })
});

const initiatDAMASchema = Joi.object({
  reasonGivenByPatient: Joi.string().sanitize().min(10).max(1000).required(),
  doctorRecommendation: Joi.string().sanitize().min(10).max(1000).required(),
  
  risksExplained: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Medico-legal confirmation: Risks of DAMA must be explicitly explained' }),
  
  patientUnderstoodRisks: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Medico-legal confirmation: Patient must acknowledge high-risk understanding' }),
  
  witnessName: Joi.string().sanitize().min(2).max(100).required(),
  witnessRelation: Joi.string().sanitize().min(2).max(50).required(),
  legalGuardianRequired: Joi.boolean().default(false)
}).meta({ audit: 'MEDICO_LEGAL_CRITICAL' });

const scheduleFollowUpSchema = Joi.object({
  followUpDate: Joi.date().iso().greater('now').required(),
  followUpTime: Joi.string().regex(HH_MM_REGEX).required(),
  doctorId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().required(),
  purpose: Joi.string().sanitize().min(5).max(500).required(),
  reminderDays: Joi.array().items(Joi.number().integer().min(1)).required(),
  notes: Joi.string().sanitize().max(500).optional()
});

module.exports = {
  initiateDischargeSchema,
  createDischargeSummarySchema,
  updateChecklistSchema,
  finalizeDischargeSchema,
  confirmDischargeSchema,
  initiatDAMASchema,
  scheduleFollowUpSchema
};
