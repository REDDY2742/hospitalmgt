const { Op } = require('sequelize');
const { db } = require('../../config/db');
const User = require('./user.model');
const AuditLog = require('../audit/audit.model'); // Assumed path
const RefreshToken = require('../auth/refreshToken.model'); // Assumed path
const AppError = require('../../utils/appError');
const { hashPassword } = require('../../utils/encryption.util');
const s3 = require('../../utils/s3.util');
const emailUtil = require('../../utils/email.util');
const { redis } = require('../../config/redis');
const crypto = require('crypto');

/**
 * Hospital User Identity & Access Management (IAM) Service
 * 
 * Orchestrates the complete lifecycle of clinical and administrative users, 
 * including role-based sequential ID generation, permission governance, 
 * and session state synchronization.
 */

class UserService {
  
  /**
   * --- User Lifecycle Operations ---
   */

  /**
   * @description Creates a new hospital staff/patient with role-specific sequential IDs
   */
  async createUser(userData, createdBy) {
    const transaction = await db.transaction();
    try {
      // 1. Identity Guard: Email and Phone Uniqueness
      const existing = await User.findOne({ 
        where: { [Op.or]: [{ email: userData.email }, { phone: userData.phone }] },
        transaction 
      });
      if (existing) throw new AppError('Conflict: Email or phone already registered', 409);

      // 2. Cryptographic Hardening
      const hashedPassword = await hashPassword(userData.password);

      // 3. Sequential Role-Based ID Generation (SA-XXXX, DR-XXXX, etc.)
      const employeeId = await this._generateSequentialId(userData.role, transaction);

      // 4. Clinical Document Storage (Profile Photo)
      let profilePhotoUrl = null;
      if (userData.profilePhoto) {
        const uploadResult = await s3.uploadFile(userData.profilePhoto.buffer, `users/${employeeId}/profile.jpg`, process.env.AWS_S3_PUBLIC_BUCKET);
        profilePhotoUrl = uploadResult.url;
      }

      // 5. Persistence
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        employeeId,
        profilePhoto: profilePhotoUrl,
        isActive: true,
        permissions: this._getRoleDefaults(userData.role)
      }, { transaction });

      // 6. Audit & Communication
      await AuditLog.create({
        userId: createdBy.id,
        action: 'USER_CREATED',
        module: 'USERS',
        resourceId: user.id,
        details: { employeeId: user.employeeId, role: user.role }
      }, { transaction });

      await emailUtil.sendWelcomeEmail(user, userData.password); // Send temp password

      await transaction.commit();
      
