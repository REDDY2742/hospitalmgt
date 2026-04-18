const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Financial Data Validation Engine
 * 
 * Enforces absolute precision for monetary transactions, tax compliance (GST),
 * and secure multi-mode payment orchestration.
 */

const schemaOptions = {
  abortEarly: false,
  stripUnknown: true,
  errors: { label: 'key' }
};

/**
 * Bill Consolidation & Generation Validator
 */
const generateBillSchema = Joi.object({
  patientId: Joi.string().uuid().required()
    .messages({ 'string.uuid': 'Patient ID must be a valid UUID' }),
    
  admissionId: Joi.string().uuid().optional().when('billType', {
    is: 'IPD',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'any.required': 'Admission ID is mandatory for Inpatient (IPD) billing' }),
  
  billType: Joi.string().valid(
    'OPD', 'IPD', 'EMERGENCY', 'DAY_CARE', 'PHARMACY_ONLY', 'LAB_ONLY'
  ).required(),
  
  lineItems: Joi.array().items(Joi.object({
    category: Joi.string().valid(
      'consultation', 'room_charge', 'nursing', 'medicine', 
      'lab', 'procedure', 'ot', 'ambulance', 'misc'
    ).required(),
    
    description: Joi.string().sanitize().min(3).max(200).required(),
    quantity: Joi.number().min(0.5).required(),
    unitPrice: Joi.number().integer().min(0).required() // Paise
      .messages({ 'number.base': 'Unit price must be a valid integer in paise' }),
      
    hsnSacCode: Joi.string().sanitize().optional(),
    gstPercentage: Joi.number().valid(0, 5, 12, 18, 28).required(),
    discountPercentage: Joi.number().min(0).max(100).default(0)
  })).optional(),
  
  discountType: Joi.string().valid('none', 'percentage', 'fixed').default('none'),
  
  discountValue: Joi.number().min(0).when('discountType', {
    not: 'none',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  discountReason: Joi.string().sanitize().min(10).when('discountValue', {
    is: Joi.number().greater(0),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({ 'string.min': 'Discount reason must be at least 10 characters for audit compliance' }),
  
  insuranceClaimId: Joi.string().uuid().optional(),
  notes: Joi.string().sanitize().max(500).optional()
}).options(schemaOptions);

/**
 * Payment Transaction Validator (Supports Gateway Webhooks & Split Payments)
 */
const processPaymentSchema = Joi.object({
  billId: Joi.string().uuid().required(),
  amount: Joi.number().integer().min(1).required() // in paise
    .messages({ 'number.min': 'Payment amount must be at least 1 paisa' }),
    
  paymentMode: Joi.string().valid(
    'cash', 'card', 'upi', 'netbanking', 'insurance', 'cheque', 'mixed'
  ).required(),
  
  gatewayOrderId: Joi.string().when('paymentMode', {
    is: Joi.string().valid('card', 'upi', 'netbanking'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  gatewayPaymentId: Joi.string().when('paymentMode', {
    is: Joi.string().valid('card', 'upi', 'netbanking'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  gatewaySignature: Joi.string().when('paymentMode', {
    is: Joi.string().valid('card', 'upi', 'netbanking'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  splitPayments: Joi.array().items(Joi.object({
    mode: Joi.string().valid('cash', 'card', 'upi', 'netbanking', 'insurance', 'cheque').required(),
    amount: Joi.number().integer().min(1).required()
  })).when('paymentMode', {
    is: 'mixed',
    then: Joi.required().min(2),
    otherwise: Joi.optional()
  }).messages({ 'array.min': 'Mixed payment requires at least two split entries' }),
  
  notes: Joi.string().sanitize().max(200).optional(),
  cashierId: Joi.string().uuid().optional() // Usually from req.user
}).options(schemaOptions);

/**
 * Financial Refund Validator
 */
const refundSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  refundAmount: Joi.number().integer().min(1).required(),
  reason: Joi.string().sanitize().min(10).max(500).required()
    .messages({ 'string.min': 'Refund reason must be at least 10 characters' }),
    
  refundMode: Joi.string().valid('original_method', 'cash', 'bank_transfer').required(),
  
  bankDetails: Joi.object({
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().uppercase().required(),
    accountHolderName: Joi.string().sanitize().required()
  }).when('refundMode', {
    is: 'bank_transfer',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).options(schemaOptions);

/**
 * Revenue Intelligence Query Validator
 */
const revenueQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'End date must be after start date' }),
    
  groupBy: Joi.string().valid(
    'day', 'week', 'month', 'doctor', 'department', 'service'
  ).required(),
  
  departmentId: Joi.string().uuid().optional(),
  doctorId: Joi.string().uuid().optional(),
  paymentMode: Joi.string().valid(
    'cash', 'card', 'upi', 'netbanking', 'insurance', 'cheque'
  ).optional()
}).options(schemaOptions).custom((value, helpers) => {
  const diffTime = Math.abs(value.endDate - value.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 366) {
    return helpers.error('date.maxRange', { message: 'Date range cannot exceed 366 days' });
  }
  return value;
});

module.exports = {
  generateBillSchema,
  processPaymentSchema,
  refundSchema,
  revenueQuerySchema
};
