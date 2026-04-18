const jwt = require('jsonwebtoken');
const { redis } = require('../config/redis');
const logger = require('../utils/logger.util');
const { User } = require('../models');

/**
 * Authentication Middleware
 * 
 * Implements bulletproof JWT verification with RS256, blacklisting, 
 * active user validation, and token rotation.
 */

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * Helper to log authentication failures
 */
const logAuthFailure = (req, reason, userId = 'Unknown') => {
  logger.warn(`Auth Failure | IP: ${req.ip} | UserID: ${userId} | Reason: ${reason}`, {
    ip: req.ip,
    userId,
    reason,
    timestamp: new Date()
  });
};

/**
 * Generate a new access token (for rotation)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '15m'
  });
};

const protect = async (req, res, next) => {
  let token;

  // 1. Extract Token from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logAuthFailure(req, 'Missing Token');
    return res.status(401).json({ status: 'error', message: 'Not authorized, token missing' });
  }

  try {
    // 2. Check Blacklist in Redis (logged-out tokens)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      logAuthFailure(req, 'Blacklisted Token');
      return res.status(401).json({ status: 'error', message: 'Session expired, please login again' });
    }

    // 3. Verify Token using RS256
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });

    // 4. Validate User Activity (Cached in Redis for 5 min)
    const cacheKey = `user_status:${decoded.id}`;
    let userStatus = await redis.get(cacheKey);

    if (!userStatus) {
      const user = await User.findByPk(decoded.id, { attributes: ['id', 'isActive'] });
      if (!user) {
        logAuthFailure(req, 'User Not Found', decoded.id);
        return res.status(401).json({ status: 'error', message: 'User account no longer exists' });
      }
      userStatus = user.isActive ? 'active' : 'inactive';
      await redis.set(cacheKey, userStatus, 'EX', 300); // 5 min cache
    }

    if (userStatus !== 'active') {
      logAuthFailure(req, 'User Inactive', decoded.id);
      return res.status(401).json({ status: 'error', message: 'User account is deactivated' });
    }

    // 5. Attach payload to request
    req.user = decoded;

    // 6. Token Rotation (if within 10 minutes of expiry)
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = decoded.exp - now;
    
    if (timeToExpiry > 0 && timeToExpiry < 600) { // < 10 minutes
      const newToken = generateAccessToken({
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
        email: decoded.email,
        departmentId: decoded.departmentId,
        isActive: true
      });
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (error) {
    // 7. Handle JWT errors distinctly
    if (error.name === 'TokenExpiredError') {
      logAuthFailure(req, 'Token Expired');
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logAuthFailure(req, 'Malformed Token');
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    if (error.name === 'NotBeforeError') {
      logAuthFailure(req, 'Token Not Yet Active');
      return res.status(401).json({ status: 'error', message: 'Token not yet active', date: error.date });
    }

    logger.error(`Auth Middleware Error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Internal authentication error' });
  }
};

const { authorize } = require('./rbac.middleware');

module.exports = {
  protect,
  authorize,
  generateAccessToken
};
