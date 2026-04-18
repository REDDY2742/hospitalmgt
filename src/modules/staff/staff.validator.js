const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Staff & HR Management Validators
 * 
 * Engineered for high-fidelity HR operations: clinical credentialing, 
 * rigorous attendance gating, and Indian-standard payroll compliance.
 */

const onboardStaffSchema = Joi.object({
  firstName: Joi.string().regex(/^[a-zA-Z\s]+$/).min(2).max(50).required()
    .messages({ 'string.pattern.base': 'First name must contain only alphabets and spaces' }),
  lastName: Joi.string().regex(/^[a-zA-Z\s]+$/).min(2).max(50).required()
    .messages({ 'string.pattern.base': 'Last name must contain only alphabets and spaces' }),
  
  email: Joi.string().email().required(),
  phone: Joi.string().phone().required(),
  alternatePhone: Joi.string().phone().optional(),
  
  role: Joi.string().valid(
    'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 
    'ACCOUNTANT', 'STAFF', 'HR', 'MANAGER', 'SECURITY'
  ).required(),
  
  departmentId: Joi.string().uuid().required(),
  designation: Joi.string().sanitize().min(3).max(100).required(),
  
  employmentType: Joi.string().valid(
    'permanent', 'contract', 'visiting', 'intern', 'probation'
  ).required(),
  
  joiningDate: Joi.date().iso().max('now + 7d').required()
    .messages({ 'date.max': 'Joining date cannot be more than 7 days in the future' }),
  
  salary: Joi.number().integer().min(0).required() // in paise
    .messages({ 'number.base': 'Monthly salary must be provided in integer paise for precision' }),
    
  shiftPreference: Joi.string().valid('morning', 'afternoon', 'night', 'any').optional(),
  
  qualification: Joi.array().items(Joi.object({
    degree: Joi.string().sanitize().required(),
    institution: Joi.string().sanitize().required(),
    year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required()
  })).min(1).required(),
  
  gender: Joi.string().valid('male', 'female', 'other').required(),
  dateOfBirth: Joi.date().iso().max('now - 18y').required()
    .messages({ 'date.max': 'Staff member must be at least 18 years of age' }),
  
  address: Joi.object({
    street: Joi.string().sanitize().required(),
    city: Joi.string().sanitize().required(),
    state: Joi.string().sanitize().required(),
    pincode: Joi.string().regex(/^\d{6}$/).required(),
    country: Joi.string().sanitize().required()
  }).required(),
  
  emergencyContact: Joi.object({
    name: Joi.string().sanitize().required(),
    phone: Joi.string().phone().required(),
    relation: Joi.string().sanitize().required()
  }).required(),
  
  aadhaarNumber: Joi.string().regex(/^\d{12}$/).optional()
    .meta({ stripSensitive: true }),
  
  panNumber: Joi.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional()
    .meta({ stripSensitive: true }),
    
  bankDetails: Joi.object({
    accountNumber: Joi.string().min(9).max(18).required(),
    ifscCode: Joi.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).required()
      .messages({ 'string.pattern.base': 'Please provide a valid Indian IFSC code format' }),
    bankName: Joi.string().sanitize().required(),
    accountHolderName: Joi.string().sanitize().required()
  }).optional().meta({ stripSensitive: true }),
  
  pfNumber: Joi.string().sanitize().optional(),
  esiNumber: Joi.string().sanitize().optional()
});

