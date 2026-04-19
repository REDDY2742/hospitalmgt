const { nanoid } = require('nanoid');
const logger = require('./logger.util').createChildLogger('response-util');

/**
 * Hospital Management System - Enterprise API Response Utility
 * 
 * Provides a standardized, clinical-grade response envelope for all REST interactions.
 * Features automated HATEOAS link generation, Joi/Sequelize error translation, 
 * and environment-aware data sanitization.
 */

// --- Base Response Factory ---

/**
 * @private
 * @description Generates the standard JSON envelope for all responses
 */
const createEnvelope = (req, res, options = {}) => {
  const {
    success = true,
    statusCode = 200,
    message = '',
    data = null,
    errors = null,
    warnings = null,
    meta = {},
    links = null
  } = options;

  const processingTime = req.startTime ? `${Date.now() - req.startTime}ms` : '0ms';

  // Standard API Envelope
  const envelope = {
    success,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id || 'N/A',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      processingTime,
      ...meta
    },
    errors,
    warnings,
    links
  };

  // Response Time Guard: Log performance anomalies in clinical systems
  const timeMs = parseInt(processingTime);
  if (timeMs > 1000) {
    logger.warn(`PERFORMANCE_DEGRADATION: API responded in ${processingTime} | ${req.method} ${req.originalUrl}`);
  }

  // Set Custom Headers
  res.set('X-Request-ID', req.id);
  res.set('X-Response-Time', processingTime);
  res.set('Content-Type', 'application/json');

  // Sanitize in Production: Remove Nulls/Empty fields to save bandwidth
  if (process.env.NODE_ENV === 'production') {
    Object.keys(envelope).forEach(key => (envelope[key] === null) && delete envelope[key]);
  }

  return envelope;
};

// --- Pagination & HATEOAS Helpers ---

/**
 * @description Build HATEOAS navigation links
 */
const buildLinks = (req, page, limit, totalPages) => {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
  const getUrl = (p) => `${baseUrl}?page=${p}&limit=${limit}`;

  return {
    self: getUrl(page),
    first: getUrl(1),
    last: getUrl(totalPages),
    next: page < totalPages ? getUrl(page + 1) : null,
    prev: page > 1 ? getUrl(page - 1) : null
  };
};

// --- Success Methods ---

const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200, meta = {}) => {
  const envelope = createEnvelope(res.req, res, { success: true, statusCode, message, data, meta });
  return res.status(statusCode).json(envelope);
};

const sendCreated = (res, data, message = 'Resource created successfully', resourceUrl = null) => {
  if (resourceUrl) res.set('Location', resourceUrl);
  return sendSuccess(res, data, message, 201);
};

const sendUpdated = (res, data, message = 'Resource updated successfully') => {
  return sendSuccess(res, data, message, 200);
};

const sendDeleted = (res, message = 'Resource deleted successfully') => {
  return sendSuccess(res, null, message, 200);
};

const sendList = (res, data, pagination = {}, message = 'Data retrieved successfully') => {
  const { page = 1, limit = 10, totalCount = 0 } = pagination;
  const totalPages = Math.ceil(totalCount / (limit || 10));
  
  const links = buildLinks(res.req, page, limit, totalPages);
  const meta = {
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalCount: Number(totalCount),
      limit: Number(limit),
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };

  const envelope = createEnvelope(res.req, res, { 
    success: true, 
    statusCode: 200, 
    message, 
    data, 
    meta,
    links 
  });
  return res.status(200).json(envelope);
};

const sendNoContent = (res) => res.status(204).send();

const sendAccepted = (res, message = 'Request accepted for processing', jobId, statusUrl) => {
  return sendSuccess(res, { jobId, statusUrl }, message, 202);
};

// --- Error Methods ---

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null, code = null) => {
  // Sanitize Error details for production
  const sanitizedMessage = (process.env.NODE_ENV === 'production' && statusCode === 500) 
    ? 'A system error occurred. Our engineering team has been notified.' 
    : message;

  const envelope = createEnvelope(res.req, res, { 
    success: false, 
    statusCode, 
    message: sanitizedMessage, 
    errors,
    meta: { errorCode: code }
  });
  return res.status(statusCode).json(envelope);
};

const sendBadRequest = (res, message = 'Bad Request', errors = null, code = 'BAD_REQUEST') => {
  return sendError(res, message, 400, errors, code);
};

const sendConflict = (res, message = 'Data conflict occurred', resource = '') => {
  return sendError(res, message, 409, null, 'CONFLICT');
};

const sendUnprocessable = (res, message = 'Unprocessable Entity', errors = null) => {
  return sendError(res, message, 422, errors, 'UNPROCESSABLE_ENTITY');
};

