const Joi = require('../../utils/joi.extensions');

/**
 * Healthcare Data Validation Layer
 * 
 * Enforces hospital-grade integrity for patient clinical records, 
 * vitals monitoring, and IPD admission lifecycle.
 */

const schemaOptions = {
  abortEarly: false,
  stripUnknown: true,
  errors: { label: 'key' }
};

/**
 * Comprehensive Patient Registration Schema
 */
const registerPatientSchema = Joi.object({
  firstName: Joi.string().sanitize().pattern(/^[A-Za-z]+$/).min(2).max(50).required()
    .messages({ 'string.pattern.base': 'First name must contain only alphabetic characters' }),
    
  lastName: Joi.string().sanitize().pattern(/^[A-Za-z]+$/).min(2).max(50).required()
    .messages({ 'string.pattern.base': 'Last name must contain only alphabetic characters' }),
    
  email: Joi.string().email().lowercase().optional(),
  
  phone: Joi.hospital().phoneNumber().required()
    .messages({ 'hospital.phone': 'Invalid primary mobile number format' }),
    
  alternatePhone: Joi.hospital().phoneNumber().optional(),
  
  dateOfBirth: Joi.date().max('now').greater('1-1-1904').required()
    .messages({ 'date.max': 'Date of birth cannot be in the future', 'date.greater': 'Patient age cannot exceed 120 years' }),
    
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').required(),
  
  bloodGroup: Joi.hospital().bloodGroup().required(),
  
  address: Joi.object({
    street: Joi.string().sanitize().required(),
    city: Joi.string().sanitize().required(),
    state: Joi.string().sanitize().required(),
    pincode: Joi.string().required(),
    country: Joi.string().sanitize().required()
  }).required(),
  
  emergencyContact: Joi.object({
    name: Joi.string().sanitize().required(),
    phone: Joi.hospital().phoneNumber().required(),
    relation: Joi.string().sanitize().required()
  }).required(),
  
  allergies: Joi.array().items(Joi.string().sanitize()).optional(),
  
  chronicConditions: Joi.array().items(Joi.string().sanitize()).optional(),
  
  insuranceProvider: Joi.string().sanitize().optional(),
  
  insurancePolicyNumber: Joi.string().when('insuranceProvider', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'any.required': 'Policy number is mandatory when insurance provider is specified' }),
  
  aadhaarNumber: Joi.string().length(12).pattern(/^\d+$/).optional()
    .messages({ 'string.length': 'Aadhaar number must be exactly 12 digits' }),
    
  profilePhoto: Joi.string().uri().optional()
}).options(schemaOptions);

/**
 * IPD Admission Schema
 */
const admitPatientSchema = Joi.object({
  wardId: Joi.string().uuid().required(),
  roomId: Joi.string().uuid().required(),
  bedId: Joi.string().uuid().required(),
  primaryDoctorId: Joi.string().uuid().required(),
  
  admissionType: Joi.string().valid(
    'emergency', 'elective', 'maternity', 'trauma', 'psychiatric'
  ).required(),
  
  admissionReason: Joi.string().sanitize().min(10).max(500).required(),
  
  estimatedStay: Joi.number().min(1).max(365).required()
    .messages({ 'number.max': 'Estimated stay cannot exceed 365 days' }),
    
  insurancePreAuth: Joi.boolean().optional()
}).options(schemaOptions);

/**
 * Clinical Vitals Monitoring Schema
 */
const addVitalsSchema = Joi.object({
  bloodPressureSystolic: Joi.number().min(60).max(250).required()
    .messages({ 'number.min': 'Systolic BP must be between 60-250 mmHg', 'number.max': 'Systolic BP must be between 60-250 mmHg' }),
    
  bloodPressureDiastolic: Joi.number().min(40).max(150).required()
    .messages({ 'number.min': 'Diastolic BP must be between 40-150 mmHg', 'number.max': 'Diastolic BP must be between 40-150 mmHg' }),
    
  pulse: Joi.number().min(30).max(220).required()
    .messages({ 'number.min': 'Pulse rate must be between 30-220 bpm' }),
    
  temperature: Joi.number().min(34).max(42).required()
    .messages({ 'number.min': 'Temperature must be between 34-42 °C' }),
    
  respiratoryRate: Joi.number().min(8).max(40).required()
    .messages({ 'number.min': 'Respiratory rate must be between 8-40 breaths/min' }),
    
  oxygenSaturation: Joi.number().min(70).max(100).required()
    .messages({ 'number.min': 'SpO2 must be between 70-100%' }),
    
  weight: Joi.number().min(0.5).max(500).required()
    .messages({ 'number.min': 'Weight must be realistically between 0.5kg and 500kg' }),
    
  height: Joi.number().min(30).max(250).required()
    .messages({ 'number.min': 'Height must be between 30cm and 250cm' }),
    
  bloodGlucose: Joi.number().optional(),
  notes: Joi.string().sanitize().max(500).optional()
}).options(schemaOptions);

/**
 * In-Hospital Transfer Schema
 */
const transferPatientSchema = Joi.object({
  newWardId: Joi.string().uuid().required(),
  newRoomId: Joi.string().uuid().required(),
  newBedId: Joi.string().uuid().required(),
  
  transferReason: Joi.string().sanitize().min(10).required(),
  newPrimaryDoctorId: Joi.string().uuid().optional()
}).options(schemaOptions);

module.exports = {
  registerPatientSchema,
  admitPatientSchema,
  addVitalsSchema,
  transferPatientSchema
};
