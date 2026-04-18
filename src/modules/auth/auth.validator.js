const Joi = require('../../utils/joi.extensions');

/**
 * Authentication & Identity Data Integrity Layer
 * 
 * Enforces strict medical-grade validation rules, PII sanitization,
 * and security constraints for the Hospital Management System.
 */

// Global Options
const schemaOptions = {
  abortEarly: false,     // Collect all errors for better UX
  stripUnknown: true,    // Prevent mass assignment/extra fields
  errors: { label: 'key' }
};

const HOSPITAL_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 
  'LAB_TECHNICIAN', 'RECEPTIONIST', 'ACCOUNTANT', 'STAFF', 'PATIENT'
];

/**
 * Account Provisioning Validator
 */
const registerSchema = Joi.object({
  name: Joi.string().sanitize().min(2).max(50).trim().required()
    .messages({ 'string.min': 'Full name must be at least 2 characters long' }),
    
  email: Joi.string().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid professional email address' }),
    
  phone: Joi.hospital().phoneNumber().required()
    .messages({ 'hospital.phone': 'Invalid contact format. Use international or Indian (+91) format' }),
    
  role: Joi.string().valid(...HOSPITAL_ROLES).required()
    .messages({ 'any.only': 'Invalid hospital role assigned' }),
    
  departmentId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'A valid Department UUID is required for clinical role assignment' }),
    
  gender: Joi.string().valid('male', 'female', 'other').required(),
  
  dateOfBirth: Joi.date().max('now').less('1-1-2008').required() // Must be 18+ (approx)
    .messages({ 'date.less': 'Staff members must be at least 18 years of age' }),
    
  employeeId: Joi.string().optional()
}).options(schemaOptions);

/**
 * Session Initiation Validator
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({ 'any.required': 'Email is mandatory for login' }),
    
  password: Joi.string().required()
    .messages({ 'any.required': 'Password is required' }),
    
  deviceInfo: Joi.object({
    deviceType: Joi.string().optional(),
    browser: Joi.string().optional(),
    os: Joi.string().optional()
  }).optional()
}).options(schemaOptions);

/**
 * Recovery Token Validator
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({ 'string.email': 'A valid registered email is required to receive recovery codes' })
}).options(schemaOptions);

/**
 * MFA/OTP Verification Validator
 */
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
    .messages({ 'string.length': 'Security code must be exactly 6 digits' })
}).options(schemaOptions);

/**
 * Credential Reset Validator
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'New password must contain Uppercase, Number and Special character',
      'string.min': 'Password must be at least 8 characters'
    }),
    
  confirmPassword: Joi.any().equal(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' })
}).options(schemaOptions);

/**
 * Self-Service Security Validator
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'any.invalid': 'New password cannot be the same as the current password',
      'string.pattern.base': 'New password must be strong (Uppercase, Cipher, Symbol)'
    }),
    
  confirmPassword: Joi.any().equal(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Confirmation password does not match' })
}).options(schemaOptions);

/**
 * Profile Maintenance Validator
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().sanitize().min(2).max(50).optional(),
  
  phone: Joi.hospital().phoneNumber().optional(),
  
  address: Joi.object({
    street: Joi.string().sanitize().optional(),
    city: Joi.string().sanitize().optional(),
    state: Joi.string().sanitize().optional(),
    zip: Joi.string().optional()
  }).optional(),
  
  profilePhoto: Joi.string().uri().optional(),
  
  emergencyContact: Joi.object({
    name: Joi.string().sanitize().required(),
    phone: Joi.hospital().phoneNumber().required(),
    relation: Joi.string().sanitize().required()
  }).optional()
}).options(schemaOptions);

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
};
