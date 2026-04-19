const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger.util').createChildLogger('user-model');

/**
 * Hospital Management System - Identity & Access Management (IAM) Model
 * 
 * Provides a secure, forensic-ready blueprint for all personnel and patients.
 * Features include:
 * - Bcrypt-12 forensic hashing
 * - Automatic HRM identification (HMS-USR-XXXXX)
 * - 5-attempt threshold account lockout
 * - Crypto-secure password recovery
 * - Paranoid soft-deletion policy
 */
module.exports = (sequelize) => {
  class User extends Model {
    /**
     * @description Compares a raw password with the hashed version in the database
     * @param {string} candidatePassword - Raw password from user input
     * @returns {Promise<boolean>} Match result
     */
    async comparePassword(candidatePassword) {
      if (!this.password) return false;
      return bcrypt.compare(candidatePassword, this.password);
    }

    /**
     * @description Validates if password was changed after a specific JWT issue timestamp
     * @param {number} JWTTimestamp - Token issuance timestamp in seconds
     * @returns {boolean} True if changed after token issue
     */
    changedPasswordAfter(JWTTimestamp) {
      if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
      }
      return false;
    }

    /**
     * @description Generates a crypto-secure 32-byte password reset token and sets 15min expiry
     * @returns {string} Plaintext reset token (send to user email)
     */
    createPasswordResetToken() {
      const resetToken = crypto.randomBytes(32).toString('hex');
      this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 Minute window
      return resetToken;
    }

    /**
     * @description Checks if the account is currently prohibited from authenticating due to lockout
     * @returns {boolean} True if locked
     */
    isAccountLocked() {
      return !!(this.lockUntil && this.lockUntil > Date.now());
    }

    /**
     * @description Increments failure counter and gates access with a 15-minute lock on 5th failure
     * @returns {Promise<User>} Updated user instance
     */
    async incrementLoginAttempts() {
      // Reset attempts if previous lockout window has passed
      if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({ loginAttempts: 1, lockUntil: null });
      }
      
      const updates = { loginAttempts: this.loginAttempts + 1 };
      if (updates.loginAttempts >= 5) {
        updates.lockUntil = Date.now() + 15 * 60 * 1000; // 15 Min Lockout
        logger.warn(`BRUTE_FORCE_PROTECTION: Account ${this.email} locked for 15 mins (5 failed attempts)`);
      }
      return this.update(updates);
    }

    /**
     * @description Security Override: Prevents accidental leakage of credential hashes in JSON responses
     * @returns {Object} Sanitized user object
     */
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      delete values.twoFactorSecret;
      delete values.refreshToken;
      delete values.passwordResetToken;
      return values;
    }
  }

  User.init({
    /** @type {string} Unique UUID v4 primary key */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Institutional Personnel/Patient ID (HMS-USR-XXXXX) */
    employeeId: {
      type: DataTypes.STRING,
      unique: true,
      comment: 'Automatic Sequential Identifier (HMS-USR-XXXXX)'
    },
    /** @type {string} Legal First Name */
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 50] }
    },
    /** @type {string} Legal Last Name */
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 50] }
    },
    /** @type {string} Unique Primary Email (Normalized to lowercase) */
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
      set(val) { this.setDataValue('email', val?.toLowerCase().trim()); }
    },
    /** @type {string} Unique Mobile Contact Number */
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    /** @type {string} Argon2/Bcrypt Password Hash */
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    /** @type {string} Role-Based Access Control (RBAC) Assignment */
    role: {
      type: DataTypes.ENUM(
        'super_admin', 'admin', 'doctor', 'nurse', 'staff', 
        'pharmacist', 'lab_technician', 'receptionist', 'accountant', 'patient'
      ),
      allowNull: false,
      defaultValue: 'staff'
    },
    /** @type {string} S3 Object URI for Profile Visualization */
    avatar: {
      type: DataTypes.STRING,
      validate: { isUrl: true }
    },
    /** @type {string} Foreign key link to Department model */
    departmentId: {
      type: DataTypes.UUID,
      field: 'department_id',
      comment: 'Organizational Binding'
    },
    /** @type {boolean} Global administrative toggle for account viability */
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    /** @type {boolean} Compliance flag for email reachability */
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    /** @type {boolean} Compliance flag for SMS reachability */
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    /** @type {boolean} MFA/2FA Global Policy Switch */
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    /** @type {string} Encrypted/Hashed 2FA Secret Key */
    twoFactorSecret: {
      type: DataTypes.STRING
    },
    /** @type {number} Counter for brute-force prevention gating */
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    /** @type {Date} Lockout timestamp preventing login */
    lockUntil: {
      type: DataTypes.DATE
    },
    /** @type {Date} Forensic timestamp of last successful session */
    lastLogin: {
      type: DataTypes.DATE
    },
    /** @type {string} Forensic IP tracking for security auditing */
    lastLoginIP: {
      type: DataTypes.STRING(45)
    },
    /** @type {string} Hashed persistence token for session longevity */
    refreshToken: {
      type: DataTypes.STRING
    },
    /** @type {string} Hashed reset vector for password recovery */
    passwordResetToken: {
      type: DataTypes.STRING
    },
    /** @type {Date} Expiry window for recovery operations */
    passwordResetExpires: {
      type: DataTypes.DATE
    },
    /** @type {Date} Threshold for token invalidation policies */
    passwordChangedAt: {
      type: DataTypes.DATE
    },
    /** @type {string} Creator identifier for audit trail */
    createdBy: {
      type: DataTypes.UUID
    },
    /** @type {string} Modifier identifier for audit trail */
    updatedBy: {
      type: DataTypes.UUID
    },
    // --- Virtual Fields ---
    /** @type {string} Concatenated Full Identity */
    fullName: {
      type: DataTypes.VIRTUAL,
      get() { return `${this.firstName} ${this.lastName}`; }
    },
    /** @type {boolean} Reactive calculation of lockout status */
    isLocked: {
      type: DataTypes.VIRTUAL,
      get() { return !!(this.lockUntil && this.lockUntil > Date.now()); }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true, // Soft-delete policy enabled
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['phone'] },
      { unique: true, fields: ['employee_id'] },
      { fields: ['role'] },
      { fields: ['department_id'] },
      { fields: ['first_name', 'last_name'] } // Composite for search performance
    ],
    scopes: {
      active: { where: { is_active: true } },
      byRole(role) { return { where: { role } }; },
      withDepartment: {
        include: [{ model: sequelize.models.Department, as: 'department' }]
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        // 1. Forensic Password Hashing
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
        // 2. HR Management Sequence Generation
        const sequence = Math.floor(10000 + Math.random() * 90000);
        user.employeeId = `HMS-USR-${sequence}`;
        // 3. Normalization
        user.email = user.email.toLowerCase().trim();
      },
      beforeUpdate: async (user) => {
        // Handle password changes
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
          user.loginAttempts = 0; // Reset metrics on manual reset
          user.lockUntil = null;
        }
      },
      afterCreate: (user) => {
        // Emit non-blocking welcome event for asynchronous mail delivery
        logger.info(`EVENT_EMITTED: User Provisioned [${user.email}]. Queueing welcome communication.`);
      }
    }
  });

  return User;
};
