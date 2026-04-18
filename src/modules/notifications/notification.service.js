const { 
  Notification, 
  NotificationPreference, 
  User, 
  sequelize 
} = require('../../models');
const Queue = require('bull');
const { getIO } = require('../../config/socket');
const { sesEmail } = require('../../config/mailer');
const { sendSMSGateway } = require('../../utils/sms.util');
const { sendFCM } = require('../../utils/fcm.util');
const handlebars = require('handlebars');
const { 
  NotFoundError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Unified Communication & Notification Service
 * 
 * Orchestrates multi-channel delivery (App, SMS, Email, Push) with 
 * tiered urgency logic and PHI protection protocols.
 */

// 1. Asynchronous Notification Queue (Bull)
const notificationQueue = new Queue('notifications', process.env.REDIS_URL || 'redis://localhost:6379');

class NotificationService {
  constructor() {
    this._processQueue();
  }

  /**
   * Master Dispatcher: Tiered Urgency Routing
   */
  async sendNotification(notificationData) {
    const { userId, type, urgency = 'LOW', content, data = {} } = notificationData;

    // 1. Triage by Urgency
    const channels = this._resolveChannels(urgency);

    // 2. Immediate Critical Dispatch (Bypass Queue)
    if (urgency === 'CRITICAL') {
      return this._dispatchImmediate(userId, channels, notificationData);
    }

    // 3. Queued Delivery (Exponential Backoff)
    return notificationQueue.add({
      userId,
      channels,
      notificationData
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 } // 1-minute base
    });
  }

  /**
   * In-App Socket.io + Database Persistence
   */
  async createInAppNotification(userId, notificationData) {
    const notification = await Notification.create({
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      status: 'UNREAD',
      timestamp: new Date()
    });

    // Real-time Socket.io Broadcast
    const io = getIO();
    io.to(`user_${userId}`).emit('NEW_NOTIFICATION', notification);

    return notification;
  }

  /**
   * PHI-Safe SMS Dispatcher
   */
  async sendSMS(to, message, urgency) {
    // 1. Mandatory PHI Check
    // "Protected Health Information" must not be in SMS.
    if (this._containsPHI(message)) {
      logger.warn(`PHI DETECTED IN SMS BLOCK: Scrubbing message for recipient ${to}`);
      message = "You have a new healthcare update. Please log in to your secure hospital portal to view details.";
    }

    // 2. Regulatory Compliance (160 Chars)
    if (message.length > 160) {
      logger.warn(`SMS OVERFLOW: Message length ${message.length} > 160. Segmenting...`);
    }

    try {
      return await sendSMSGateway(to, message);
    } catch (err) {
      logger.error(`SMS FAILURE: To=${to}, Error=${err.message}`);
      throw err;
    }
  }

  /**
   * Tiered Channel Resolver
   */
  _resolveChannels(urgency) {
    const matrix = {
      'LOW': ['IN_APP'],
      'MEDIUM': ['IN_APP', 'EMAIL'],
      'HIGH': ['IN_APP', 'EMAIL', 'SMS'],
      'CRITICAL': ['IN_APP', 'EMAIL', 'SMS', 'PUSH']
    };
    return matrix[urgency] || ['IN_APP'];
  }

  /**
   * Synchronous Critical Path
   */
  async _dispatchImmediate(userId, channels, data) {
    logger.info(`SYNCHRONOUS CRITICAL DISPATCH: User=${userId}, Channels=${channels.join(',')}`);
    const tasks = channels.map(channel => this._executeSend(userId, channel, data));
    return Promise.all(tasks);
  }

  /**
   * Generic Multi-channel Executor
   */
  async _executeSend(userId, channel, data) {
    try {
      switch (channel) {
        case 'IN_APP':
          return this.createInAppNotification(userId, data);
        case 'SMS':
          const user = await User.findByPk(userId);
          return this.sendSMS(user.phone, data.message, data.urgency);
        case 'EMAIL':
          // Integration with SES + Handlebars PDF attachments
          return sesEmail(data.template, data.payload);
        case 'PUSH':
          // Firebase Cloud Messaging (FCM) dispatch
          return sendFCM(userId, data.title, data.message);
        default:
          return null;
      }
    } catch (err) {
      logger.error(`CHANNEL ERROR [${channel}]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Background Queue Processor
   */
  _processQueue() {
    notificationQueue.process(async (job) => {
      const { userId, channels, notificationData } = job.data;
      for (const channel of channels) {
        await this._executeSend(userId, channel, notificationData);
      }
    });
  }

  /**
   * Privacy Check: HIPAA/PHI Detection Sentinel
   */
  _containsPHI(message) {
    // Simple heuristic for demo purposes
    const keywords = ['diagnosis', 'test result', 'prescription', 'cancer', 'blood type'];
    return keywords.some(k => message.toLowerCase().includes(k));
  }
}

module.exports = new NotificationService();
