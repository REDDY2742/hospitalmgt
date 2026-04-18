const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, sequelize, AuditLog } = require('../../models');
const { redis } = require('../../config/redis');
const { 
  AppError, 
  AuthenticationError, 
  ValidationError, 
  ConflictError 
} = require('../../utils/appError.util');
const { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } = require('../../utils/email.util');
const logger = require('../../utils/logger.util');

/**
 * Authentication Service
 * 
 * Implements security-critical business logic for identity management,
 * stateful session tracking, and clinical access auditing.
 */

class AuthService {
  /**
   * Register a new staff/patient (Admin only)
   */
  async registerUser(userData, adminId) {
    const transaction = await sequelize.transaction();

    try {
      const { email, phone, role, name, departmentId } = userData;

      // 1. Uniqueness check
      const existingUser = await User.findOne({ where: { [sequelize.Op.or]: [{ email }, { phone }] } });
      if (existingUser) {
        throw new ConflictError('Email or phone number already registered');
      }

      // 2. Generate Role-based Employee ID (e.g., DR-001)
      const prefixMap = { DOCTOR: 'DR', NURSE: 'NR', STAFF: 'ST', PATIENT: 'PT' };
      const prefix = prefixMap[role] || 'EM';
      const count = await User.count({ where: { role }, transaction });
      const employeeId = `${prefix}-${String(count + 1).padStart(3, '0')}`;

      // 3. Hash Temporary Password
      const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // 4. Create User
      const user = await User.create({
        ...userData,
        employeeId,
        password: hashedPassword,
        isActive: true
      }, { transaction });

      // 5. Auditing & Communication
      await AuditLog.create({
        userId: adminId,
        action: 'CREATE',
        module: 'auth',
        resourceId: user.id,
        newValue: { email, role, employeeId }
      }, { transaction });

      await transaction.commit();

      // Async Email (outside transaction)
      sendWelcomeEmail(email, { name, employeeId, tempPassword });

      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Authenticate user and issue tokens
   */
  async loginUser(email, password, deviceInfo) {
    // 1. Find User
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'password', 'role', 'isActive', 'departmentId', 'name']
    });

    if (!user) throw new AuthenticationError('Invalid credentials');

    // 2. Account Lockout Protection (Redis-backed)
    const lockoutKey = `lockout:${user.id}`;
    const failedAttemptsKey = `failed_attempts:${user.id}`;

    const isLocked = await redis.get(lockoutKey);
    if (isLocked) throw new AuthenticationError('Account temporarily locked. Please try again in 30 minutes.');

    // 3. Verify Password
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      const attempts = await redis.incr(failedAttemptsKey);
      await redis.expire(failedAttemptsKey, 3600); // 1 hour TTL for counter

      if (attempts >= 5) {
        await redis.set(lockoutKey, 'LOCKED', 'EX', 1800); // 30 min lockout
        await redis.del(failedAttemptsKey);
        logger.warn(`Account Locked | User: ${user.id} | IP: ${deviceInfo.ip}`);
        throw new AuthenticationError('Too many failed attempts. Account locked for 30 minutes.');
      }
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) throw new AuthenticationError('Account is deactivated. Contact Admin.');

    // 4. Issue Tokens
    const accessToken = this._generateRS256Token(user);
    const refreshToken = uuidv4();
    
    // Hash and store refresh token in Redis (7d TTL)
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await redis.set(`refresh_token:${user.id}:${hashedRefresh}`, 'valid', 'EX', 7 * 24 * 60 * 60);

    // 5. Audit & Recovery
    await redis.del(failedAttemptsKey);
    logger.info(`Login Success | User: ${user.id} | Role: ${user.role}`, { deviceInfo });

    return {
      user: { id: user.id, role: user.role, name: user.name, departmentId: user.departmentId },
      accessToken,
      refreshToken
    };
  }

  /**
   * Renew session using refresh token
   */
  async refreshAccessToken(refreshToken, userId) {
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const isValid = await redis.get(`refresh_token:${userId}:${hashedRefresh}`);

    if (!isValid) throw new AuthenticationError('Invalid or expired refresh token');

    const user = await User.findByPk(userId, { attributes: ['id', 'role', 'departmentId', 'name', 'isActive'] });
    if (!user || !user.isActive) throw new AuthenticationError('User no longer eligible for session renewal');

    return this._generateRS256Token(user);
  }

  /**
   * Terminal Session End
   */
  async logoutUser(userId, accessToken, refreshToken) {
    // 1. Blacklist Access Token
    const decoded = jwt.decode(accessToken);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`blacklist:${accessToken}`, '1', 'EX', ttl);
    }

    // 2. Revoke Refresh Token
    if (refreshToken) {
      const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await redis.del(`refresh_token:${userId}:${hashedRefresh}`);
    }

    logger.info(`Logout Event | User: ${userId}`);
    return true;
  }

  /**
   * MFA / Security Challenge
   */
  async generateAndSendOTP(email) {
    // 1. Rate Limiting (3 OTPs per hour)
    const rateKey = `otp_rate:${email}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 3) throw new AppError('Too many OTP attempts. Try again in an hour.', 429);

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // 3. Store in Redis (10m TTL)
    await redis.set(`otp:${email}`, hashedOTP, 'EX', 600);

    // 4. Dispatch
    sendOTPEmail(email, otp);
    // smsService.sendOTP(phone, otp); 

    return true;
  }

  async verifyOTP(email, otp) {
    const storedHash = await redis.get(`otp:${email}`);
    if (!storedHash) throw new ValidationError('OTP expired or not found');

    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (storedHash !== inputHash) throw new ValidationError('Invalid OTP code');

    await redis.del(`otp:${email}`); // Single use
    return true;
  }

  /**
   * Password Recovery Logic
   */
  async resetPassword(resetToken, newPassword) {
    // 1. Validate Token
    const userId = await redis.get(`reset_token:${resetToken}`);
    if (!userId) throw new ValidationError('Invalid or expired reset token');

    // 2. Enforce Complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ValidationError('Password must be 8+ chars with uppercase, number, and special character');
    }

    // 3. Update & Revoke All
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.update({ password: hashedPassword }, { where: { id: userId } });
    
    // Revoke all existing refresh tokens for this user
    const keys = await redis.keys(`refresh_token:${userId}:*`);
    if (keys.length > 0) await redis.del(...keys);

    await redis.del(`reset_token:${resetToken}`);
    
    // 4. Notify
    const user = await User.findByPk(userId, { attributes: ['email', 'name'] });
    // sendPasswordChangeConfirmation(user.email, user.name);

    return true;
  }

  /**
   * Private Token Issuer
   */
  _generateRS256Token(user) {
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    return jwt.sign({
      id: user.id,
      role: user.role,
      name: user.name,
      departmentId: user.departmentId,
      isActive: true
    }, privateKey, {
      algorithm: 'RS256',
      expiresIn: '15m'
    });
  }
}

module.exports = new AuthService();