const sendTooManyRequests = (res, retryAfter = 60) => {
  res.set('Retry-After', String(retryAfter));
  return sendError(res, 'Too many requests. Please try again later.', 429, null, 'RATE_LIMIT_EXCEEDED');
};

const sendServiceUnavailable = (res, message = 'Service Temporarily Unavailable', retryAfter = 60) => {
  if (retryAfter) res.set('Retry-After', String(retryAfter));
  return sendError(res, message, 503, null, 'SERVICE_UNAVAILABLE');
};

const sendNotFound = (res, resource = 'Resource', id = '') => {
  const message = id ? `${resource} with identifier ${id} not found` : `${resource} not found`;
  return sendError(res, message, 404);
};

const sendValidationError = (res, joiError) => {
  const errors = joiError.details.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.context.value,
    type: err.type
  }));
  return sendError(res, 'Validation failed: Invalid input provided.', 422, errors);
};

const sendSequelizeError = (res, err) => {
  let statusCode = 500;
  let message = 'Database operation failed.';
  let errors = null;

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Data conflict: Record already exists.';
    errors = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 422;
    message = 'Validation failed: Database constraints violated.';
    errors = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 409;
    message = 'Integrity violation: Referenced record does not exist.';
  }

  return sendError(res, message, statusCode, errors);
};

// --- Special Response Types ---

const sendFileDownload = (res, fileBuffer, filename, mimeType = 'application/octet-stream') => {
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.set('Content-Type', mimeType);
  return res.send(fileBuffer);
};

const sendHealthCheck = (res, checks) => {
  const isHealthy = checks.every(c => c.status === 'healthy');
  const statusCode = isHealthy ? 200 : 503;
  return sendSuccess(res, { overallStatus: isHealthy ? 'healthy' : 'degraded', checks }, 'System Health Status', statusCode);
};

const sendBulkOperationResult = (res, results) => {
  return sendSuccess(res, results, 'Bulk operation completed', 200);
};

// --- Response Middleware ---

/**
 * @description Express middleware to attach response helpers to the 'res' object
 */
const attachResponseHelpers = (req, res, next) => {
  req.id = req.get('X-Request-ID') || nanoid();
  req.startTime = Date.now();

  // Attach Success Methods
  res.sendSuccess = (data, message, statusCode, meta) => sendSuccess(res, data, message, statusCode, meta);
  res.sendCreated = (data, message, url) => sendCreated(res, data, message, url);
  res.sendUpdated = (data, message) => sendUpdated(res, data, message);
  res.sendDeleted = (message) => sendDeleted(res, message);
  res.sendList = (data, pagination, message) => sendList(res, data, pagination, message);
  res.sendNoContent = () => sendNoContent(res);
  res.sendAccepted = (msg, id, url) => sendAccepted(res, msg, id, url);

  // Attach Error Methods
  res.sendError = (msg, status, errs, code) => sendError(res, msg, status, errs, code);
  res.sendBadRequest = (msg, errs, code) => sendBadRequest(res, msg, errs, code);
  res.sendNotFound = (resrc, id) => sendNotFound(res, resrc, id);
  res.sendConflict = (msg, resrc) => sendConflict(res, msg, resrc);
  res.sendUnprocessable = (msg, errs) => sendUnprocessable(res, msg, errs);
  res.sendTooManyRequests = (retry) => sendTooManyRequests(res, retry);
  res.sendServiceUnavailable = (msg, retry) => sendServiceUnavailable(res, msg, retry);
  res.sendValidationError = (joiErr) => sendValidationError(res, joiErr);
  res.sendSequelizeError = (seqErr) => sendSequelizeError(res, seqErr);
  res.sendForbidden = (msg) => sendError(res, msg || 'Insufficient permissions.', 403, null, 'FORBIDDEN');
  res.sendUnauthorized = (msg) => sendError(res, msg || 'Authentication required.', 401, null, 'UNAUTHORIZED');
  
  // Special
  res.sendBulk = (results) => sendBulkOperationResult(res, results);
  res.sendDownload = (buf, name, mime) => sendFileDownload(res, buf, name, mime);

  next();
};

const ResponseUtil = {
  createEnvelope,
  sendSuccess,
  sendCreated,
  sendList,
  sendNoContent,
  sendAccepted,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendValidationError,
  sendSequelizeError,
  attachResponseHelpers
};

module.exports = ResponseUtil;
module.exports.attachResponseHelpers = attachResponseHelpers;
module.exports.sendSuccess = sendSuccess;
module.exports.sendCreated = sendCreated;
module.exports.sendError = sendError;
module.exports.sendNotFound = sendNotFound;
