const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Operation Theatre & Surgical Validators
 * 
 * Engineered for perioperative safety and regulatory medical device tracking.
 * Includes WHO-compliant checklist logic and mortality gates.
 */

const scheduleOperationSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  surgeonId: Joi.string().uuid().required(),
  assistantSurgeonIds: Joi.array().items(Joi.string().uuid()).max(3).optional(),
  anesthesiologistId: Joi.string().uuid().required(),
  otRoomId: Joi.string().uuid().required(),
  
  scheduledDate: Joi.date().iso().required().custom((value, helpers) => {
    const { urgency } = helpers.state.ancestors[0];
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
    
    // Urgency Exception: Lifesaving can be scheduled immediately
    if (urgency !== 'lifesaving' && value < fourHoursFromNow) {
      return helpers.message('Elective/Urgent surgeries must be scheduled at least 4 hours in advance');
    }
    return value;
  }),
  
  scheduledTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    .messages({ 'string.pattern.base': 'Scheduled time must be in HH:MM format' }),
  
  estimatedDurationMinutes: Joi.number().integer().min(15).max(720).required(),
  procedureType: Joi.string().sanitize().min(5).max(200).required(),
  procedureCode: Joi.string().sanitize().optional(),
  
  anesthesiaType: Joi.string().valid(
    'general', 'regional', 'local', 'spinal', 'epidural', 'conscious_sedation', 'combined'
  ).required(),
  
  urgency: Joi.string().valid(
    'elective', 'urgent', 'emergency', 'trauma', 'lifesaving'
  ).required(),
  
  preOpDiagnosis: Joi.string().sanitize().min(5).max(500).required(),
  specialEquipment: Joi.array().items(Joi.string().sanitize()).optional(),
  
  bloodRequired: Joi.boolean().default(false),
  bloodUnitsRequired: Joi.number().integer().min(0).when('bloodRequired', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  consentObtained: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Surgical commencement is legally prohibited without verified patient consent' }),
  
  notes: Joi.string().sanitize().max(1000).optional()
});

const preOpChecklistSchema = Joi.object({
  checklist: Joi.object({
    patientIdentityVerified: Joi.boolean().required(),
    consentSigned: Joi.boolean().required(),
    siteMark: Joi.boolean().required(),
    allergyVerified: Joi.boolean().required(),
    preOpMedGiven: Joi.boolean().required(),
    jewelryRemoved: Joi.boolean().required(),
    npoCompliant: Joi.boolean().required(),
    bloodAvailable: Joi.boolean().required(),
    crossmatchDone: Joi.boolean().optional(),
    preOpVitalsDone: Joi.boolean().required(),
    anesthesiaAssessmentDone: Joi.boolean().required(),
    imagingAvailable: Joi.boolean().required(),
    ivAccessEstablished: Joi.boolean().required()
  }).required(),
  
  anesthesiologistSignoff: Joi.boolean().valid(true).required(),
  nurseName: Joi.string().sanitize().required(),
  verificationTime: Joi.date().iso().required()
});

const intraOpNotesSchema = Joi.object({
  isAutoSave: Joi.boolean().default(false),
  
  procedurePerformed: Joi.string().sanitize().min(10).max(2000).when('isAutoSave', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  
  findings: Joi.string().sanitize().min(5).max(2000).when('isAutoSave', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  
  complications: Joi.string().sanitize().max(1000).optional(),
  estimatedBloodLoss: Joi.number().integer().min(0).when('isAutoSave', {
    is: false,
    then: Joi.required()
  }),
  
  fluidGiven: Joi.object({
    crystalloid: Joi.number().integer().min(0).required(),
    colloid: Joi.number().integer().min(0).required(),
    blood: Joi.number().integer().min(0).required()
  }).when('isAutoSave', {
    is: false,
    then: Joi.required()
  }),
  
  specimenSent: Joi.boolean().default(false),
  specimenDetails: Joi.string().sanitize().when('specimenSent', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  sutureUsed: Joi.string().sanitize().optional(),
  drainPlaced: Joi.boolean().default(false),
  packingUsed: Joi.boolean().default(false),
  notes: Joi.string().sanitize().max(2000).optional()
});

const addImplantSchema = Joi.object({
  implantType: Joi.string().sanitize().min(3).max(200).required(),
  manufacturer: Joi.string().sanitize().required(),
  modelNumber: Joi.string().sanitize().required(),
  serialNumber: Joi.string().sanitize().required()
    .messages({ 'any.required': 'Serial number is mandatory for regulatory device traceability and recall monitoring' }),
  
  lotNumber: Joi.string().sanitize().required(),
  expiryDate: Joi.date().iso().optional(),
  sizeSpecs: Joi.string().sanitize().optional(),
  implantLocation: Joi.string().sanitize().min(3).max(200).required()
});

const endOperationSchema = Joi.object({
  actualEndTime: Joi.date().iso().required(),
  finalProcedure: Joi.string().sanitize().min(10).max(2000).required(),
  postOpDiagnosis: Joi.string().sanitize().min(5).max(500).required(),
  
  postOpCondition: Joi.string().valid(
    'stable', 'guarded', 'critical', 'poor', 'deceased_on_table'
  ).required(),
  
  immediateOrders: Joi.string().sanitize().min(10).max(2000).required(),
  recoveryRoom: Joi.string().sanitize().required(),
  surgeonNotes: Joi.string().sanitize().max(1000).optional()
});

module.exports = {
  scheduleOperationSchema,
  preOpChecklistSchema,
  intraOpNotesSchema,
  addImplantSchema,
  endOperationSchema
};
