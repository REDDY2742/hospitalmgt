const Joi = require('../../utils/joi.extensions');

/**
 * Custom Joi Extension for Handlebars Template Validation
 */
const handlebarsExtension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'handlebars.invalid': '{{#label}} contains malformed Handlebars syntax (unclosed {{ }}, mismatched braces, or empty expressions)',
  },
  rules: {
    validateHandlebars: {
      validate(value, helpers) {
        // 1. Check for unclosed {{
        const openBraces = (value.match(/{{/g) || []).length;
        const closeBraces = (value.match(/}}/g) || []).length;
        if (openBraces !== closeBraces) return helpers.error('handlebars.invalid');

        // 2. Check for empty expressions {{}}
        if (/{{}}/.test(value)) return helpers.error('handlebars.invalid');

        // 3. Simple regex for balanced braces {{...}}
        if (/{{[^}]*$/.test(value) || /^[^{]*}}/.test(value)) return helpers.error('handlebars.invalid');

        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(handlebarsExtension);

/**
 * Hospital Notification & Communication Validators
 */

const NOTIFICATION_TYPES = [
  'info', 'warning', 'success', 'critical', 'appointment', 'billing', 
  'lab_result', 'prescription', 'emergency', 'shift', 'leave', 'system'
];

const CHANNELS = ['in_app', 'email', 'sms', 'push'];
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ACCOUNTANT', 'STAFF', 'PATIENT'];

/**
 * @description Validates single notification dispatch
 * @roles ADMIN, SUPER_ADMIN
 */
const sendNotificationSchema = ExtendedJoi.object({
  recipientId: ExtendedJoi.string().uuid().required(),
  type: ExtendedJoi.string().valid(...NOTIFICATION_TYPES).required(),
  title: ExtendedJoi.string().sanitize().min(3).max(100).required(),
  message: ExtendedJoi.string().sanitize().min(5).max(500).required(),
  channels: ExtendedJoi.array().items(ExtendedJoi.string().valid(...CHANNELS)).min(1).required(),
  priority: ExtendedJoi.string().valid('low', 'medium', 'high', 'critical').required(),
  
  templateId: ExtendedJoi.string().uuid().optional(),
  templateData: ExtendedJoi.object().optional(),
  metadata: ExtendedJoi.object().optional(),
  
  scheduledAt: ExtendedJoi.date().iso().greater('now').max('now + 30d').optional()
    .messages({ 'date.max': 'Notifications cannot be scheduled more than 30 days in the future' }),
  
  expiresAt: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('scheduledAt', { default: 'now' })).optional()
    .messages({ 'date.greater': 'Expiry time must be after the scheduled time' }),
  
  actionUrl: ExtendedJoi.string().uri().optional()
}).custom((value, helpers) => {
  // 1. SMS Warning (Soft check)
  if (value.channels.includes('sms') && value.message.length > 160) {
    // Note: Joi doesn't easily return 'warnings' that bypass error-state. 
    // We append a note to metadata or handle at service level if we want it to pass.
  }

  // 2. Email Subject Logic
  if (value.channels.includes('email') && value.title.length < 5) {
    return helpers.message('Email notifications require a subject (title) of at least 5 characters');
  }

  // 3. Critical Priority Enforcement
  if (value.priority === 'critical') {
    const hasRequired = ['sms', 'in_app'].every(c => value.channels.includes(c));
    if (!hasRequired) return helpers.message('Critical notifications must include both [sms] and [in_app] channels');
  }

  // 4. Expiry Duration Logic
  if (value.expiresAt && value.scheduledAt) {
    const diffMs = new Date(value.expiresAt) - new Date(value.scheduledAt);
    if (diffMs < 3600000) return helpers.message('Expiration must be at least 1 hour after scheduling');
  }

  return value;
}).meta({ criticalAlert: true });

/**
 * @description Validates mass-broadcast to targeted recipient groups
 * @roles ADMIN, SUPER_ADMIN
 */
const sendBulkNotificationSchema = ExtendedJoi.object({
  recipientGroup: ExtendedJoi.object({
    roleIds: ExtendedJoi.array().items(ExtendedJoi.string().valid(...ROLES)).min(1).optional(),
    departmentIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).optional(),
    wardIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).optional(),
    userIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).min(1).max(10000).optional(),
    all: ExtendedJoi.boolean().optional()
  }).min(1).required(),

  type: ExtendedJoi.string().valid(...NOTIFICATION_TYPES).required(),
  title: ExtendedJoi.string().sanitize().min(3).max(100).required(),
  message: ExtendedJoi.string().sanitize().min(5).max(500).required(),
  channels: ExtendedJoi.array().items(ExtendedJoi.string().valid(...CHANNELS)).min(1).required(),
  priority: ExtendedJoi.string().valid('low', 'medium', 'high', 'critical').required(),
  
  templateId: ExtendedJoi.string().uuid().optional(),
  templateData: ExtendedJoi.object().optional(),
  batchSize: ExtendedJoi.number().integer().min(10).max(500).default(100),
  delayBetweenBatchesMs: ExtendedJoi.number().integer().min(0).max(5000).default(100)
}).custom((value, helpers) => {
  if (value.recipientGroup.all && Object.keys(value.recipientGroup).length > 1) {
    return helpers.message('If "all" is set to true, no other recipient group filters are allowed');
  }
  return value;
});

