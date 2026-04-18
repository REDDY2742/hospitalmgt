const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

/**
 * Audit Log Model
 * 
 * Compliant with HIPAA/DISHA requirements for clinical data access and modification tracking.
 * Includes tamper detection via content-based hashing.
 */
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.ENUM('READ', 'CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previousValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  newValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  integrityHash: {
    type: DataTypes.STRING(64),
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  hooks: {
    beforeCreate: (audit) => {
      // Tamper Detection: Generate SHA-256 hash of all content fields
      const content = JSON.stringify({
        id: audit.id,
        timestamp: audit.timestamp,
        userId: audit.userId,
        action: audit.action,
        module: audit.module,
        resourceId: audit.resourceId,
        previousValue: audit.previousValue,
        newValue: audit.newValue
      });
      audit.integrityHash = crypto.createHash('sha256').update(content).digest('hex');
    }
  }
});

module.exports = AuditLog;
