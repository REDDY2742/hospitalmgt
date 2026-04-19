const { Op, fn, col } = require('sequelize');
const logger = require('./logger.util').createChildLogger('pagination-util');

/**
 * Hospital Management System - High-Performance Pagination & Query Engine
 * 
 * Provides production-grade orchestration for dynamic Sequelize queries.
 * Features: Offset/Cursor pagination, complex whitelisted filtering, 
 * global search across clinical entities, and HATEOAS metadata.
 */

// --- Base Pagination Logic ---

/**
 * @description Extracts and sanitizes pagination parameters from request query
 * @param {Object} query - req.query object
 * @returns {{page: number, limit: number, offset: number}}
 */
const getPagination = (query) => {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;

  const page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Sanitize bounds
  const sanitizedPage = Math.max(1, page);
  const sanitizedLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

  const offset = (sanitizedPage - 1) * sanitizedLimit;

  return { page: sanitizedPage, limit: sanitizedLimit, offset };
};

/**
 * @description Generates clinical-grade pagination metadata for API responses
 */
const getPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  return {
    totalCount,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    from: totalCount === 0 ? 0 : offset + 1,
    to: Math.min(offset + limit, totalCount),
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
    isEmpty: totalCount === 0
  };
};

// --- Filter Builder ---

/**
 * @description Builds Sequelize where clause based on whitelisted filters
 */
const buildFilters = (query, allowedFilters = {}) => {
  const where = {};

  Object.keys(query).forEach(key => {
    // Only process whitelisted keys
    if (!allowedFilters[key]) return;

    const value = query[key];
    const config = allowedFilters[key];

    // Simple EXACT match or specialized operators
    switch (config.type) {
      case 'string':
        if (config.operator === 'iLike') {
          where[key] = { [Op.like]: `%${value}%` };
        } else {
          where[key] = value;
        }
        break;

      case 'number':
        where[key] = parseFloat(value);
        break;

      case 'boolean':
        where[key] = value === 'true';
        break;

      case 'enum':
        if (config.values.includes(value)) where[key] = value;
        break;

      case 'array':
        const vals = Array.isArray(value) ? value : [value];
        where[key] = { [Op.in]: vals };
        break;

      case 'dateRange':
        const { startDate, endDate } = query;
        if (startDate && endDate) {
          where[key] = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }
        break;

      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) where[key] = value;
        break;

      default:
        where[key] = value;
    }
  });

  return where;
};

// --- Search Builder ---

/**
 * @description Global search across multiple clinical or administrative fields
 */
const buildSearch = (searchTerm, searchFields = []) => {
  if (!searchTerm || searchTerm.length < 2 || searchFields.length === 0) return {};

  const sanitizedTerm = searchTerm.replace(/[%_\\]/g, '\\$&');
  const orArray = searchFields.map(field => ({
    [field]: { [Op.like]: `%${sanitizedTerm}%` }
  }));

  return { [Op.or]: orArray };
};

// --- Sort Builder ---

/**
 * @description Validates and builds Sequelize order array
 * @example sort=createdAt:desc,name:asc -> [['createdAt', 'DESC'], ['name', 'ASC']]
 */
const buildSort = (sortStr, allowedSortFields = [], defaultSort = [['createdAt', 'DESC']]) => {
  if (!sortStr) return defaultSort;

  const sortParts = sortStr.split(',');
  const order = [];

  sortParts.forEach(part => {
    const [field, direction] = part.split(':');
    if (allowedSortFields.includes(field)) {
      const dir = direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      order.push([field, dir]);
    }
  });

  return order.length > 0 ? order : defaultSort;
};

// --- Master Query Builder ---

/**
 * @description Master orchestrator for dynamic Sequelize query options
 */
const buildSequelizeQuery = (req, options = {}) => {
  const {
    allowedFilters = {},
    allowedSortFields = [],
    searchFields = [],
    defaultSort = [['createdAt', 'DESC']]
  } = options;

  const { page, limit, offset } = getPagination(req.query);
  const filters = buildFilters(req.query, allowedFilters);
  const search = buildSearch(req.query.search, searchFields);
  const order = buildSort(req.query.sort, allowedSortFields, defaultSort);

  // Combine where clauses
  const where = { ...filters, ...search };

  return {
    where,
    order,
    limit,
    offset,
    pagination: { page, limit, offset } // For metadata later
  };
};

/**
 * @description Build grouped aggregation queries for reports
 * @example aggregates: [{field: 'total', function: 'SUM', alias: 'totalRevenue'}]
 */
const buildAggregationQuery = (groupBy = [], aggregates = []) => {
  const attributes = [...groupBy];
  aggregates.forEach(agg => {
    attributes.push([fn(agg.function, col(agg.field)), agg.alias]);
  });
  return { attributes, group: groupBy };
};

/**
 * @description Parse and validate associated includes to prevent N+1 and deep nesting
 */
const buildIncludeQuery = (includeStr, allowedIncludes = []) => {
  if (!includeStr) return [];
  const requested = includeStr.split(',');
  const includes = [];

  requested.forEach(inc => {
    if (allowedIncludes.includes(inc)) {
      includes.push({ association: inc });
    }
  });

  return includes.slice(0, 3); // Max 3 depth limit
};

/**
 * @description Sparse field selection parsing
 */
const buildFieldSelection = (fieldsStr, allowedFields = []) => {
  if (!fieldsStr) return { exclude: [] };
  const requested = fieldsStr.split(',').filter(f => allowedFields.includes(f));
  return requested.length > 0 ? requested : { exclude: [] };
};

/**
 * @description Keyset/Cursor pagination for real-time streams
 */
const buildCursorPagination = (cursorToken, limit = 10, sortField = 'id', sortDirection = 'DESC') => {
  const decoded = decodeCursor(cursorToken);
  const where = {};

  if (decoded && decoded.id) {
    const op = sortDirection === 'DESC' ? Op.lt : Op.gt;
    where[sortField] = { [op]: decoded.sortValue || decoded.id };
  }

  return { where, limit };
};

// --- Middleware ---

/**
 * @description Express middleware factory for automated query parsing
 */
const paginationMiddleware = (options = {}) => {
  return (req, res, next) => {
    try {
      const queryOptions = buildSequelizeQuery(req, options);
      req.dbQuery = queryOptions;
      req.pagination = queryOptions.pagination;
      next();
    } catch (err) {
      logger.error('PAGINATION_MIDDLEWARE_FAILURE', err);
      next(err);
    }
  };
};

// --- Advanced Utilities ---

/**
 * @description base64url encode for cursor-based pagination
 */
const encodeCursor = (data) => Buffer.from(JSON.stringify(data)).toString('base64url');

/**
 * @description base64url decode for cursor-based pagination
 */
const decodeCursor = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch (err) {
    return null;
  }
};

module.exports = {
  getPagination,
  getPaginationMeta,
  buildFilters,
  buildSearch,
  buildSort,
  buildSequelizeQuery,
  paginationMiddleware,
  buildAggregationQuery,
  buildIncludeQuery,
  buildFieldSelection,
  buildCursorPagination,
  encodeCursor,
  decodeCursor
};