      const sanitized = user.get({ plain: true });
      delete sanitized.password;
      return sanitized;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * @description Retrieves a sanitized user record with role-based field masking
   */
  async getUserById(userId, requestingUser) {
    const cacheKey = `hms:users:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    // Filter Logic: Mask sensitive fields based on requester role
    const sanitized = this._applyFieldMasking(user, requestingUser);

    await redis.set(cacheKey, JSON.stringify(sanitized), 'EX', 300); // 5 min cache
    return sanitized;
  }

  /**
   * @description Atomic update with role-based whitelisting and session invalidation
   */
  async updateUser(userId, updateData, updatedBy) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    // Field Whitelist Enforcement
    const validatedData = this._validateUpdatePermissions(updateData, updatedBy, user);
    
    const oldValues = { ...user.dataValues };
    const changedFields = [];

    Object.keys(validatedData).forEach(key => {
      if (user[key] !== validatedData[key]) {
        changedFields.push({ field: key, old: user[key], new: validatedData[key] });
        user[key] = validatedData[key];
      }
    });

    if (changedFields.length === 0) return user;

    // Side Effects: Identity & Session Invalidations
    if (validatedData.role && validatedData.role !== oldValues.role) {
      await this.revokeAllUserSessions(userId, false, updatedBy.id);
      user.permissions = this._getRoleDefaults(validatedData.role);
    }

    if (validatedData.isActive === false) {
      await RefreshToken.destroy({ where: { userId } });
    }

    await user.save();
    
    // Invalidate Cache
    await redis.del(`hms:users:${userId}`);
    
    await AuditLog.create({
      userId: updatedBy.id,
      action: 'USER_UPDATED',
      module: 'USERS',
      resourceId: userId,
      details: { changedFields }
    });

    return this._applyFieldMasking(user, updatedBy);
  }

  /**
   * @description Administrative soft-deletion with forensic logging
   */
  async deactivateUser(userId, reason, deactivatedBy) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = deactivatedBy.id;
    await user.save();

    // Session Purge
    await RefreshToken.destroy({ where: { userId } });
    await redis.set(`blacklist:user:${userId}`, 'DEACTIVATED', 'EX', 86400); // 24hr blacklist

    await AuditLog.create({
      userId: deactivatedBy.id,
      action: 'USER_DEACTIVATED',
      module: 'USERS',
      resourceId: userId,
      details: { reason }
    });

    await emailUtil.sendEmail(user.email, 'Account Deactivated', 'Your hospital EMS account has been deactivated.');
    return { success: true, message: 'User deactivated successfully' };
  }

  /**
   * --- Internal Logic Gateways ---
   */

  async _generateSequentialId(role, transaction) {
    const prefixes = {
      SUPER_ADMIN: 'SA', ADMIN: 'AD', DOCTOR: 'DR', NURSE: 'NR',
      PHARMACIST: 'PH', LAB_TECHNICIAN: 'LT', RECEPTIONIST: 'RC',
      ACCOUNTANT: 'AC', STAFF: 'ST'
    };
    
    if (role === 'PATIENT') {
      const year = new Date().getFullYear();
      const last = await User.findOne({ 
        where: { employeeId: { [Op.like]: `PT-${year}-%` } },
        order: [['employeeId', 'DESC']],
        transaction
      });
      const seq = last ? parseInt(last.employeeId.split('-')[2]) + 1 : 1;
      return `PT-${year}-${seq.toString().padStart(6, '0')}`;
    }

    const prefix = prefixes[role] || 'ST';
    const last = await User.findOne({
      where: { employeeId: { [Op.like]: `${prefix}-%` } },
      order: [['employeeId', 'DESC']],
      transaction
    });
    const seq = last ? parseInt(last.employeeId.split('-')[1]) + 1 : 1;
    return `${prefix}-${seq.toString().padStart(4, '0')}`;
  }

  _getRoleDefaults(role) {
    const matrix = {
      DOCTOR: ['read_patients', 'write_prescriptions', 'request_labs', 'ot_access'],
      ADMIN: ['manage_users', 'view_revenue', 'system_config', 'audit_access'],
      STAFF: ['read_schedules', 'log_attendance']
    };
    return matrix[role] || [];
  }

  _applyFieldMasking(user, requester) {
    const data = user.get({ plain: true });
    delete data.password;

    // Hierarchy: Admin > HR > Individual
    if (requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN') return data;
    if (requester.id === user.id) return data;
    
    if (requester.role === 'HR') {
      delete data.aadhaarNumber;
      delete data.bankDetails;
      return data;
    }

    // Public Profile
    return {
      id: data.id,
      name: data.name,
      employeeId: data.employeeId,
      role: data.role,
      department: data.department,
      profilePhoto: data.profilePhoto
    };
  }

  _validateUpdatePermissions(data, requester, targetUser) {
    if (requester.role === 'SUPER_ADMIN') return data;
    
    const allowedFields = [];
    if (requester.role === 'ADMIN') allowedFields.push('role', 'department', 'isActive', 'permissions', 'salary');
    if (requester.id === targetUser.id) allowedFields.push('name', 'phone', 'address', 'profilePhoto', 'password');

    const filtered = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) filtered[key] = data[key];
    });
    return filtered;
  }
}

module.exports = new UserService();
