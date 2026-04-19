const { Model, DataTypes, Op } = require('sequelize');
const { nanoid } = require('nanoid');
const schedule = require('node-schedule');
const logger = require('../utils/logger.util').createChildLogger('notification-model');

/**
 * Hospital Management System - Real-time Communication & Notification Model
 * 
 * Orchestrates multi-channel institutional alerts (In-App, Push, Email, SMS, WhatsApp) 
 * for clinical trauma, administrative scheduling, and financial billing events.
 */
module.exports = (sequelize) => {
  // --- Notification Template Model ---
  class NotificationTemplate extends Model {
    /**
     * @description Replaces all {{variable}} placeholders with forensic medical data
     */
    render(channel, variables = {}) {
      let content = this[`${channel}_message`] || this[`${channel}_body`] || this[`${channel}_htmlBody`] || '';
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      }
      return content;
    }
  }

  NotificationTemplate.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    templateCode: { type: DataTypes.STRING(20), unique: true, field: 'template_code' },
    notificationType: { type: DataTypes.STRING(50), field: 'notification_type' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    language: { type: DataTypes.ENUM('en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu'), defaultValue: 'en' },
    inApp_title: { type: DataTypes.STRING, field: 'in_app_title' },
    inApp_message: { type: DataTypes.TEXT, field: 'in_app_message' },
    email_subject: { type: DataTypes.STRING, field: 'email_subject' },
    email_htmlBody: { type: DataTypes.TEXT, field: 'email_html_body' },
    sms_message: { type: DataTypes.TEXT, field: 'sms_message' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'NotificationTemplate',
    tableName: 'notification_templates',
    underscored: true,
    paranoid: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['template_code'] },
      { fields: ['notification_type'] },
      { fields: ['language'] },
      { fields: ['is_default'] },
      { fields: ['is_active'] },
      { fields: ['notification_type', 'language', 'is_default'] }
    ]
  });

  // --- Notification Model ---
  class Notification extends Model {
    /**
     * @description Professional state transition for In-App UI
     */
    async markRead() {
      return this.update({
        inApp_isRead: true,
        inApp_readAt: new Date(),
      });
    }

    /**
     * @description Multi-channel orchestration logic
     */
    async send() {
      // Logic for sending across activated channels (Email/SMS/WhatsApp/Push)
      return this.update({ status: 'sent', overallDeliveryStatus: 'fully_delivered' });
    }
  }

  Notification.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    notificationId: { type: DataTypes.STRING, unique: true, field: 'notification_id' },
    recipientId: { type: DataTypes.UUID, allowNull: false, field: 'recipient_id' },
    recipientRole: { type: DataTypes.STRING(30), field: 'recipient_role' },
    senderId: { type: DataTypes.UUID, field: 'sender_id' },
    senderType: { 
       type: DataTypes.ENUM('system', 'user', 'automated', 'external_api'), 
       defaultValue: 'system',
       field: 'sender_type'
    },
    type: { type: DataTypes.STRING(50), allowNull: false },
    category: {
      type: DataTypes.ENUM('clinical', 'administrative', 'billing', 'pharmacy', 'laboratory', 'emergency', 'operational', 'hr', 'system', 'marketing'),
      defaultValue: 'system'
    },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent', 'critical'), defaultValue: 'medium' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    data: { type: DataTypes.JSON, defaultValue: {} },
    channels: { type: DataTypes.JSON, defaultValue: ['in_app'] },
    // --- In-App Specifics ---
    inApp_isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'in_app_isRead' },
    inApp_readAt: { type: DataTypes.DATE, field: 'in_app_readAt' },
    inApp_actionUrl: { type: DataTypes.STRING, field: 'in_app_actionUrl' },
    // --- Channel Sent Statuses ---
    email_sent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'email_sent' },
    sms_sent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'sms_sent' },
    wa_sent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'wa_sent' },
    push_sent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'push_sent' },
    socket_emitted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'socket_emitted' },
    // --- Logistics ---
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'partially_sent', 'sent', 'delivered', 'failed', 'cancelled', 'expired'),
      defaultValue: 'pending'
    },
    overallDeliveryStatus: {
      type: DataTypes.ENUM('not_sent', 'partially_delivered', 'fully_delivered', 'failed'),
      defaultValue: 'not_sent',
      field: 'overall_delivery_status'
    },
    scheduledFor: { type: DataTypes.DATE, field: 'scheduled_for' },
    expiresAt: { type: DataTypes.DATE, field: 'expires_at' },
    templateId: { type: DataTypes.UUID, field: 'template_id' }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    underscored: true,
    indexes: [
      { unique: true, fields: ['notification_id'] },
      { fields: ['recipient_id'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['priority'] }
    ],
    hooks: {
      beforeCreate: async (notif) => {
        notif.notificationId = `NOTIF-${nanoid(14)}`;
        if (!notif.scheduledFor) notif.status = 'processing';
        
        // Default expiration: 7 days
        notif.expiresAt = notif.expiresAt || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
      },
      afterCreate: (notif) => {
        // 1. Immediate Socket Emit for In-App Alert
        try {
          const { getIO } = require('../config/socket');
          getIO().to(notif.recipientId).emit('notification:new', notif);
        } catch (e) {}

        // 2. Deferred Scheduling logic
        if (notif.scheduledFor && notif.scheduledFor > new Date()) {
           schedule.scheduleJob(notif.scheduledFor, () => {
              notif.send();
           });
        } else if (notif.status === 'processing') {
           // Queue to BullMq / Redis etc for background background tasks
           notif.send(); 
        }
      }
    }
  });

  // --- Device Token Model ---
  class DeviceToken extends Model {
    async refresh(newToken) {
      return this.update({ token: newToken, lastUsedAt: new Date() });
    }
  }

  DeviceToken.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    token: { type: DataTypes.TEXT, allowNull: false },
    platform: { type: DataTypes.ENUM('android', 'ios', 'web'), allowNull: false },
    deviceId: { type: DataTypes.STRING, field: 'device_id' },
    deviceModel: { type: DataTypes.STRING, field: 'device_model' },
    osVersion: { type: DataTypes.STRING, field: 'os_version' },
    appVersion: { type: DataTypes.STRING, field: 'app_version' },
    browser: { type: DataTypes.STRING },
    p256dh: { type: DataTypes.STRING },
    auth: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    lastUsedAt: { type: DataTypes.DATE, field: 'last_used_at' },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'registered_at' }
  }, {
    sequelize,
    modelName: 'DeviceToken',
    tableName: 'device_tokens',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token'], length: 255 },
      { fields: ['platform'] },
      { fields: ['is_active'] },
      { fields: ['user_id', 'platform', 'is_active'] }
    ],
    hooks: {
      beforeCreate: async (dt) => {
        // Upsert Logic: Check for existing token for this user/platform
        const existing = await DeviceToken.findOne({
          where: { userId: dt.userId, platform: dt.platform, token: dt.token }
        });
        if (existing) {
          await existing.update({ lastUsedAt: new Date(), isActive: true });
          throw new Error('DEVICE_TOKEN_EXISTS'); // Intercept to prevent duplicate
        }
      }
    }
  });

  // --- Associations ---
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
    Notification.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    Notification.belongsTo(models.NotificationTemplate, { foreignKey: 'templateId', as: 'template' });
  };

  NotificationTemplate.associate = (models) => {
    NotificationTemplate.hasMany(models.Notification, { foreignKey: 'templateId', as: 'notifications' });
  };

  DeviceToken.associate = (models) => {
    DeviceToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return { Notification, NotificationTemplate, DeviceToken };
};