const applyLeaveSchema = Joi.object({
  leaveType: Joi.string().valid(
    'casual', 'sick', 'earned', 'maternity', 'paternity', 'emergency', 'compensatory', 'unpaid'
  ).required(),
  
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  
  reason: Joi.string().sanitize().min(10).max(500).required(),
  
  isHalfDay: Joi.boolean().default(false),
  halfDaySession: Joi.string().valid('morning', 'afternoon').when('isHalfDay', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  medicalCertificate: Joi.string().uri().optional()
    .when('leaveType', {
      is: 'sick',
      then: Joi.custom((value, helpers) => {
        const { startDate, endDate } = helpers.state.ancestors[0];
        const diffDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        if (diffDays > 2 && !value) return helpers.message('Medical certificate is required for sick leave exceeding 2 days');
        return value;
      }),
      otherwise: Joi.optional()
    })
}).custom((value, helpers) => {
  const diffDays = Math.ceil(Math.abs(new Date(value.endDate) - new Date(value.startDate)) / (1000 * 60 * 60 * 24)) + 1;
  
  if (value.leaveType === 'casual' && diffDays > 3) return helpers.message('Casual leave cannot exceed 3 consecutive days');
  if (value.leaveType === 'sick' && diffDays > 30) return helpers.message('Sick leave application cannot exceed 30 days');
  if (value.leaveType === 'earned' && diffDays > 15) return helpers.message('Earned leave application cannot exceed 15 days');
  
  if (value.isHalfDay && value.startDate.toISOString().split('T')[0] !== value.endDate.toISOString().split('T')[0]) {
    return helpers.message('Half-day leave must have identical start and end dates');
  }
  
  return value;
});

const checkInSchema = Joi.object({
  checkInTime: Joi.date().iso().optional(),
  biometricHash: Joi.string().optional(),
  notes: Joi.string().sanitize().max(200).optional(),
  locationOverride: Joi.boolean().default(false)
});

const shiftAssignmentSchema = Joi.object({
  staffId: Joi.string().uuid().required(),
  shiftType: Joi.string().valid('morning', 'afternoon', 'night', 'on_call', 'split').required(),
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'Shift end date must be after the start date' }),
  
  weekDays: Joi.array().items(Joi.string().valid(
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )).min(1).required(),
  
  departmentId: Joi.string().uuid().required(),
  wardId: Joi.string().uuid().optional(),
  notes: Joi.string().sanitize().max(300).optional()
}).custom((value, helpers) => {
  const diffDays = Math.ceil(Math.abs(new Date(value.endDate) - new Date(value.startDate)) / (1000 * 60 * 60 * 24));
  if (diffDays > 90) return helpers.message('Shift schedule assignments cannot exceed a 90-day window');
  return value;
});

const processPayrollSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(new Date().getFullYear()).required(),
  departmentId: Joi.string().uuid().optional(),
  
  includeBonus: Joi.boolean().default(false),
  bonusAmount: Joi.number().integer().min(0).when('includeBonus', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  bonusReason: Joi.string().sanitize().min(5).when('includeBonus', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).custom((value, helpers) => {
  const now = new Date();
  if (value.year === now.getFullYear() && value.month > now.getMonth() + 1) {
    return helpers.message('Cannot process payroll for future months');
  }
  return value;
});

const attendanceCorrectionSchema = Joi.object({
  attendanceId: Joi.string().uuid().required(),
  correctedCheckIn: Joi.date().iso().optional(),
  correctedCheckOut: Joi.date().iso().optional(),
  reason: Joi.string().sanitize().min(10).max(500).required(),
  supportingDocument: Joi.string().uri().optional()
}).or('correctedCheckIn', 'correctedCheckOut')
  .messages({ 'object.missing': 'At least one of Check-in or Check-out correction is required' });

const scheduleTrainingSchema = Joi.object({
  title: Joi.string().sanitize().min(5).max(200).required(),
  description: Joi.string().sanitize().min(10).max(1000).required(),
  trainerName: Joi.string().sanitize().min(2).max(100).required(),
  
  trainingType: Joi.string().valid(
    'induction', 'safety', 'clinical', 'technical', 'soft_skills', 
    'compliance', 'fire_drill', 'cpr', 'hipaa'
  ).required(),
  
  scheduledDate: Joi.date().iso().greater('now').required(),
  durationHours: Joi.number().min(0.5).max(40).required(),
  venue: Joi.string().sanitize().min(3).max(200).required(),
  maxParticipants: Joi.number().integer().min(1).max(500).required(),
  
  targetRoles: Joi.array().items(Joi.string().valid(
    'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 
    'ACCOUNTANT', 'STAFF', 'HR', 'MANAGER', 'SECURITY'
  )).min(1).required(),
  
  targetDepartments: Joi.array().items(Joi.string().uuid()).optional(),
  isMandatory: Joi.boolean().default(false),
  certificationProvided: Joi.boolean().default(false),
  
  expiryMonths: Joi.number().integer().min(1).max(60).when('certificationProvided', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

module.exports = {
  onboardStaffSchema,
  applyLeaveSchema,
  checkInSchema,
  shiftAssignmentSchema,
  processPayrollSchema,
  attendanceCorrectionSchema,
  scheduleTrainingSchema
};
