const notificationService = require('./notification.service');
const Response = require('../../utils/response.util');
const { getIO } = require('../../config/socket');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger.util');

/**
 * Hospital Multi-Channel Notification Controller
 * 
 * Orchestrates Real-time Alerts, SMS/Email Dispatch, Push Notifications (FCM),
 * and Mission-Critical Emergency Broadcasts.
 */

/**
 * --- Send Notifications ---
 */

/**
 * @description Dispatch a single notification via specified channels
 * @access PRIVATE [ADMIN, STAFF]
 */
const sendNotification = async (req, res, next) => {
  try {
    const data = await notificationService.dispatch(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Notification sent/queued', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Mass-broadcast to all hospital staff instantly
 * @access PRIVATE [ADMIN]
 */
const sendEmergencyBroadcast = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    
    // 1. Zero-Latency Socket.io Broadcast
    const io = getIO();
    io.emit('EMERGENCY_BROADCAST', {
      title,
      message,
      level: 'CRITICAL',
      timestamp: new Date()
    });

    // 2. Queue Email/SMS/Push via service (Fire-and-forget logic in controller, full queue in service)
    const data = await notificationService.dispatchEmergency(req.body, req.user.id);
    
    Response.sendSuccess(res, data, 'Emergency broadcast transmitted to all live staff');
  } catch (error) {
    next(error);
  }
};

/**
 * --- In-App Notifications & Inbox ---
 */

/**
 * @description Retrieve authenticated user's unread count from high-performance cache
 * @access PRIVATE [AUTHENTICATED]
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const cacheKey = `unread_count:${req.user.id}`;
    let count = await redis.get(cacheKey);

    if (count === null) {
      count = await notificationService.fetchUnreadCount(req.user.id);
      await redis.set(cacheKey, count, 'EX', 3600); // 1hr cache, but invalidated on new notification
    }

    Response.sendSuccess(res, { count: parseInt(count) }, 'Unread count fetched from cache');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Finalize notification as read and decrement cache counter
 * @access PRIVATE [AUTHENTICATED]
 */
const markAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markRead(req.params.id, req.user.id);
    
    // Atomic Redis Decrement
    const cacheKey = `unread_count:${req.user.id}`;
    await redis.decrby(cacheKey, 1);

    Response.sendSuccess(res, data, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Push Notifications (FCM) ---
 */

/**
 * @description Register Firebase Cloud Messaging (FCM) token for push alerts
 * @access PRIVATE [AUTHENTICATED]
 */
const registerDeviceToken = async (req, res, next) => {
  try {
    const { token, deviceType } = req.body;
    
    // Regex basic validation for FCM Tokens
    if (!/^[a-zA-Z0-9\-_:]{100,2000}$/.test(token)) {
      return next(new Error('Invalid FCM token format'));
    }

    const data = await notificationService.saveToken(req.user.id, token, deviceType);
    Response.sendSuccess(res, data, 'Push token registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Templates & Preferences ---
 */

/**
 * @description Preview rendered template with dynamic data placeholders
 * @access PRIVATE [ADMIN, HR]
 */
const previewTemplate = async (req, res, next) => {
  try {
    const html = await notificationService.renderPreview(req.params.id, req.body.sampleData);
    Response.sendSuccess(res, { html }, 'Template preview rendered');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendNotification,
  sendBulkNotification: async (req, res, next) => {
    if (req.body.recipientIds && req.body.recipientIds.length > 10000) {
      return next(new Error('Bulk notification limited to 10,000 recipients per job'));
    }
    Response.sendSuccess(res, await notificationService.dispatchBulk(req.body, req.user.id), 'Bulk job queued', 202);
  },
  sendEmergencyBroadcast,
  resendFailedNotification: async (req, res, next) => Response.sendSuccess(res, await notificationService.retry(req.params.id)),
  sendTestNotification: async (req, res, next) => Response.sendSuccess(res, await notificationService.testMode(req.body, req.user.id)),
  getMyNotifications: async (req, res, next) => Response.sendSuccess(res, await notificationService.getInbox(req.user.id, req.query)),
  getNotificationById: async (req, res, next) => Response.sendSuccess(res, await notificationService.getOne(req.params.id, req.user.id)),
  markAsRead,
  markAllAsRead: async (req, res, next) => {
    await notificationService.markAllRead(req.user.id);
    await redis.set(`unread_count:${req.user.id}`, 0);
    Response.sendSuccess(res, null, 'All notifications marked as read');
  },
  deleteNotification: async (req, res, next) => Response.sendSuccess(res, await notificationService.softDelete(req.params.id, req.user.id)),
  deleteAllRead: async (req, res, next) => Response.sendSuccess(res, await notificationService.purgeRead(req.user.id)),
  getUnreadCount,
  getNotificationHistory: async (req, res, next) => Response.sendSuccess(res, await notificationService.getAllLogs(req.query)),
  getNotificationTemplates: async (req, res, next) => Response.sendSuccess(res, await notificationService.listTemplates()),
  getTemplateById: async (req, res, next) => Response.sendSuccess(res, await notificationService.getTemplate(req.params.id)),
  createTemplate: async (req, res, next) => Response.sendSuccess(res, await notificationService.saveTemplate(req.body), 'Template created', 201),
  updateTemplate: async (req, res, next) => Response.sendSuccess(res, await notificationService.editTemplate(req.params.id, req.body)),
  deleteTemplate: async (req, res, next) => Response.sendSuccess(res, await notificationService.removeTemplate(req.params.id)),
  previewTemplate,
  getMyPreferences: async (req, res, next) => Response.sendSuccess(res, await notificationService.getPrefs(req.user.id)),
  updateMyPreferences: async (req, res, next) => Response.sendSuccess(res, await notificationService.setPrefs(req.user.id, req.body)),
  getPreferencesByUser: async (req, res, next) => Response.sendSuccess(res, await notificationService.getPrefs(req.params.userId)),
  updatePreferencesByUser: async (req, res, next) => Response.sendSuccess(res, await notificationService.setPrefs(req.params.userId, req.body)),
  registerDeviceToken,
  updateDeviceToken: async (req, res, next) => Response.sendSuccess(res, await notificationService.refreshToken(req.body.oldToken, req.body.newToken)),
  removeDeviceToken: async (req, res, next) => Response.sendSuccess(res, await notificationService.deleteToken(req.body.token)),
  getMyDevices: async (req, res, next) => Response.sendSuccess(res, await notificationService.getDevices(req.user.id)),
  getDeliveryStatus: async (req, res, next) => Response.sendSuccess(res, await notificationService.getLogStatus(req.params.id)),
  getBulkDeliveryReport: async (req, res, next) => Response.sendSuccess(res, await notificationService.getBulkStats(req.params.jobId)),
  getFailedNotifications: async (req, res, next) => Response.sendSuccess(res, await notificationService.getFailures(req.query)),
  getNotificationStats: async (req, res, next) => Response.sendSuccess(res, await notificationService.getStats()),
  getChannelPerformanceReport: async (req, res, next) => Response.sendSuccess(res, await notificationService.getChannelStats())
};
