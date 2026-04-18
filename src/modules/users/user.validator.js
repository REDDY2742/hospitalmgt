const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Identity & Access Management (IAM) Joi Custom Extensions
 */
const iamExtension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'iam.strongPassword': 'Internal Security Standard Error: Password does not meet clinical complexity requirements. It must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character.',
    'iam.e164Phone': 'Communication Standard Error: Telephone number must be in standardized E.164 format (e.g., +91XXXXXXXXXX).',
    'iam.ageConstraint': 'Employment Integrity Error: Staff members must be at least 18 years of age.'
  },
  rules: {
    strongPassword: {
      validate(value, helpers) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
        if (!strongRegex.test(value)) return helpers.error('iam.strongPassword');
        return value;
      }
    },
    e164Phone: {
      validate(value, helpers) {
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(value)) return helpers.error('iam.e164Phone');
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(iamExtension);

const addressSchema = ExtendedJoi.object({
  street: ExtendedJoi.string().max(200).optional(),
  city: ExtendedJoi.string().required().messages({ 'any.required': 'Demographic Integrity Error: City of residence is mandatory.' }),
  state: ExtendedJoi.string().required().messages({ 'any.required': 'Demographic Integrity Error: State of residence is mandatory.' }),
  pincode: ExtendedJoi.string().regex(/^\d{6}$/).required().messages({ 'string.pattern.base': 'Demographic Integrity Error: PIN code must be exactly 6 numeric digits.' }),
  country: ExtendedJoi.string().default('India')
});

const emergencyContactSchema = ExtendedJoi.object({
  name: ExtendedJoi.string().min(2).required(),
  phone: ExtendedJoi.e164Phone().required(),
  relation: ExtendedJoi.string().min(2).required()
});

/**
 * --- Workforce & Patient Identity Creation ---
 */

/**
 * @description Registers a new hospital staff member or patient with role-specific constraints
 * @asyncThreshold Department required for clinical staff (DR/NR/LT)
 */
const createUserSchema = ExtendedJoi.object({
  firstName: ExtendedJoi.string().regex(/^[a-zA-Z\s]+$/).min(2).max(50).required(),
  lastName: ExtendedJoi.string().regex(/^[a-zA-Z\s]+$/).min(2).max(50).required(),
  email: ExtendedJoi.string().email().lowercase().trim().required(),
  phone: ExtendedJoi.e164Phone().required(),
  password: ExtendedJoi.strongPassword().min(8).max(72).required(),
  confirmPassword: ExtendedJoi.any().equal(ExtendedJoi.ref('password')).required().messages({ 'any.only': 'Identity Security Error: Passwords do not match.' }),
  role: ExtendedJoi.string().valid('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ACCOUNTANT', 'STAFF', 'HR', 'MANAGER', 'PATIENT').required(),
  departmentId: ExtendedJoi.string().uuid().when('role', {
    is: ExtendedJoi.string().valid('DOCTOR', 'NURSE', 'LAB_TECHNICIAN'),
    then: ExtendedJoi.required(),
    otherwise: ExtendedJoi.optional()
  }).messages({ 'any.required': 'Departmental Anchor Error: Department ID is mandatory for clinical personnel assignment.' }),
  gender: ExtendedJoi.string().valid('male', 'female', 'other', 'prefer_not_to_say').required(),
  dateOfBirth: ExtendedJoi.date().iso().required().custom((value, helpers) => {
    const age = (new Date() - new Date(value)) / (1000 * 60 * 60 * 24 * 365.25);
    // Check if role is NOT PATIENT (staff check)
    if (helpers.state.ancestors[0].role !== 'PATIENT' && age < 18) {
      return helpers.error('iam.ageConstraint');
    }
    return value;
  }),
  designation: ExtendedJoi.string().min(3).max(100).when('role', {
    is: ExtendedJoi.not('PATIENT'),
    then: ExtendedJoi.required(),
    otherwise: ExtendedJoi.optional()
  }),
  employmentType: ExtendedJoi.string().valid('permanent', 'contract', 'visiting', 'intern', 'probation', 'not_applicable').default('not_applicable'),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Profile & Authorization Governance ---
 */

/**
 * @description Administrative profile modification: prevents escalation and ensures clinical traceability
 */
const updateUserSchema = ExtendedJoi.object({
  firstName: ExtendedJoi.string().min(2).max(50).optional(),
  lastName: ExtendedJoi.string().min(2).max(50).optional(),
  email: ExtendedJoi.string().email().optional(),
  phone: ExtendedJoi.e164Phone().optional(),
  departmentId: ExtendedJoi.string().uuid().optional(),
  designation: ExtendedJoi.string().min(3).max(100).optional(),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  employmentType: ExtendedJoi.string().valid('permanent', 'contract', 'visiting', 'intern', 'probation', 'not_applicable').optional(),
  isActive: ExtendedJoi.boolean().optional()
}).min(1).options({ abortEarly: false, stripUnknown: true });

/**
 * @description Self-service profile editing: anchored to current clinician ID for IDOR prevention
 */
const updateMyProfileSchema = ExtendedJoi.object({
  firstName: ExtendedJoi.string().optional(),
  lastName: ExtendedJoi.string().optional(),
  phone: ExtendedJoi.e164Phone().optional(),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  profilePhotoUrl: ExtendedJoi.string().uri().optional(),
  preferredLanguage: ExtendedJoi.string().valid('english', 'hindi', 'tamil', 'telugu', 'kannada', 'bengali', 'marathi').optional()
}).min(1).options({ abortEarly: false, stripUnknown: true });

/**
 * @description Identity security cycle: enforces complexity and prevents reuse of current credentials
 */
const changeMyPasswordSchema = ExtendedJoi.object({
  currentPassword: ExtendedJoi.string().required(),
  newPassword: ExtendedJoi.strongPassword().min(8).max(72).invalid(ExtendedJoi.ref('currentPassword')).required().messages({
    'any.invalid': 'Security Integrity Error: New password cannot be identical to the current credential.'
  }),
  confirmPassword: ExtendedJoi.any().equal(ExtendedJoi.ref('newPassword')).required().messages({ 'any.only': 'Security Error: Password verification mismatch.' })
});

/**
 * @description Administrative permission bridging: merges or ovverides workforce access matrices
 */
const updateUserPermissionsSchema = ExtendedJoi.object({
  permissions: ExtendedJoi.array().items(ExtendedJoi.string().regex(/^[a-z_]+:[a-z_]+$/)).min(1).max(100).required().messages({
    'string.pattern.base': 'Permission Syntax Error: Permissions must be in the format module:action (e.g., medical_records:read).'
  }),
  permissionMode: ExtendedJoi.string().valid('replace', 'merge', 'revoke').required(),
  reason: ExtendedJoi.string().min(10).max(500).required()
});

/**
 * --- Bulk Administrative Gating ---
 */

const bulkDeactivateSchema = ExtendedJoi.object({
  userIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).max(50).required(),
  reason: ExtendedJoi.string().min(10).max(500).required(),
  sendNotification: ExtendedJoi.boolean().default(true)
});

const bulkUpdateDepartmentSchema = ExtendedJoi.object({
  userIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).max(50).required(),
  departmentId: ExtendedJoi.string().uuid().required(),
  effectiveDate: ExtendedJoi.date().iso().min('now').optional()
});

/**
 * --- Search & Telemetry Validation ---
 */

const searchUsersSchema = ExtendedJoi.object({
  q: ExtendedJoi.string().min(2).max(100).optional(),
  role: ExtendedJoi.alternatives().try(ExtendedJoi.string(), ExtendedJoi.array().items(ExtendedJoi.string())).optional(),
  departmentId: ExtendedJoi.string().uuid().optional(),
  isActive: ExtendedJoi.boolean().optional(),
  joinedAfter: ExtendedJoi.date().iso().optional(),
  joinedBefore: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('joinedAfter')).optional(),
  page: ExtendedJoi.number().integer().min(1).default(1),
  limit: ExtendedJoi.number().integer().min(5).max(100).default(20),
  sortBy: ExtendedJoi.string().valid('name', 'email', 'joinedAt', 'role', 'department').optional(),
  sortOrder: ExtendedJoi.string().valid('ASC', 'DESC').default('DESC')
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateMyProfileSchema,
  changeMyPasswordSchema,
  updateUserPermissionsSchema,
  bulkDeactivateSchema,
  bulkUpdateDepartmentSchema,
  searchUsersSchema,
  changeUserRoleSchema: ExtendedJoi.object({
    newRole: ExtendedJoi.string().required(),
    reason: ExtendedJoi.string().min(10).max(500).required(),
    effectiveDate: ExtendedJoi.date().iso().optional()
  })
};