/**
 * @description Validates mission-critical emergency hospital-wide broadcasts
 * @roles ADMIN, SUPER_ADMIN, DOCTOR (ER)
 */
const sendEmergencyBroadcastSchema = ExtendedJoi.object({
  message: ExtendedJoi.string().sanitize().min(10).max(500).required(),
  broadcastType: ExtendedJoi.string().valid(
    'CODE_BLUE', 'CODE_RED', 'CODE_PINK', 'CODE_ORANGE', 'FIRE_ALERT', 
    'EVACUATION', 'MCI', 'LOCKDOWN', 'CUSTOM'
  ).required(),
  location: ExtendedJoi.string().sanitize().min(3).max(200).required(),
  targetGroups: ExtendedJoi.array().items(ExtendedJoi.string().valid(
    'all_staff', 'doctors', 'nurses', 'security', 'admin', 'er_team', 'ot_team', 'pharmacy', 'lab'
  )).default(['all_staff']).optional(),
  additionalInfo: ExtendedJoi.string().sanitize().max(500).optional()
}).meta({ EMERGENCY: true, EMERGENCY_BROADCAST: true });

/**
 * @description Validates multi-channel communication templates
 * @roles ADMIN, SUPER_ADMIN
 */
const createTemplateSchema = ExtendedJoi.object({
  name: ExtendedJoi.string().sanitize().min(3).max(100).required(),
  type: ExtendedJoi.string().valid(...NOTIFICATION_TYPES).required(),
  
  emailSubject: ExtendedJoi.string().sanitize().min(3).max(200).required(),
  emailBody: ExtendedJoi.string().validateHandlebars().min(10).max(50000).required(),
  
  smsBody: ExtendedJoi.string().validateHandlebars().min(5).max(160).required()
    .messages({ 'string.max': 'SMS template body must not exceed 160 characters to prevent multi-part billing' }),
  
  pushTitle: ExtendedJoi.string().sanitize().min(3).max(65).required(),
  pushBody: ExtendedJoi.string().sanitize().min(5).max(240).required(),
  
  inAppTitle: ExtendedJoi.string().sanitize().min(3).max(100).required(),
  inAppMessage: ExtendedJoi.string().sanitize().min(5).max(500).required(),
  
  availableVariables: ExtendedJoi.array().items(ExtendedJoi.string()).min(1).required(),
  category: ExtendedJoi.string().valid('patient', 'staff', 'admin', 'system').required(),
  isActive: ExtendedJoi.boolean().default(true),
  tags: ExtendedJoi.array().items(ExtendedJoi.string()).max(10).optional()
});

const updateTemplateSchema = ExtendedJoi.object({
  name: ExtendedJoi.string().sanitize().min(3).max(100).optional(),
  type: ExtendedJoi.string().valid(...NOTIFICATION_TYPES).optional(),
  emailSubject: ExtendedJoi.string().sanitize().min(3).max(200).optional(),
  emailBody: ExtendedJoi.string().validateHandlebars().min(10).max(50000).optional(),
  smsBody: ExtendedJoi.string().validateHandlebars().min(5).max(160).optional(),
  pushTitle: ExtendedJoi.string().sanitize().min(3).max(65).optional(),
  pushBody: ExtendedJoi.string().sanitize().min(5).max(240).optional(),
  inAppTitle: ExtendedJoi.string().sanitize().min(3).max(100).optional(),
  inAppMessage: ExtendedJoi.string().sanitize().min(5).max(500).optional(),
  availableVariables: ExtendedJoi.array().items(ExtendedJoi.string()).min(1).optional(),
  category: ExtendedJoi.string().valid('patient', 'staff', 'admin', 'system').optional(),
  isActive: ExtendedJoi.boolean().optional(),
  tags: ExtendedJoi.array().items(ExtendedJoi.string()).max(10).optional()
}).min(1).meta({ renameHint: 'Name updates are restricted if template is active' });

/**
 * @description Validates template rendering preview
 * @roles ADMIN, SUPER_ADMIN
 */
const previewTemplateSchema = ExtendedJoi.object({
  templateId: ExtendedJoi.string().uuid().required(),
  sampleData: ExtendedJoi.object().min(1).required(),
  channels: ExtendedJoi.array().items(ExtendedJoi.string().valid(...CHANNELS)).required()
});

/**
 * @description Validates user delivery preferences and quiet hours
 * @roles ALL AUTHENTICATED
 */
