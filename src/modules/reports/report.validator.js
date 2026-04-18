const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Business Intelligence & Analytics Joi Extension
 */
const reportExtension = (joi) => ({
  type: 'object',
  base: joi.object(),
  messages: {
    'report.dateRange': 'Start date must be before or equal to the end date',
    'report.futureRestrict': 'Historical reports cannot contain future dates',
    'report.rangeExceed': 'Date range cannot exceed {{#limit}} days. For larger ranges, use the export API',
    'report.groupByIncompatible': 'Grouping by "{{#groupBy}}" is not supported for a {{#days}}-day range. Max allowed is {{#max}} days.'
  },
  rules: {
    dateRange: {
      validate(value, helpers) {
        if (value.startDate && value.endDate) {
          if (new Date(value.startDate) > new Date(value.endDate)) {
            return helpers.error('report.dateRange');
          }
          
          const diffMs = new Date(value.endDate) - new Date(value.startDate);
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          
          if (diffDays > 366) {
            return helpers.error('report.rangeExceed', { limit: 366 });
          }

          // Historical restriction check
          if (new Date(value.endDate) > new Date()) {
            return helpers.error('report.futureRestrict');
          }
        }
        return value;
      }
    },
    validateGroupByInRange: {
      args: ['groupBy'],
      validate(value, helpers, args) {
        const { startDate, endDate } = value;
        const { groupBy } = args;
        if (!startDate || !endDate || !groupBy) return value;

        const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        
        const limits = { day: 90, week: 180, month: 366, quarter: 366, year: 366 };
        if (diffDays > limits[groupBy]) {
          return helpers.error('report.groupByIncompatible', { groupBy, days: Math.floor(diffDays), max: limits[groupBy] });
        }
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(reportExtension);

/**
 * Reusable Base Schema for Historical Reporting
 */
const baseDateRangeSchema = ExtendedJoi.object({
  startDate: ExtendedJoi.date().iso().required(),
  endDate: ExtendedJoi.date().iso().required()
}).dateRange();

/**
 * --- Financial & Revenue Analytics ---
 */

/**
 * @description Revenue categorization, tax audit, and payment distribution analytics
 * @requiredRole ACCOUNTANT, ADMIN
 * @cacheTTL 60 Minutes
 * @asyncThreshold > 30 Days
 */
const revenueReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  groupBy: ExtendedJoi.string().valid('day', 'week', 'month', 'quarter', 'year').required(),
  departmentId: ExtendedJoi.string().uuid().optional(),
  doctorId: ExtendedJoi.string().uuid().optional(),
  paymentMode: ExtendedJoi.string().valid('cash', 'card', 'upi', 'netbanking', 'insurance', 'mixed', 'all').default('all'),
  serviceType: ExtendedJoi.string().valid('consultation', 'room_charge', 'pharmacy', 'lab', 'ot', 'ambulance', 'procedure', 'misc', 'all').default('all'),
  includeRefunds: ExtendedJoi.boolean().default(true),
  includeGST: ExtendedJoi.boolean().default(true),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').default('json')
})).custom((value, helpers) => {
  const diffDays = (new Date(value.endDate) - new Date(value.startDate)) / (1000 * 60 * 60 * 24);
  
  // High-Performance Hints
  if (value.groupBy === 'day' && diffDays > 30) {
      // Logic for warning injection in meta goes here for controller consumption
  }
  
  return helpers.schema.validateGroupByInRange(value, { groupBy: value.groupBy });
}).meta({ asyncRecommended: true });

/**
 * @description Patient demographics, admission trends, and ICD-10 diagnosis frequency
 * @requiredRole ADMIN, DOCTOR
 */
const patientReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  reportType: ExtendedJoi.string().valid('summary', 'demographics', 'admission_trend', 'diagnosis_frequency', 'readmission', 'geographic').required(),
  departmentId: ExtendedJoi.string().uuid().optional(),
  doctorId: ExtendedJoi.string().uuid().optional(),
  wardType: ExtendedJoi.string().valid('general', 'icu', 'nicu', 'maternity', 'surgical', 'all').default('all'),
  ageGroup: ExtendedJoi.string().valid('pediatric_0_12', 'adolescent_13_17', 'adult_18_60', 'senior_60_plus', 'all').default('all'),
  gender: ExtendedJoi.string().valid('male', 'female', 'other', 'all').default('all'),
  admissionType: ExtendedJoi.string().valid('opd', 'ipd', 'emergency', 'all').default('all'),
  diagnosisCode: ExtendedJoi.string().max(10).optional(),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').default('json')
}));

/**
 * @description Doctor surgical volume, satisfaction rating, and consultation turnaround analytics
 * @requiredRole ADMIN, SUPER_ADMIN
 */
const doctorPerformanceReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  doctorId: ExtendedJoi.string().uuid().optional(),
  departmentId: ExtendedJoi.string().uuid().optional(),
  metrics: ExtendedJoi.array().items(ExtendedJoi.string().valid('consultations', 'revenue', 'satisfaction', 'lab_orders', 'prescriptions', 'admissions', 'ot_cases', 'telemedicine')).default(['all']),
  compareWithAverage: ExtendedJoi.boolean().default(true),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf').default('json')
}));

/**
 * @description Ward-level occupancy forecasting and bed turnover analytics
 * @requiredRole ADMIN, NURSE_MANAGER
 */
const occupancyReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  wardId: ExtendedJoi.string().uuid().optional(),
  wardType: ExtendedJoi.string().valid('general', 'icu', 'nicu', 'picu', 'maternity', 'surgical', 'orthopedic', 'pediatric', 'psychiatric', 'oncology', 'all').default('all'),
  groupBy: ExtendedJoi.string().valid('day', 'week', 'month').required(),
  includeForecasting: ExtendedJoi.boolean().default(false),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').default('json')
})).custom((value, helpers) => {
    const diffDays = (new Date(value.endDate) - new Date(value.startDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) return helpers.message('Occupancy reports are limited to 90 days for forecasting accuracy');
    return value;
});

/**
 * @description Lab turnaround time (TAT) compliance and critical result TAT analytics
 * @requiredRole LAB_MANAGER, ADMIN
 */
const labReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  reportType: ExtendedJoi.string().valid('summary', 'tat_analysis', 'workload', 'critical_values', 'rejection_rate', 'revenue').required(),
  technicianId: ExtendedJoi.string().uuid().optional(),
  testCategory: ExtendedJoi.string().valid('hematology', 'biochemistry', 'microbiology', 'serology', 'immunology', 'histopathology', 'all').default('all'),
  urgency: ExtendedJoi.string().valid('routine', 'urgent', 'stat', 'all').default('all'),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').default('json')
})).custom((value, helpers) => {
    if ((new Date(value.endDate) - new Date(value.startDate)) / 86400000 > 180) return helpers.message('Lab analytics capped at 180 days');
    return value;
});

/**
 * @description Executive KPI snapshot: ALOS, Mortality Rate, and Operational Costing
 * @requiredRole ADMIN, SUPER_ADMIN
 */
const kpiReportSchema = ExtendedJoi.object({
  month: ExtendedJoi.number().integer().min(1).max(12).required(),
  year: ExtendedJoi.number().integer().min(2020).max(new Date().getFullYear()).required(),
  compareMonths: ExtendedJoi.number().integer().min(1).max(12).default(3),
  kpiCategories: ExtendedJoi.array().items(ExtendedJoi.string().valid('clinical', 'financial', 'operational', 'staff', 'patient_experience')).default(['all']),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf').default('json')
}).custom((value, helpers) => {
    const today = new Date();
    if (value.year === today.getFullYear() && value.month > today.getMonth() + 1) {
        return helpers.message('KPI reports cannot be requested for future months');
    }
    return value;
});

/**
 * @description Forensic Audit Trail analytics for compliance and data-access logging
 * @requiredRole SUPER_ADMIN
 */
const auditReportSchema = baseDateRangeSchema.concat(ExtendedJoi.object({
  userId: ExtendedJoi.string().uuid().optional(),
  module: ExtendedJoi.string().valid('auth', 'patients', 'doctors', 'billing', 'pharmacy', 'lab', 'wards', 'ot', 'emergency', 'blood_bank', 'staff', 'reports', 'all').default('all'),
  action: ExtendedJoi.string().valid('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'print', 'critical_access').optional(),
  resourceType: ExtendedJoi.string().max(50).optional(),
  ipAddress: ExtendedJoi.string().ip().optional(),
  onlyFailures: ExtendedJoi.boolean().default(false),
  onlyHighRisk: ExtendedJoi.boolean().default(false),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').default('json')
})).custom((value, helpers) => {
    if ((new Date(value.endDate) - new Date(value.startDate)) / 86400000 > 90) return helpers.message('Compliance audit logs limited to a 90-day search window');
    return value;
});

/**
 * @description Request background processing for heavy CSV/PDF data exports
 * @requiredRole ALL AUTHENTICATED
 */
const requestExportSchema = ExtendedJoi.object({
  reportType: ExtendedJoi.string().valid('revenue', 'patients', 'doctor_performance', 'department', 'occupancy', 'lab', 'pharmacy', 'inventory', 'staff', 'kpi', 'audit', 'executive_summary', 'monthly_mis', 'gst').required(),
  filters: ExtendedJoi.object().required().description('Passed to specific report validator in background'),
  exportFormat: ExtendedJoi.string().valid('pdf', 'excel', 'csv').required(),
  notifyOnCompletion: ExtendedJoi.boolean().default(true),
  reportTitle: ExtendedJoi.string().sanitize().min(3).max(100).optional()
});

/**
 * @description Regulatory GST reporting for CGST/SGST/IGST tax reconciliation
 * @requiredRole ACCOUNTANT
 */
const gstReportSchema = ExtendedJoi.object({
  month: ExtendedJoi.number().integer().min(1).max(12).required(),
  year: ExtendedJoi.number().integer().min(2020).max(new Date().getFullYear()).required(),
  gstType: ExtendedJoi.string().valid('cgst', 'sgst', 'igst', 'all').default('all'),
  stateCode: ExtendedJoi.string().uppercase().length(2).optional(),
  exportFormat: ExtendedJoi.string().valid('json', 'pdf', 'excel').required()
});

module.exports = {
  revenueReportSchema,
  patientReportSchema,
  doctorPerformanceReportSchema,
  occupancyReportSchema,
  labReportSchema,
  kpiReportSchema,
  auditReportSchema,
  requestExportSchema,
  gstReportSchema
};
