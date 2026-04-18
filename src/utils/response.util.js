/**
 * Hospital API Standardized Response Utility
 * 
 * Enforces a rigorous, deterministic response structure for all clinical, 
 * financial, and administrative API endpoints.
 */

/**
 * Internal helper to sanitize response objects by removing 
 * undefined or null fields for schema cleanliness.
 */
const _clean = (obj) => JSON.parse(JSON.stringify(obj, (key, value) => (value === null || value === undefined ? undefined : value)));

/**
 * Internal helper to set performance and tracking headers
 */
const _setHeaders = (req, res, statusCode) => {
  if (req.startTime) {
    const duration = Date.now() - req.startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
  }
  return res.status(statusCode);
};

/**
 * @description Standard success response (200 OK)
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
  const response = _clean({
    success: true,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
      ...meta
    }
  });

  return _setHeaders(res.req, res, statusCode).json(response);
};

/**
 * @description Resource created response (201 Created)
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * @description Accepted response for asynchronous/queued tasks (202 Accepted)
 */
const sendAccepted = (res, data, message = 'Request accepted and queued for processing') => {
  return sendSuccess(res, data, message, 202);
};

/**
 * @description Empty response (204 No Content)
 */
const sendNoContent = (res) => {
  return _setHeaders(res.req, res, 204).send();
};

/**
 * @description Standardized error response with diagnostic details
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errorCode = 'ERROR_GENERIC', details = []) => {
  const response = _clean({
    success: false,
    statusCode,
    errorCode,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId,
    // Development diagnostics
    _stack: process.env.NODE_ENV === 'development' ? new Error().stack.split('\n')[2].trim() : undefined
  });

  return _setHeaders(res.req, res, statusCode).json(response);
};

/**
 * @description Response tailored for paginated recordsets
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Records retrieved successfully') => {
  return sendSuccess(res, data, message, 200, { pagination });
};

/**
 * @description Stream file buffer to client with appropriate metadata headers
 */
const sendFileResponse = (res, fileBuffer, filename, mimeType) => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-File-Type', mimeType);
  
  return _setHeaders(res.req, res, 200).send(fileBuffer);
};

/**
 * @description Logic to compute pagination metadata from raw counts
 */
const createPaginationMeta = (page, limit, totalItems) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null
  };
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendAccepted,
  sendNoContent,
  sendError,
  sendPaginatedResponse,
  sendFileResponse,
  createPaginationMeta
};
