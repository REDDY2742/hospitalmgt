const morgan = require('morgan');
const { logger } = require('../utils/logger.util');

/**
 * Access Logging Middleware
 * 
 * Integrates Morgan with Winston and provides custom metadata extraction 
 * (IP, UserID, Response Time) for each request.
 */

// 1. Morgan Stream Integration
const stream = {
  write: (message) => logger.http(message.trim())
};

// 2. Morgan Custom Format
// Includes Request ID for correlating access logs with application logs
morgan.token('requestId', (req) => req.id || 'N/A');
morgan.token('userId', (req) => (req.user ? req.user.id : 'anonymous'));

const accessLogger = morgan(
  ':requestId :userId :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

/**
 * Detailed Request/Response Debugger
 * Enabled only in DEBUG mode. Never logs bodies in production for compliance.
 */
const debugLogger = (req, res, next) => {
  if (process.env.LOG_LEVEL === 'debug' && process.env.NODE_ENV !== 'production') {
    const start = Date.now();
    
    // Capture response body on finish
    const oldSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - start;
      logger.debug(`Response Trace | ${req.id}`, {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        requestBody: req.body,
        responseSize: data ? data.length : 0
      });
      return oldSend.apply(res, arguments);
    };
  }
  next();
};

/**
 * Metadata Injector
 * Injects tracing info into every winston log call within the request lifecycle
 */
const injectLogContext = (req, res, next) => {
  req.log = logger.child({
    requestId: req.id,
    userId: req.user ? req.user.id : 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
};

module.exports = {
  accessLogger,
  debugLogger,
  injectLogContext
};
