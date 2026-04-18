const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Organizational & Department Joi Custom Extensions
 */
const orgExtension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'org.time': 'Institutional Protocol Error: Time must be in HH:MM 24-hour format (e.g., 09:00 or 21:00).',
    'org.timeRelation': 'Clincial Logic Error: Closing/Break-end time must be strictly after the Opening/Break-start time.',
    'org.budget': 'Treasury Integrity Error: Sum of budget breakdown cannot exceed the total allocated amount.'
  },
  rules: {
    timeFormat: {
      validate(value, helpers) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(value)) return helpers.error('org.time');
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(orgExtension);

const timeRangeSchema = ExtendedJoi.object({
  open: ExtendedJoi.timeFormat().required(),
  close: ExtendedJoi.timeFormat().required(),
  breakStart: ExtendedJoi.timeFormat().optional(),
  breakEnd: ExtendedJoi.timeFormat().optional()
}).custom((vals, helpers) => {
  if (vals.close <= vals.open) return helpers.error('org.timeRelation');
  if (vals.breakStart && vals.breakEnd && vals.breakEnd <= vals.breakStart) return helpers.error('org.timeRelation');
  return vals;
});

/**
 * --- Institutional CRUD & Org Structure ---
 */

const createDepartmentSchema = ExtendedJoi.object({
  name: ExtendedJoi.string().min(3).max(100).required().messages({
    'string.min': 'Administrative Error: Department name must be between 3 and 100 characters'
  }),
  code: ExtendedJoi.string().uppercase().regex(/^[A-Z0-9]{2,10}$/).optional().messages({
    'string.pattern.base': 'Naming Protocol Error: Department code must be uppercase alphanumeric, 2-10 chars'
  }),
  type: ExtendedJoi.string().valid(
    'clinical', 'administrative', 'support', 'diagnostic', 
    'surgical', 'emergency', 'pharmacy', 'laboratory', 
    'radiology', 'rehabilitation'
  ).required(),
  specialization: ExtendedJoi.string().min(3).max(100).optional()
    .when('type', { is: ExtendedJoi.valid('clinical', 'surgical'), then: ExtendedJoi.required() }),
  description: ExtendedJoi.string().min(10).max(1000).optional(),
  floor: ExtendedJoi.number().integer().min(0).max(50).required(),
  building: ExtendedJoi.string().max(50).default('Main Building'),
  location: ExtendedJoi.string().max(200).optional(),
  hodId: ExtendedJoi.string().uuid().optional(),
  contactEmail: ExtendedJoi.string().email().optional(),
  contactPhone: ExtendedJoi.string().optional(),
  operatingHours: ExtendedJoi.object({
    is24Hours: ExtendedJoi.boolean().default(false),
    weekdays: ExtendedJoi.when('is24Hours', { is: false, then: timeRangeSchema.required() }),
    weekends: ExtendedJoi.object({
      isClosed: ExtendedJoi.boolean().default(false),
      open: ExtendedJoi.timeFormat().when('isClosed', { is: false, then: ExtendedJoi.required() }),
      close: ExtendedJoi.timeFormat().when('isClosed', { is: false, then: ExtendedJoi.required() })
    }).optional()
  }).optional(),
  bedCapacity: ExtendedJoi.number().integer().min(0).max(500).optional()
    .when('type', { is: ExtendedJoi.valid('clinical', 'surgical'), then: ExtendedJoi.required().messages({
      'any.required': 'Infrastructure Error: Bed capacity required for clinical departments'
    }) }),
  monthlyBudget: ExtendedJoi.number().integer().min(0).optional(), // paise
  costCenter: ExtendedJoi.string().max(20).optional(),
  isActive: ExtendedJoi.boolean().default(true)
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Leadership & Management ---
 */

const changeDepartmentHODSchema = ExtendedJoi.object({
  newHodId: ExtendedJoi.string().uuid().required(),
  reason: ExtendedJoi.string().min(10).max(500).required().messages({
    'string.min': 'Governance Error: Reason for HOD change required (min 10 characters)'
  }),
  effectiveDate: ExtendedJoi.date().iso().min('now').default(() => new Date()),
  notifyStaff: ExtendedJoi.boolean().default(true)
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Workforce Mobility ---
 */

const transferStaffSchema = ExtendedJoi.object({
  staffId: ExtendedJoi.string().uuid().required(),
  fromDeptId: ExtendedJoi.string().uuid().required(),
  toDeptId: ExtendedJoi.string().uuid().invalid(ExtendedJoi.ref('fromDeptId')).required().messages({
    'any.invalid': 'Logistics Error: Source and destination departments must be different'
  }),
  reason: ExtendedJoi.string().min(10).max(500).required(),
  effectiveDate: ExtendedJoi.date().iso().min('now').required(),
  transferType: ExtendedJoi.string().valid('permanent', 'temporary', 'deputation').required(),
  expectedReturnDate: ExtendedJoi.date().iso().greater('now').optional()
    .when('transferType', { is: ExtendedJoi.valid('temporary', 'deputation'), then: ExtendedJoi.required() })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Financial Payouts & Budgets ---
 */

const updateBudgetSchema = ExtendedJoi.object({
  month: ExtendedJoi.number().integer().min(1).max(12).required(),
  year: ExtendedJoi.number().integer().min(2020).max(new Date().getFullYear() + 1).required(),
  allocatedAmount: ExtendedJoi.number().integer().min(0).required(), // paise
  breakdown: ExtendedJoi.object({
    salaries: ExtendedJoi.number().integer().min(0),
    equipment: ExtendedJoi.number().integer().min(0),
    supplies: ExtendedJoi.number().integer().min(0),
    maintenance: ExtendedJoi.number().integer().min(0),
    training: ExtendedJoi.number().integer().min(0),
    miscellaneous: ExtendedJoi.number().integer().min(0)
  }).optional().custom((vals, helpers) => {
    const total = Object.values(vals).reduce((acc, v) => acc + (v || 0), 0);
    if (total > helpers.state.ancestors[0].allocatedAmount) return helpers.error('org.budget');
    return vals;
  })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Intelligence & Search ---
 */

const departmentStatsQuerySchema = ExtendedJoi.object({
  startDate: ExtendedJoi.date().iso().required(),
  endDate: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('startDate')).required().custom((value, helpers) => {
    const diff = (new Date(value) - new Date(helpers.state.ancestors[0].startDate)) / (100 * 60 * 60 * 24);
    if (diff > 366) return helpers.error('any.invalid', { message: 'Inquiry Error: Stats date range cannot exceed 366 days.' });
    return value;
  })
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema: createDepartmentSchema.fork(
    ['name', 'type', 'floor', 'building'], (schema) => schema.optional()
  ).min(1),
  changeDepartmentHODSchema,
  assignStaffSchema: ExtendedJoi.object({
    staffId: ExtendedJoi.string().uuid().required(),
    role: ExtendedJoi.string().valid('DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ACCOUNTANT', 'STAFF').required(),
    effectiveDate: ExtendedJoi.date().iso().required(),
    isPrimaryDepartment: ExtendedJoi.boolean().default(true),
    notes: ExtendedJoi.string().max(300).optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  transferStaffSchema,
  updateOperatingHoursSchema: ExtendedJoi.object({
    is24Hours: ExtendedJoi.boolean().required(),
    weekdays: ExtendedJoi.when('is24Hours', { is: false, then: timeRangeSchema.required() }),
    weekends: ExtendedJoi.object({
      isClosed: ExtendedJoi.boolean().default(false),
      open: ExtendedJoi.timeFormat().when('isClosed', { is: false, then: ExtendedJoi.required() }),
      close: ExtendedJoi.timeFormat().when('isClosed', { is: false, then: ExtendedJoi.required() })
    }).optional(),
    reason: ExtendedJoi.string().min(5).max(300).required()
  }).options({ abortEarly: false, stripUnknown: true }),
  addDepartmentServiceSchema: ExtendedJoi.object({
    serviceName: ExtendedJoi.string().min(3).max(200).required(),
    serviceType: ExtendedJoi.string().valid('consultation', 'procedure', 'surgery', 'diagnostic', 'therapy', 'emergency', 'screening', 'vaccination').required(),
    cost: ExtendedJoi.number().integer().min(0).optional(),
    duration: ExtendedJoi.number().integer().min(5).max(480).optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  updateBudgetSchema,
  departmentStatsQuerySchema,
  departmentListQuerySchema: ExtendedJoi.object({
    type: ExtendedJoi.string().optional(),
    isActive: ExtendedJoi.boolean().optional(),
    specialization: ExtendedJoi.string().optional(),
    floor: ExtendedJoi.number().optional(),
    page: ExtendedJoi.number().integer().min(1).default(1),
    limit: ExtendedJoi.number().integer().min(5).max(100).default(20),
    sortBy: ExtendedJoi.string().valid('name', 'patientCount', 'staffCount', 'type').optional(),
    sortOrder: ExtendedJoi.string().valid('ASC', 'DESC').default('ASC')
  }).options({ abortEarly: false, stripUnknown: true })
};
