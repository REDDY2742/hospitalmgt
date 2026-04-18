const Joi = require('../../utils/joi.extensions');

/**
 * Pharmaceutical Data Validation Engine
 * 
 * Enforces strict inventory control, clinical prescription auditing, 
 * and regulatory compliance for medical substance handling.
 */

const schemaOptions = {
  abortEarly: false,
  stripUnknown: true,
  errors: { label: 'key' }
};

/**
 * Medicine Master Record Validator
 */
const addMedicineSchema = Joi.object({
  name: Joi.string().sanitize().min(2).max(100).required()
    .messages({ 'string.min': 'Medicine name must be at least 2 characters long' }),
    
  genericName: Joi.string().sanitize().min(2).max(100).required()
    .messages({ 'string.min': 'Generic/Chemical name is required for clinical safety' }),
    
  brand: Joi.string().sanitize().required(),
  
  category: Joi.string().valid(
    'antibiotic', 'analgesic', 'antifungal', 'antiviral', 'cardiovascular', 
    'neurological', 'gastrointestinal', 'respiratory', 'hormonal', 
    'vitamin', 'controlled', 'other'
  ).required()
    .messages({ 'any.only': 'Invalid pharmaceutical category specified' }),
    
  form: Joi.string().valid(
    'tablet', 'capsule', 'syrup', 'injection', 'cream', 
    'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'powder'
  ).required()
    .messages({ 'any.only': 'Invalid dosage form specified' }),
    
  strength: Joi.string().required().example('500mg or 10mg/5ml'),
  
  manufacturer: Joi.string().sanitize().required(),
  
  hsnCode: Joi.string().length(8).pattern(/^\d+$/).required()
    .messages({ 'string.length': 'HSN Code must be exactly 8 digits for taxation compliance' }),
    
  gstPercentage: Joi.number().valid(0, 5, 12, 18, 28).required()
    .messages({ 'any.only': 'GST percentage must be a valid slab [0, 5, 12, 18, 28]' }),
    
  reorderLevel: Joi.number().integer().min(0).required()
    .messages({ 'number.min': 'Reorder level cannot be negative' }),
    
  minimumStock: Joi.number().integer().min(0).required(),
  
  isControlled: Joi.boolean().default(false),
  requiresPrescription: Joi.boolean().default(true)
}).options(schemaOptions);

/**
 * Inventory Batch Intake Validator
 */
const addBatchSchema = Joi.object({
  batchNumber: Joi.string().uppercase().required()
    .messages({ 'any.required': 'Batch number is mandatory for tracking' }),
    
  manufactureDate: Joi.date().max('now').required()
    .messages({ 'date.max': 'Manufacture date cannot be in the future' }),
    
  expiryDate: Joi.date().min(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).greater(Joi.ref('manufactureDate')).required()
    .messages({ 
      'date.min': 'Cannot accept stock with less than 30 days remaining shelf life',
      'date.greater': 'Expiry date must be after manufacture date'
    }),
    
  purchasePrice: Joi.number().positive().precision(2).required(),
  
  sellingPrice: Joi.number().positive().precision(2).min(Joi.ref('purchasePrice')).required()
    .messages({ 'number.min': 'Selling price cannot be lower than purchase price' }),
    
  quantity: Joi.number().integer().min(1).required(),
  
  supplierId: Joi.string().uuid().required(),
  purchaseOrderId: Joi.string().uuid().optional()
}).options(schemaOptions);

/**
 * Clinical Prescription Validator
 */
const createPrescriptionSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  
  medicines: Joi.array().items(Joi.object({
    medicineId: Joi.string().uuid().required(),
    dosage: Joi.string().required().example('1 tablet'),
    
    frequency: Joi.string().valid(
      'once_daily', 'twice_daily', 'thrice_daily', 'four_times_daily', 
      'every_6_hours', 'every_8_hours', 'as_needed', 'before_meals', 'after_meals'
    ).required()
      .messages({ 'any.only': 'Invalid dosage frequency selected' }),
      
    duration: Joi.number().integer().min(1).max(365).required()
      .messages({ 'number.max': 'Prescription duration cannot exceed 1 year' }),
      
    quantity: Joi.number().integer().min(1).required(),
    instructions: Joi.string().sanitize().max(200).optional()
  })).min(1).max(20).required()
    .messages({ 'array.max': 'A single prescription cannot contain more than 20 items' }),
    
  diagnosis: Joi.string().sanitize().min(5).max(500).required()
    .messages({ 'string.min': 'Clinical diagnosis must be at least 5 characters' }),
    
  notes: Joi.string().sanitize().max(1000).optional(),
  isUrgent: Joi.boolean().default(false)
}).options(schemaOptions);

/**
 * Prescription Dispensing Validator
 */
const dispensePrescriptionSchema = Joi.object({
  prescriptionId: Joi.string().uuid().required(),
  patientPresent: Joi.boolean().required(),
  collectedBy: Joi.string().sanitize().when('patientPresent', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'any.required': 'Receiver name is required if patient is not present' }),
  
  paymentMode: Joi.string().valid('cash', 'card', 'insurance', 'upi').required()
    .messages({ 'any.only': 'Accepted payment modes: cash, card, insurance, upi' }),
    
  notes: Joi.string().sanitize().max(200).optional()
}).options(schemaOptions);

/**
 * Stock Adjustment & Audit Correction Validator
 */
const stockAdjustmentSchema = Joi.object({
  medicineId: Joi.string().uuid().required(),
  
  adjustmentType: Joi.string().valid(
    'addition', 'deduction', 'damaged', 'expired_removal', 'audit_correction'
  ).required()
    .messages({ 'any.only': 'Invalid adjustment type specified' }),
    
  quantity: Joi.number().integer().min(1).required(),
  
  reason: Joi.string().sanitize().min(10).max(500).required()
    .messages({ 'string.min': 'Adjustment reason must be at least 10 characters for audit compliance' }),
    
  batchNumber: Joi.string().uppercase().optional()
}).options(schemaOptions);

module.exports = {
  addMedicineSchema,
  addBatchSchema,
  createPrescriptionSchema,
  dispensePrescriptionSchema,
  stockAdjustmentSchema
};
