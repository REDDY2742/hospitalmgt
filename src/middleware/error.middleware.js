const logger = require('../utils/logger.util');
const { AppError } = require('../utils/appError.util');

/**
 * Global Error Handler Middleware
 * 
 * Intercepts all errors, maps specialized engine errors (Sequelize, JWT, Multer)
 * to AppErrors, and returns enviroment-sanitized JSON responses.
 */

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: 'error',
    code: err.errorCode,
    message: err.message,
    module: err.module,
    details: err.details,
    requestId: req.id,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, req, res) => {
  // 1. Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.errorCode,
      message: err.message,
      requestId: req.id,
      details: err.details // safe validation details
    });
  }

  // 2. Programming or other unknown error: don't leak error details
  logger.error('CRITICAL: Internal System Error', {
    requestId: req.id,
    error: err.message,
    stack: err.stack
  });

  // Placeholder for Sentry/Datadog alerting
  // monitoringService.captureException(err);

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'A system error occurred. Our engineering team has been notified.',
    requestId: req.id
  });
};

const handleSequelizeError = (err) => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = `Duplicate field value: ${err.errors[0].value}. Please use another value!`;
    return new AppError(message, 409, 'DUPLICATE_RESOURCE');
  }
  if (err.name === 'SequelizeValidationError') {
    const message = `Validation failed: ${err.errors.map(el => el.message).join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Operation failed: Related resource does not exist', 400, 'RELATION_ERROR');
  }
  if (err.name === 'SequelizeConnectionError') {
    return new AppError('Database connection lost', 503, 'DB_CONNECT_ERROR');
  }
  return err;
};

const handleJWTError = () => new AppError('Invalid token. Please login again!', 401, 'AUTH_ERROR');

const handleJWTExpiredError = () => new AppError('Your token has expired! Please login again.', 401, 'AUTH_EXPIRED');

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') return new AppError('File is too large! Check max limits.', 400, 'FILE_TOO_LARGE');
  return new AppError('File upload error', 400, 'UPLOAD_ERROR');
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || 'INTERNAL_ERROR';

  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  error.isOperational = err.isOperational;
  error.module = err.module || 'General';

  // Map Engine-specific Errors to AppErrors
  if (err.name === 'SequelizeUniqueConstraintError' || 
      err.name === 'SequelizeValidationError' || 
      err.name === 'SequelizeForeignKeyConstraintError' || 
      err.name === 'SequelizeConnectionError') {
    error = handleSequelizeError(err);
  }
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.constructor.name === 'MulterError') error = handleMulterError(err);

  // Unified Error Logging
  logger.error(`${error.errorCode} | ${req.method} ${req.originalUrl} | Status: ${error.statusCode} | ReqID: ${req.id}`, {
    requestId: req.id,
    userId: req.user ? req.user.id : 'anonymous',
    endpoint: req.originalUrl,
    method: req.method,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    message: error.message,
    module: error.module,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};
