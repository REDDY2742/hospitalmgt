const { Model, DataTypes, Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger.util').createChildLogger('audit-security-model');

/**
 * Hospital Management System - Forensic Audit & Security Engine
 * 
 * Clinical compliance models for HIPAA and GDPR.
 * Provides immutable append-only ledgers for every interaction within the ecosystem.
 * SecurityEvent monitors for brute force, lateral movement, and data exfiltration.
 */
module.exports = (sequelize) => {
  // --- Custom Error for Immutability ---
  class ImmutableRecordError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ImmutableRecordError';
    }
  }

  // --- Audit Log Model ---
  class AuditLog extends Model {
    /**
     * @description High-frequency logging factory for the audit middleware
     */
    static async log(auditData) {
      try {
        return await this.create(auditData);
      } catch (err) {
        logger.error('CRITICAL_AUDIT_FAILURE: Failed to persist forensic log.', err);
        throw err;
      }
    }

    /**
     * @description Forensic history retrieval for specific clinical/financial records
     */
    static async getEntityHistory(entityType, entityId) {
      return this.findAll({
        where: { entityType, entityId },
        order: [['createdAt', 'ASC']]
      });
    }
  }

  AuditLog.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Forensic Audit Handle (AUDIT-YYYYMMDD-XXXXXXXXXX) */
    auditId: { type: DataTypes.STRING, unique: true, field: 'audit_id' },
    userId: { type: DataTypes.UUID, field: 'user_id' },
    userEmail: { type: DataTypes.STRING, field: 'user_email' },
    userRole: { type: DataTypes.STRING(30), field: 'user_role' },
    userName: { type: DataTypes.STRING(100), field: 'user_name' },
    sessionId: { type: DataTypes.STRING, field: 'session_id' },
    clientIp: { type: DataTypes.STRING(45), field: 'client_ip' },
    userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
    deviceType: { 
       type: DataTypes.ENUM('web_browser', 'mobile_app', 'api_client', 'system', 'cron_job', 'webhook'),
       field: 'device_type'
    },
    action: {
      type: DataTypes.ENUM(
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED', 
        'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETED',
        'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_VERIFIED',
        'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
        'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ROLE_CHANGED',
        'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED',
        'REPORT_GENERATED', 'REPORT_EXPORTED',
        'BULK_OPERATION', 'BATCH_IMPORT', 'DATA_EXPORT',
        'API_KEY_CREATED', 'API_KEY_REVOKED',
        'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_REFUNDED',
        'PRESCRIPTION_FINALIZED', 'PRESCRIPTION_DISPENSED',
        'LAB_RESULT_ENTERED', 'LAB_RESULT_VERIFIED',
        'DISCHARGE_PROCESSED', 'ADMISSION_CREATED',
        'EMERGENCY_ADMITTED', 'SURGERY_STARTED', 'SURGERY_COMPLETED',
        'CONTROLLED_SUBSTANCE_DISPENSED', 'BLOOD_ISSUED',
        'INSURANCE_CLAIM_SUBMITTED', 'INSURANCE_CLAIM_APPROVED',
        'CONFIGURATION_CHANGED', 'BACKUP_CREATED',
        'SENSITIVE_DATA_ACCESSED', 'CONFIDENTIAL_RECORD_VIEWED',
        'SYSTEM_ERROR', 'INTEGRATION_CALLED'
      ),
      allowNull: false
    },
    entityType: { type: DataTypes.STRING, field: 'entity_type' },
    entityId: { type: DataTypes.UUID, field: 'entity_id' },
    entityIdentifier: { type: DataTypes.STRING, field: 'entity_identifier' },
    module: {
      type: DataTypes.ENUM(
        'auth', 'patients', 'doctors', 'staff', 'nurses',
        'departments', 'appointments', 'wards', 'pharmacy', 'billing',
        'laboratory', 'medical_records', 'inventory', 'insurance',
        'emergency', 'blood_bank', 'operation_theatre', 'ambulance',
        'telemedicine', 'discharge', 'suppliers', 'notifications',
        'reports', 'system', 'configuration'
      ),
      allowNull: false
    },
    httpMethod: { type: DataTypes.ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE'), field: 'http_method' },
    endpoint: { type: DataTypes.STRING },
    statusCode: { type: DataTypes.INTEGER, field: 'status_code' },
    requestId: { type: DataTypes.STRING, field: 'request_id' },
    // --- Data Diff Snapshot ---
    previousValues: { type: DataTypes.JSON, field: 'previous_values' },
    newValues: { type: DataTypes.JSON, field: 'new_values' },
    /** @type {Array<string>} List of field keys that were modified */
    changedFields: { type: DataTypes.JSON, field: 'changed_fields', defaultValue: [] },
    description: { type: DataTypes.TEXT },
    metadata: { type: DataTypes.JSON, defaultValue: {} },
    tags: { type: DataTypes.JSON, defaultValue: [] },
    // --- Sensitivity & Compliance ---
    isSensitiveOperation: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_sensitive_operation' },
    isCriticalOperation: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_critical_operation' },
    requiresReview: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_review' },
    reviewedAt: { type: DataTypes.DATE, field: 'reviewed_at' },
    reviewedBy: { type: DataTypes.UUID, field: 'reviewed_by' },
    isSuccess: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_success' },
    errorMessage: { type: DataTypes.TEXT, field: 'error_message' },
    dataRetentionUntil: { type: DataTypes.DATE, field: 'data_retention_until' },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_archived' },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: false, // Managed manually (createdAt only)
    paranoid: false,   // Forbidden - no soft deletes
    indexes: [
      { unique: true, fields: ['audit_id'] },
      { fields: ['user_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['action'] },
      { fields: ['module'] },
      { fields: ['client_ip'] },
      { fields: ['created_at'] }
    ],
    hooks: {
      beforeCreate: async (log) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        log.auditId = `AUDIT-${dateStr}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        
        // Define Sensitive Models (PHI/PII)
        const sensitiveModels = ['Patient', 'MedicalRecord', 'Prescription', 'LabResult', 'BloodBank', 'Billing'];
        if (sensitiveModels.includes(log.entityType)) log.isSensitiveOperation = true;

        // Retention Policy Logic
        const retentionDays = log.module === 'billing' ? 2555 : 1825; // 7 years vs 5 years
        log.dataRetentionUntil = new Date(new Date().getTime() + retentionDays * 24 * 60 * 60 * 1000);
      },
      beforeUpdate: () => { throw new ImmutableRecordError('Clinical Integrity Failure: Audit logs are immutable and cannot be modified.'); },
      beforeDestroy: () => { throw new ImmutableRecordError('Compliance Failure: Audit logs are protected medical records and cannot be deleted.'); }
    }
  });

  // --- Security Event Model ---
  class SecurityEvent extends Model {
    /**
     * @description High-severity incident report
     */
    static async createEvent(eventData) {
       return this.create(eventData);
    }
  }

  SecurityEvent.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.STRING, unique: true, field: 'event_id' },
    severity: { type: DataTypes.ENUM('info', 'low', 'medium', 'high', 'critical'), defaultValue: 'low' },
    eventType: {
      type: DataTypes.ENUM(
        'brute_force_attempt', 'account_lockout', 'suspicious_login', 'impossible_travel_detected',
        'multiple_failed_otp', 'session_hijack_suspected', 'privilege_escalation_attempt', 'unauthorized_access',
        'data_exfiltration_suspected', 'api_rate_limit_exceeded', 'sql_injection_attempt', 'xss_attempt',
        'payment_tampering_suspected', 'prescription_forgery_suspected', 'system_intrusion_suspected'
      ),
      field: 'event_type'
    },
    userId: { type: DataTypes.UUID, field: 'user_id' },
    sourceIp: { type: DataTypes.STRING(45), field: 'source_ip' },
    description: { type: DataTypes.TEXT },
    /** @type {Object} Structured data for CSIRT investigation */
    evidence: { type: DataTypes.JSON, defaultValue: {} },
    riskScore: { type: DataTypes.INTEGER, field: 'risk_score', validate: { min: 0, max: 100 } },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved', 'false_positive', 'escalated', 'closed'),
      defaultValue: 'open'
    },
    assignedTo: { type: DataTypes.UUID, field: 'assigned_to' },
    resolvedAt: { type: DataTypes.DATE, field: 'resolved_at' },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
  }, {
    sequelize,
    modelName: 'SecurityEvent',
    tableName: 'security_events',
    underscored: true,
    timestamps: false,
    indexes: [
      { unique: true, fields: ['event_id'] },
      { fields: ['user_id'] },
      { fields: ['severity'] },
      { fields: ['event_type'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeCreate: (ev) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        ev.eventId = `SEC-${dateStr}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      },
      afterCreate: (ev) => {
        // Critical SOC Alerting Logic
        if (ev.severity === 'high' || ev.severity === 'critical') {
           logger.warn(`SECURITY_BREACH_ALERT: Unhandled ${ev.eventType} incident detected. Severity: ${ev.severity}`);
           // Emit socket 'security:alert' for SIEM dashboards
        }
      }
    }
  });

  /**
   * Hospital Management - Audit Associations
   */
  SecurityEvent.associate = (models) => {
    SecurityEvent.belongsTo(models.User, { foreignKey: 'userId', as: 'offender' });
    SecurityEvent.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'investigator' });
  };

  return { AuditLog, SecurityEvent };
};
