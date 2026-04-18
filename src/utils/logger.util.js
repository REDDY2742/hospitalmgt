const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;

/**
 * Hospital Observability & Structured Logging Utility
 * 
 * Implements context-aware logging with HIPAA-compliant PII masking 
 * and dedicated audit/security transport streams.
 */

const SHIELDED_FIELDS = [
  'password', 'token', 'refreshToken', 'otp', 'aadhaarNumber', 
  'cardNumber', 'cvv', 'pin', 'secretKey', 'privateKey', 
  'accountNumber', 'panNumber', 'email'
];

/**
 * @description Deep-scans and masks sensitive keys in log payloads
 */
const maskData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (SHIELDED_FIELDS.includes(key)) {
      masked[key] = '***REDACTED***';
    } else if (typeof obj[key] === 'object') {
      masked[key] = maskData(obj[key]);
    } else {
      masked[key] = obj[key];
    }
  }
  return masked;
};

const maskFormat = format((info) => {
  const meta = info[Symbol.for('splat')]?.[0];
  if (meta) info[Symbol.for('splat')][0] = maskData(meta);
  if (info.meta) info.meta = maskData(info.meta);
  return info;
});

const logger = createLogger({
  levels: {
    error: 0,
    warn: 1,
    audit: 2, // Custom level for regulatory compliance
    info: 3,
    debug: 4
  },
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    maskFormat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    new transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      level: 'info'
    }),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
      zippedArchive: true,
      level: 'error'
    }),
    new transports.DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '365d',
      zippedArchive: true,
      level: 'audit'
    })
  ]
});

module.exports = logger;

module.exports.logAudit = (action, userId, module, resourceId, meta) => {
  logger.log('audit', `${action} by ${userId} on ${module}:${resourceId}`, { meta });
};

module.exports.logSecurity = (event, userId, ip, details) => {
  logger.warn(`SECURITY_EVENT: ${event} | User: ${userId} | IP: ${ip}`, { details });
};

module.exports.logPerformance = (operation, durationMs, meta) => {
  logger.info(`PERF: ${operation} completed in ${durationMs}ms`, { meta });
};

module.exports.createChildLogger = (moduleName) => {
  return logger.child({ label: moduleName });
};
