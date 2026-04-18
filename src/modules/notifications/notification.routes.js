const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { 
  emergencyLimiter, 
  bulkNotificationRateLimiter 
} = require('../../middleware/rateLimit.middleware');
const { 
  userContextMiddleware,
  validateSmsSignature,
  validateEmailSignature,
  validatePushSignature
} = require('../../middleware/notification.middleware');

const { 
  sendNotificationSchema, 
  sendBulkNotificationSchema, 
  emergencyBroadcastSchema, 
  templateSchema, 
  preferencesSchema, 
  registerDeviceSchema 
} = require('./notification.validator');

/**
 * Hospital Multi-Channel Notification API Gateway
 * Base Path: /api/v1/notifications
 * 
 * Orchestrates mission-critical alerts, real-time broadcasting, 
 * and mass workforce communications across SMS/Email/Push/WhatsApp.
 */

// --- 1. Transmission (Admin/SuperAdmin) ---

router.post('/send',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ body: sendNotificationSchema }),
  auditMiddleware,
  notificationController.sendNotification
);

router.post('/send/bulk',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  bulkNotificationRateLimiter, // Max 3 per hour
  validate({ body: sendBulkNotificationSchema }),
  auditMiddleware,
  notificationController.sendBulkNotification
);

router.post('/send/emergency',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN', 'DOCTOR']),
  emergencyLimiter, // No throttle, but distinct rate tracking
  validate({ body: emergencyBroadcastSchema }),
  auditMiddleware,
  notificationController.sendEmergencyBroadcast
);

router.post('/:id/resend',
  authenticate,
  authorize('ADMIN'),
  auditMiddleware,
  notificationController.resendFailedNotification
);

// --- 2. In-App Inbox (Self-Service) ---

router.get('/my',
  authenticate,
  userContextMiddleware, // Attaches userId for inbox isolation
  notificationController.getMyNotifications
);

router.get('/my/unread-count',
  authenticate,
  userContextMiddleware,
  notificationController.getUnreadCount
);

router.get('/my/:id',
  authenticate,
  userContextMiddleware,
  notificationController.getNotificationById
);

router.put('/my/:id/read',
  authenticate,
  userContextMiddleware,
  notificationController.markAsRead
);

router.put('/my/read-all',
  authenticate,
  userContextMiddleware,
  notificationController.markAllAsRead
);

router.delete('/my/:id',
  authenticate,
  userContextMiddleware,
  notificationController.deleteNotification
);

// --- 3. Communication Templates ---

router.get('/templates',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  notificationController.getNotificationTemplates
);

router.post('/templates',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ body: templateSchema }),
  notificationController.createTemplate
);

router.put('/templates/:id',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validate({ body: templateSchema }),
  notificationController.updateTemplate
);

router.delete('/templates/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  notificationController.deleteTemplate
);

router.post('/templates/:id/preview',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  notificationController.previewTemplate
);

// --- 4. User Preferences & Devices ---

router.get('/preferences/my',
  authenticate,
  notificationController.getMyPreferences
);

router.put('/preferences/my',
  authenticate,
  validate({ body: preferencesSchema }),
  notificationController.updateMyPreferences
);

router.post('/devices/register',
  authenticate,
  validate({ body: registerDeviceSchema }),
  notificationController.registerDeviceToken
);

router.get('/devices/my',
  authenticate,
  notificationController.getMyDevices
);

// --- 5. Webhook Listeners (Signature Validated) ---

router.post('/webhooks/sms-delivery',
  validateSmsSignature, // Bypasses authenticate, uses provider sig check
  notificationController.getDeliveryStatus // or callback handler
);

router.post('/webhooks/email-bounce',
  validateEmailSignature,
  notificationController.getBulkDeliveryReport // or callback handler
);

// --- 6. Historical Reports ---

router.get('/history',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  notificationController.getNotificationHistory
);

router.get('/reports/stats',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  notificationController.getNotificationStats
);

module.exports = router;
