/**
 * Custom Application Error Class
 * 
 * Provides a standardized structure for all errors across the system,
 * enabling precise logging and distinct error responses.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR', isOperational = true, details = null, module = 'General') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    this.module = module;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Not authenticated') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = '') {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', true, details, 'Database');
  }
}

class S3UploadError extends AppError {
  constructor(message = 'File storage failed', details = null) {
    super(message, 500, 'STORAGE_ERROR', true, details, 'S3');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service failure') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, { service }, service);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  S3UploadError,
  ExternalServiceError
};