const updatePreferencesSchema = ExtendedJoi.object({
  emailEnabled: ExtendedJoi.boolean().optional(),
  smsEnabled: ExtendedJoi.boolean().optional(),
  pushEnabled: ExtendedJoi.boolean().optional(),
  inAppEnabled: ExtendedJoi.boolean().optional(),
  
  notificationTypes: ExtendedJoi.object().pattern(
    ExtendedJoi.string().valid(...NOTIFICATION_TYPES),
    ExtendedJoi.object({
      email: ExtendedJoi.boolean(),
      sms: ExtendedJoi.boolean(),
      push: ExtendedJoi.boolean(),
      inApp: ExtendedJoi.boolean()
    })
  ).optional(),
  
  quietHoursEnabled: ExtendedJoi.boolean().optional(),
  quietHoursStart: ExtendedJoi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: ExtendedJoi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  
  language: ExtendedJoi.string().valid('english', 'hindi', 'tamil', 'telugu', 'kannada', 'bengali', 'marathi').optional(),
  doNotDisturb: ExtendedJoi.boolean().optional(),
  doNotDisturbUntil: ExtendedJoi.date().iso().greater('now').optional()
}).custom((value, helpers) => {
  if (value.quietHoursEnabled) {
    if (!value.quietHoursStart || !value.quietHoursEnd) {
      return helpers.message('Both start and end times are required when quiet hours are enabled');
    }
    if (value.quietHoursStart === value.quietHoursEnd) {
      return helpers.message('Quiet hours start and end times must be distinct');
    }
  }
  if (value.doNotDisturb && !value.doNotDisturbUntil) {
    return helpers.message('A future expiry time is required when Do Not Disturb is active');
  }
  return value;
});

/**
 * @description Validates FCM/APNs device registration for push alerts
 * @roles ALL AUTHENTICATED
 */
const registerDeviceTokenSchema = ExtendedJoi.object({
  token: ExtendedJoi.string().regex(/^[a-zA-Z0-9\-_:]{100,500}$/).required()
    .messages({ 'string.pattern.base': 'Invalid device token format: Must be alphanumeric secure token' }),
  deviceType: ExtendedJoi.string().valid('android', 'ios', 'web').required(),
  deviceName: ExtendedJoi.string().sanitize().max(100).optional(),
  appVersion: ExtendedJoi.string().regex(/^\d+\.\d+\.\d+$/).max(20).optional(),
  osVersion: ExtendedJoi.string().sanitize().max(20).optional(),
  isActive: ExtendedJoi.boolean().default(true)
});

/**
 * @description Validates query params for bulk delivery analytics
 * @roles ADMIN
 */
const bulkDeliveryReportQuerySchema = ExtendedJoi.object({
  jobId: ExtendedJoi.string().required(),
  page: ExtendedJoi.number().integer().min(1).default(1),
  limit: ExtendedJoi.number().integer().min(10).max(100).default(50),
  status: ExtendedJoi.string().valid('sent', 'delivered', 'failed', 'pending').optional(),
  channel: ExtendedJoi.string().valid(...CHANNELS).optional()
});

/**
 * @description Validates query params for notification history browsing
 * @roles ADMIN, SUPER_ADMIN (Self for personalized routes)
 */
const notificationHistoryQuerySchema = ExtendedJoi.object({
  userId: ExtendedJoi.string().uuid().optional(),
  type: ExtendedJoi.string().valid(...NOTIFICATION_TYPES).optional(),
  channel: ExtendedJoi.string().valid(...CHANNELS).optional(),
  status: ExtendedJoi.string().valid('sent', 'delivered', 'read', 'failed', 'pending').optional(),
  priority: ExtendedJoi.string().valid('low', 'medium', 'high', 'critical').optional(),
  startDate: ExtendedJoi.date().iso().optional(),
  endDate: ExtendedJoi.date().iso().greater(ExtendedJoi.ref('startDate')).optional(),
  page: ExtendedJoi.number().integer().min(1).default(1),
  limit: ExtendedJoi.number().integer().min(5).max(100).default(20)
}).custom((value, helpers) => {
  if (value.startDate && value.endDate) {
    const diffMs = new Date(value.endDate) - new Date(value.startDate);
    if (diffMs > 90 * 24 * 60 * 60 * 1000) return helpers.message('History search range is limited to 90 days');
  }
  return value;
});

/**
 * @description Validates notification re-dispatch attempt
 * @roles ADMIN, SUPER_ADMIN
 */
const resendNotificationSchema = ExtendedJoi.object({
  notificationId: ExtendedJoi.string().uuid().required(),
  channels: ExtendedJoi.array().items(ExtendedJoi.string().valid(...CHANNELS)).optional(),
  reason: ExtendedJoi.string().sanitize().min(5).max(200).required()
});

module.exports = {
  sendNotificationSchema,
  sendBulkNotificationSchema,
  sendEmergencyBroadcastSchema,
  createTemplateSchema,
  updateTemplateSchema,
  previewTemplateSchema,
  updatePreferencesSchema,
  registerDeviceTokenSchema,
  bulkDeliveryReportQuerySchema,
  notificationHistoryQuerySchema,
  resendNotificationSchema
};
