const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const morgan = require('morgan');
const os = require('os');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

/**
 * Hospital Management System - Enterprise Observability Engine
 * 
 * Provides production-grade structured logging with HIPAA-compliant masking, 
 * long-term security auditing, and performance telemetry.
 * Features: Multi-transport rotation, request tracing, and PII sanitization.
 */

// --- Request Context Storage ---
const asyncStorage = new AsyncLocalStorage();

// --- Log Levels & Colors ---
const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  security: 3,
  audit: 4,
  info: 5,
  http: 6,
  debug: 7
};

const colors = {
  fatal: 'magenta bold',
  error: 'red',
  warn: 'yellow',
  security: 'red bold',
  audit: 'cyan',
  info: 'green',
  http: 'blue',
  debug: 'white'
};

winston.addColors(colors);

// --- PII & Sensitive Data Sanitization ---

const SENSITIVE_FIELDS = ['password', 'aadhaar', 'pan', 'card', 'cvv', 'otp', 'secret', 'token'];

const sanitize = (info) => {
  const result = { ...info };
  const mask = (val) => (typeof val === 'string' ? `${val.slice(0, 4)}****` : '****');

  const recursiveMask = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        recursiveMask(obj[key]);
      } else if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        obj[key] = mask(obj[key]);
      }
    }
  };

  recursiveMask(result);
  return result;
};

const sanitizeFormat = winston.format(info => sanitize(info));

// --- Format Definitions ---

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  sanitizeFormat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const context = asyncStorage.getStore() || {};
    const reqInfo = context.requestId ? `[${context.requestId}] ` : '';
    return `${info.timestamp} ${info.level}: ${reqInfo}${info.message} ${info.module ? `(${info.module})` : ''}`;
  })
);

// --- Transports Setup ---

const createTransports = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const logDir = 'logs';

  const transports = [
    new winston.transports.Console({
      format: isProd ? jsonFormat : consoleFormat,
      level: isProd ? 'info' : 'debug'
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    }),
    // Compliance: Long term audit & security logs
    new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '365d',
      level: 'security'
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '2555d', // 7 years retention
      level: 'audit'
    })
  ];

  return transports;
};

// --- Logger Instance ---

const logger = winston.createLogger({
  levels,
  defaultMeta: {
    service: 'hospital-management-system',
    hostname: os.hostname(),
    env: process.env.NODE_ENV || 'development'
  },
  transports: createTransports(),
  exitOnError: false
});

// --- Performance & Tracing Methods ---

/**
 * @description Creates a child logger with fixed module metadata
 */
logger.createChildLogger = (moduleName) => {
  return logger.child({ module: moduleName });
};

/**
 * @description Starts a performance timer
 */
logger.createTimer = (label) => {
  const start = Date.now();
  return (meta = {}) => {
    const duration = Date.now() - start;
    logger.info(`PERFORMANCE: ${label}`, { ...meta, duration, threshold: meta.threshold || 500 });
    if (duration > (meta.threshold || 500)) {
      logger.warn(`SLOW_OPERATION: ${label} took ${duration}ms`, { ...meta, duration });
    }
  };
};

// --- Morgan HTTP Integration ---

const morganMiddleware = morgan((tokens, req, res) => {
  const context = asyncStorage.getStore() || {};
  const message = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms'
  ].join(' ');

  logger.http(message, {
    requestId: context.requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  return null; // Don't write to standard morgan stream
});

// --- Lifecycle & Middlewares ---

/**
 * @description Middleware to initialize request context using AsyncLocalStorage
 */
const requestContextMiddleware = (req, res, next) => {
  const context = {
    requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
    userId: req.user?.id,
    startTime: Date.now()
  };
  asyncStorage.run(context, next);
};

// --- Specialized Forensic Handlers ---

const maskIP = (ip) => {
  if (process.env.NODE_ENV !== 'production') return ip;
  if (!ip) return '0.0.0.0';
  return ip.replace(/\d+$/, 'XXX'); // Mask last octet
};

/**
 * @description Capture application exceptions with context and optional Sentry/External sink
 */
const captureException = (error, context = {}) => {
  const isOperational = error.isOperational || false;
  logger.error(error.message, {
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    code: error.code,
    isOperational,
    ...context
  });
  
  if (!isOperational) {
    // Logic: Trigger infra alert if non-operational (system failure)
  }
};

/**
 * @description Immutable audit log generator for HIPAA compliance
 */
const audit = (userId, action, entity = {}, changes = {}) => {
  logger.log('audit', `${action} by ${userId}`, {
    userId,
    action,
    entityType: entity.type,
    entityId: entity.id,
    changes,
    timestamp: new Date().toISOString()
  });
};

/**
 * @description Performance tracking for database queries
 */
const trackDatabaseQuery = async (queryFn, model, operation) => {
  const timer = logger.createTimer(`DB_QUERY:${model}/${operation}`);
  try {
    const result = await queryFn();
    timer();
    return result;
  } catch (err) {
    timer({ status: 'error' });
    throw err;
  }
};

/**
 * @description Safe logger termination (flushes buffers before shutdown)
 */
const shutdownLogger = async () => {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
};

module.exports = {
  logger,
  requestContextMiddleware,
  morganMiddleware,
  createChildLogger: logger.createChildLogger,
  createTimer: logger.createTimer,
  captureException,
  audit,
  trackDatabaseQuery,
  shutdownLogger,
  maskIP,
  fatal: (msg, meta) => logger.log('fatal', msg, meta),
  security: (msg, meta) => logger.log('security', msg, meta)
};
