/**
 * Hospital Management System - Enterprise Error Management Infrastructure
 * 
 * Provides a structured, HIPAA-compliant error hierarchy for all clinical,
 * financial, and systemic operations.
 * 
 * Design: All institutional errors extend AppError, distinguishing between 
 * Operational (expected) and Programming (bugs) events.
 */

// --- 1. BASE ERROR CLASS ---

class AppError extends Error {
  /**
   * @param {string} message - User-facing safe message
   * @param {number} statusCode - HTTP Status code (e.g. 404)
   * @param {string} errorCode - Machine-readable identifier (e.g. 'PATIENT_NOT_FOUND')
   * @param {Object} [options] - Additional context
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', options = {}) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = options.isOperational ?? (statusCode < 500);
    this.status = statusCode >= 500 ? 'error' : 'fail';
    
    this.details = options.details || null;
    this.field = options.field || null;
    this.timestamp = new Date();
    this.requestId = options.requestId || null;
    this.originalError = options.originalError || null;
    this.module = options.module || null;
    this.action = options.action || null;
    this.documentation = options.documentation || null;
    this.retryable = options.retryable ?? false;
    this.retryAfter = options.retryAfter || null;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * @description Serializes error for API response
   * @param {string} env - 'development' | 'production'
   */
  toJSON(env = process.env.NODE_ENV) {
    const isProd = env === 'production';
    
    return {
      success: false,
      status: this.status,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: (!this.isOperational && isProd) ? 'An unexpected error occurred' : this.message,
      details: this.details,
      field: this.field,
      timestamp: this.timestamp,
      requestId: this.requestId,
      ...(isProd ? {} : { stack: this.stack, module: this.module, action: this.action })
    };
  }

  toLog() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      isOperational: this.isOperational,
      module: this.module,
      action: this.action,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack,
      originalError: this.originalError
    };
  }

  withRequestId(id) { this.requestId = id; return this; }
  withModule(mod) { this.module = mod; return this; }
  withAction(act) { this.action = act; return this; }
}

// --- 2. HTTP STATUS CLASSES ---

class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters', errorCode = 'BAD_REQUEST', options = {}) {
    super(message, 400, errorCode, options);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'UNAUTHORIZED', options = {}) {
    super(message, 401, errorCode, { ...options, retryable: true });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', errorCode = 'FORBIDDEN', options = {}) {
    super(message, 403, errorCode, options);
  }
}

