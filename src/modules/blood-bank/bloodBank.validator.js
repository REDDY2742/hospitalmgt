const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Blood Bank & Hematology Validators
 * 
 * Engineered for life-saving biological logic: donor eligibility tracking,
 * infectious marker screening, and emergency transfusion protocols.
 */

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const addBloodUnitSchema = Joi.object({
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  componentType: Joi.string().valid(
    'whole_blood', 'packed_rbc', 'fresh_frozen_plasma', 'platelets', 
    'cryoprecipitate', 'granulocytes', 'apheresis_platelets'
  ).required(),
  
  bagNumber: Joi.string().alphanum().min(8).max(15).required()
    .messages({ 'string.alphanum': 'Bag number must be alphanumeric (8-15 characters)' }),
  
  donorId: Joi.string().uuid().optional(),
  externalSource: Joi.string().sanitize().optional(),
  
  collectionDate: Joi.date().iso().max('now').required(),
  volume: Joi.number().integer().min(50).max(500).required(), // ml
  rhFactor: Joi.string().valid('positive', 'negative').required(),
  
  antibodyScreening: Joi.string().valid('negative', 'positive', 'pending').required(),
  
  infectiousMarkers: Joi.object({
    hiv: Joi.string().valid('negative', 'positive', 'pending').required(),
    hbsAg: Joi.string().valid('negative', 'positive', 'pending').required(),
    hcv: Joi.string().valid('negative', 'positive', 'pending').required(),
    vdrl: Joi.string().valid('negative', 'positive', 'pending').required(),
    malaria: Joi.string().valid('negative', 'positive', 'pending').required()
  }).required(),
  
  storageLocation: Joi.string().sanitize().max(50).required()
}).or('donorId', 'externalSource')
  .messages({ 'object.missing': 'At least one source (donorId or externalSource) must be provided for the blood unit' });

const createBloodRequestSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  componentType: Joi.string().valid(
    'whole_blood', 'packed_rbc', 'fresh_frozen_plasma', 'platelets', 
    'cryoprecipitate', 'granulocytes', 'apheresis_platelets'
  ).required(),
  
  unitsRequired: Joi.number().integer().min(1).max(20).required(),
  urgency: Joi.string().valid('routine', 'urgent', 'emergency', 'massive_transfusion').required(),
  clinicalIndication: Joi.string().sanitize().min(10).max(500).required(),
  
  requiredBy: Joi.date().iso().min(new Date(Date.now() + 30 * 60 * 1000)).required()
    .messages({ 'date.min': 'Required-by time must be at least 30 minutes in the future' }),
  
  crossmatchRequired: Joi.boolean().default(true),
  
  alternateBloodGroups: Joi.array().items(Joi.string().valid(...BLOOD_GROUPS)).optional(),
  
  specialRequirements: Joi.array().items(Joi.string().valid(
    'irradiated', 'leukodepleted', 'washed', 'cmv_negative', 
    'antigen_negative', 'pediatric_pack'
  )).optional()
}).custom((value, helpers) => {
  // Massive Transfusion Protocol: Bypass crossmatch for emergency O-Negative
  if (value.urgency === 'massive_transfusion') {
    value.crossmatchRequired = false;
  }
  return value;
});

const registerDonorSchema = Joi.object({
  firstName: Joi.string().sanitize().required(),
  lastName: Joi.string().sanitize().required(),
  
  dateOfBirth: Joi.date().iso().max('now - 18y').min('now - 65y').required()
    .messages({ 
      'date.max': 'Donor must be between 18 and 65 years of age',
      'date.min': 'Donor must be between 18 and 65 years of age'
    }),
  
  gender: Joi.string().valid('male', 'female').required(),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),
  phone: Joi.string().phone().required(),
  email: Joi.string().email().optional(),
  
  address: Joi.object({
    city: Joi.string().sanitize().required(),
    state: Joi.string().sanitize().required(),
    pincode: Joi.string().regex(/^\d{6}$/).required()
  }).required(),
  
  weight: Joi.number().min(45).required()
    .messages({ 'number.min': 'Donor must weigh at least 45 kg for safe collection' }),
  
  lastDonationDate: Joi.date().iso().max('now').optional(),
  
  medicalHistory: Joi.object({
    diabetes: Joi.boolean().required(),
    hypertension: Joi.boolean().required(),
    heartDisease: Joi.boolean().required(),
    hiv: Joi.boolean().required(),
    hepatitis: Joi.boolean().required(),
    recentTattoo: Joi.boolean().required(),
    recentSurgery: Joi.boolean().required(),
    pregnant: Joi.boolean().required(),
    recentTravel: Joi.string().sanitize().optional()
  }).required(),
  
  donorType: Joi.string().valid('voluntary', 'replacement', 'autologous').required()
});

const crossmatchSchema = Joi.object({
  requestId: Joi.string().uuid().required(),
  patientSampleId: Joi.string().sanitize().required(),
  donorUnitId: Joi.string().uuid().required(),
  
  method: Joi.string().valid(
    'immediate_spin', 'saline', 'antiglobulin', 'electronic'
  ).required(),
  
  result: Joi.string().valid(
    'compatible', 'incompatible', 'weakly_positive', 'pending'
  ).required(),
  
  notes: Joi.string().sanitize().max(500).optional()
});

module.exports = {
  addBloodUnitSchema,
  createBloodRequestSchema,
  registerDonorSchema,
  crossmatchSchema
};
