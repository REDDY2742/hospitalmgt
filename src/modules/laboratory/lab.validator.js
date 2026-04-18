const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Laboratory Diagnostic Validators
 */

const addLabTestSchema = Joi.object({
  testName: Joi.string().sanitize().min(3).max(150).required()
    .messages({ 'string.min': 'Test name must be at least 3 clinical characters long' }),
  
  testCode: Joi.string().uppercase().alphanum().max(20).required()
    .messages({ 'string.alphanum': 'Test code must contain only uppercase alphanumeric characters' }),
  
  category: Joi.string().valid(
    'hematology', 'biochemistry', 'microbiology', 'serology', 'immunology', 
    'histopathology', 'cytology', 'radiology', 'cardiology', 'neurology', 
    'endocrinology', 'toxicology', 'genetic'
  ).required(),
  
  sampleType: Joi.string().valid(
    'blood', 'urine', 'stool', 'sputum', 'swab', 'csf', 'biopsy', 
    'pus', 'fluid', 'saliva', 'hair', 'nail'
  ).required(),
  
  sampleVolume: Joi.string().required(), // e.g., "3ml"
  unit: Joi.string().required(), // e.g., "mg/dL"
  method: Joi.string().optional(),
  equipment: Joi.string().optional(),
  
  turnaroundTimeHours: Joi.number().integer().min(1).max(720).required()
    .messages({ 'number.max': 'Max TAT cannot exceed 30 days (720 hours)' }),
  
  cost: Joi.number().integer().min(0).required(), // paise
  requiresFasting: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  department: Joi.string().required(),
  instructions: Joi.string().sanitize().max(500).optional()
});

const addReferenceRangesSchema = Joi.object({
  testId: Joi.string().uuid().required(),
  ranges: Joi.array().items(Joi.object({
    gender: Joi.string().valid('male', 'female', 'all').required(),
    ageMin: Joi.number().integer().min(0).required(),
    ageMax: Joi.number().integer().min(0).max(120).required(),
    normalMin: Joi.number().required(),
    normalMax: Joi.number().required(),
    criticalLow: Joi.number().optional(),
    criticalHigh: Joi.number().optional(),
    unit: Joi.string().required()
  }).custom((value, helpers) => {
    const { ageMin, ageMax, normalMin, normalMax, criticalLow, criticalHigh } = value;
    
    if (ageMin >= ageMax) return helpers.message('Minimum age must be less than maximum age');
    if (normalMin >= normalMax) return helpers.message('Normal minimum must be less than normal maximum');
    
    if (criticalLow !== undefined && criticalLow >= normalMin) {
      return helpers.message('Critical low (Panic) value must be less than the normal minimum limit');
    }
    if (criticalHigh !== undefined && criticalHigh <= normalMax) {
      return helpers.message('Critical high (Panic) value must be greater than the normal maximum limit');
    }
    
    return value;
  })).min(1).required()
});

const createLabOrderSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  tests: Joi.array().items(Joi.object({
    testId: Joi.string().uuid().required(),
    urgency: Joi.string().valid('routine', 'urgent', 'stat').required()
  })).min(1).max(30).required(),
  
  overallUrgency: Joi.string().valid('routine', 'urgent', 'stat').required()
    .messages({ 'any.only': 'For STAT orders, TAT must be communicated immediately to the lab supervisor' }),
  
  clinicalNotes: Joi.string().sanitize().min(5).max(1000).required(),
  sampleCollectionTime: Joi.date().iso().optional(),
  isFasting: Joi.boolean().default(false),
  clinicalDiagnosis: Joi.string().sanitize().max(500).optional()
});

const collectSampleSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  sampleType: Joi.string().required(),
  sampleId: Joi.string().required(), // Barcode/Accession
  collectedAt: Joi.date().iso().max('now').required()
    .messages({ 'date.max': 'Sample collection time cannot be in the future' }),
  
  sampleVolume: Joi.string().required(),
  condition: Joi.string().valid(
    'good', 'hemolyzed', 'lipemic', 'insufficient', 'contaminated', 'clotted'
  ).required(),
  storageTemperature: Joi.string().optional(),
  notes: Joi.string().sanitize().max(200).optional()
});

const rejectSampleSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  sampleId: Joi.string().required(),
  rejectionReason: Joi.string().valid(
    'insufficient_volume', 'hemolyzed', 'wrong_container', 'unlabeled', 
    'contaminated', 'clotted', 'leaked', 'temperature_breach'
  ).required(),
  notes: Joi.string().sanitize().min(10).max(500).required()
});

const enterLabResultsSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  results: Joi.array().items(Joi.object({
    testId: Joi.string().uuid().required(),
    value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    unit: Joi.string().required(),
    flag: Joi.string().valid(
      'normal', 'low', 'high', 'critical_low', 'critical_high', 'positive', 'negative'
    ).required(),
    instrument: Joi.string().optional(),
    notes: Joi.string().sanitize().max(500).optional()
  })).min(1).required(),
  technicianNotes: Joi.string().sanitize().max(1000).optional()
});

const addAddendumSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  addendum: Joi.string().sanitize().min(10).max(2000).required(),
  reason: Joi.string().sanitize().min(10).max(500).required()
});

const tatReportQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().max('now').required()
    .custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];
      if (startDate && (value - startDate) > (90 * 24 * 60 * 60 * 1000)) {
        return helpers.message('TAT report range cannot exceed 90 days');
      }
      return value;
    }),
  category: Joi.string().valid(
    'hematology', 'biochemistry', 'microbiology', 'serology', 'immunology', 
    'histopathology', 'cytology', 'radiology', 'cardiology', 'neurology', 
    'endocrinology', 'toxicology', 'genetic'
  ).optional(),
  technicianId: Joi.string().uuid().optional(),
  urgency: Joi.string().valid('routine', 'urgent', 'stat').optional()
});

module.exports = {
  addLabTestSchema,
  addReferenceRangesSchema,
  createLabOrderSchema,
  collectSampleSchema,
  rejectSampleSchema,
  enterLabResultsSchema,
  addAddendumSchema,
  tatReportQuerySchema
};