class NotFoundError extends AppError {
  constructor(resource, identifier, options = {}) {
    const message = identifier ? `${resource} with identifier [${identifier}] not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', options);
  }
}

class ConflictError extends AppError {
  constructor(message, errorCode = 'CONFLICT', options = {}) {
    super(message, 409, errorCode, options);
  }
}

class GoneError extends AppError {
  constructor(message, errorCode = 'GONE', options = {}) {
    super(message, 410, errorCode, options);
  }
}

class UnprocessableError extends AppError {
  constructor(message, errorCode = 'UNPROCESSABLE_ENTITY', options = {}) {
    super(message, 422, errorCode, options);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded', options = {}) {
    super(message, 429, 'TOO_MANY_REQUESTS', { ...options, retryable: true });
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server malfunction', options = {}) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', { ...options, isOperational: false });
  }
}

class BadGatewayError extends AppError {
  constructor(message = 'External service failure', options = {}) {
    super(message, 502, 'BAD_GATEWAY', options);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily down', options = {}) {
    super(message, 503, 'SERVICE_UNAVAILABLE', { ...options, retryable: true });
  }
}

// --- 3. VALIDATION ERROR ---

class ValidationError extends AppError {
  constructor(errors, message = 'Validation failed', options = {}) {
    super(message, 422, 'VALIDATION_ERROR', { ...options, details: { validationErrors: errors } });
    this.validationErrors = errors;
  }

  static fromJoi(joiError) {
    const errors = joiError.details.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.context?.value,
      type: err.type
    }));
    return new ValidationError(errors);
  }
}

// --- 4. AUTH & SECURITY ERRORS ---

class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Your session has expired. Please log in again', 'TOKEN_EXPIRED');
  }
}

class AccountLockedError extends UnauthorizedError {
  constructor(lockedUntil) {
    super('Account temporarily locked due to failed attempts', 'ACCOUNT_LOCKED', { details: { lockedUntil } });
  }
}

// --- 5. DOMAIN ERRORS (ALPHABETICAL) ---

/** @section Appointment */
class SlotNotAvailableError extends ConflictError {
  constructor(slot) {
    super('Requested time slot is no longer available', 'SLOT_NOT_AVAILABLE', { details: { slot }, retryable: true });
  }
}

/** @section Bed/Ward */
class WardAtCapacityError extends ConflictError {
  constructor(wardName) {
    super(`The [${wardName}] ward is currently at full capacity`, 'WARD_AT_CAPACITY');
  }
}

/** @section Billing */
class RefundExceedsPaymentError extends UnprocessableError {
  constructor(paid, requested) {
    super(`Refund [${requested}] exceeds original payment [${paid}]`, 'REFUND_EXCEEDS_PAYMENT');
  }
}

/** @section Pharmacy */
class DrugInteractionError extends UnprocessableError {
  constructor(interactions) {
    super('Potential drug interaction detected between prescribed medicines', 'DRUG_INTERACTION_DETECTED', { details: { interactions } });
  }
}

/** @section Storage */
class FileTooLargeError extends BadRequestError {
  constructor(maxSize) {
    super(`File size exceeds allowed limit of ${maxSize}MB`, 'FILE_TOO_LARGE');
  }
}

// --- 6. TRANSFORMERS ---

const fromSequelizeError = (err) => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return new ConflictError('A record with this unique attribute already exists', 'DUPLICATE_KEY_ERROR');
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new ConflictError('Cannot delete record because it is referenced elsewhere', 'FOREIGN_KEY_CONSTRAINT');
  }
  return new InternalServerError('Database operation failed');
};

// --- 7. ASSERTIONS ---

const assert = (condition, error) => {
  if (!condition) throw error;
};

const assertFound = (value, resource, id) => {
  if (!value) throw new NotFoundError(resource, id);
};

const assertOwnership = (resource, userId, field = 'userId') => {
  if (resource[field] !== userId) throw new ForbiddenError('You do not own this resource');
};

// --- 9. FACTORIES ---

const createError = (statusCode, message, errorCode, options) => {
  switch (statusCode) {
    case 400: return new BadRequestError(message, errorCode, options);
    case 401: return new UnauthorizedError(message, errorCode, options);
    case 403: return new ForbiddenError(message, errorCode, options);
    case 404: return new NotFoundError(message, errorCode, options);
    case 409: return new ConflictError(message, errorCode, options);
    case 422: return new UnprocessableError(message, errorCode, options);
    default: return new InternalServerError(message, options);
  }
};

const notFound = (resource, id) => new NotFoundError(resource, id);
const badRequest = (msg, code) => new BadRequestError(msg, code);
const internal = (msg, err) => new InternalServerError(msg, { originalError: err });

// --- 10. CONSTANTS ---

const ERROR_CODES = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  SLOT_NOT_AVAILABLE: 'SLOT_NOT_AVAILABLE',
  BILL_ALREADY_PAID: 'BILL_ALREADY_PAID',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  GoneError,
  UnprocessableError,
  TooManyRequestsError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  ValidationError,
  TokenExpiredError,
  AccountLockedError,
  SlotNotAvailableError,
  WardAtCapacityError,
  RefundExceedsPaymentError,
  DrugInteractionError,
  FileTooLargeError,
  fromSequelizeError,
  assert,
  assertFound,
  assertOwnership,
  catchAsync,
  handleGlobalError,
  createError,
  notFound,
  badRequest,
  internal,
  ERROR_CODES,
  HTTP_STATUS
};
