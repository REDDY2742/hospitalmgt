const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis } = require('../config/redis');
const logger = require('../utils/logger.util');

/**
 * Rate Limiting Middleware Module
 * 
 * Provides multi-tier protection against brute-force and DoS attacks 
 * using a distributed Redis store.
 */

// Whitelist configuration
const INTERNAL_IPS = process.env.INTERNAL_IPS ? process.env.INTERNAL_IPS.split(',') : [];

/**
 * Custom Key Generator
 * Combines IP address and authenticated User ID (if available)
 */
const keyGenerator = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  return req.user ? `${ip}:${req.user.id}` : ip;
};

/**
 * Whitelist Skip Logic
 */
const skipWhitelist = (req) => INTERNAL_IPS.includes(req.ip);

/**
 * Custom Handler for Rate Limit Exceeded
 */
const limitHandler = (req, res, next, options) => {
  const userId = req.user ? req.user.id : 'anonymous';
  const ip = req.ip;

  logger.warn(`Rate Limit Exceeded | IP: ${ip} | User: ${userId} | Path: ${req.originalUrl}`, {
    ip,
    userId,
    endpoint: req.originalUrl,
    timestamp: new Date()
  });

  const retryAfter = Math.ceil(options.windowMs / 1000);
  const resetEpoch = Math.floor((Date.now() + options.windowMs) / 1000);

  res.status(429).json({
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later.',
    retryAfter: {
      seconds: retryAfter,
      humanReadable: `Please try again in ${Math.ceil(retryAfter / 60)} minutes`,
      resetEpoch
    }
  });
};

/**
 * 1. Global Rate Limiter
 * 500 req / 15 min per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelist,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:global:'
  }),
  handler: limitHandler
});

/**
 * 2. Authentication Limiter (Login, Register, OTP)
 * 10 req / 15 min per IP. 
 * Includes dynamic reduction for IPs with bad history.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    const failedAttempts = await redis.get(`hms:failed_auth:${req.ip}`);
    // If IP has more than 5 failed attempts in history, slash the limit to 2
    return (failedAttempts && parseInt(failedAttempts) > 5) ? 2 : 10;
  },
  standardHeaders: true,
  skip: skipWhitelist,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:auth:'
  }),
  handler: limitHandler
});

/**
 * 3. Password Reset Limiter
 * 3 req / hour per IP+Email
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const email = req.body.email || 'unknown';
    return `pwd-reset:${req.ip}:${email}`;
  },
  standardHeaders: true,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:pwd:'
  }),
  handler: limitHandler
});

/**
 * 4. API Limiter (Authenticated Users)
 * 100 req / min per user
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator,
  standardHeaders: true,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:api:'
  }),
  handler: limitHandler
});

/**
 * 5. Emergency Limiter (High throughput for specialized devices/users)
 * 1000 req / min
 */
const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:emergency:'
  }),
  handler: limitHandler
});

/**
 * 6. File Upload Limiter
 * 20 uploads / hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator,
  standardHeaders: true,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'hms:rl:upload:'
  }),
  handler: limitHandler
});

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  emergencyLimiter,
  uploadLimiter
};
