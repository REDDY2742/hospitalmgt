const { Op } = require('sequelize');

/**
 * Hospital API Pagination & Search Logic Utility
 * 
 * Standardizes result-set windowing and full-text search across 
 * clinical and administrative list endpoints.
 */

/**
 * @description Extracts and normalizes pagination/sort params from express req.query
 */
const extractPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const search = (query.search || '').trim().slice(0, 100);

  return { page, limit, offset, sortBy, sortOrder, search };
};

/**
 * @description Builds Sequelize query configurations from extracted params
 */
const buildSequelizeQueryOptions = (params, allowedSortFields = []) => {
  const { limit, offset, sortBy, sortOrder } = params;
  
  // Whitelist-based sort guard against SQL injection
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  
  return {
    limit,
    offset,
    order: [[finalSortBy, sortOrder]],
    distinct: true // Useful for count reliability with associations
  };
};

/**
 * @description Constructs OR-based LIKE conditions for full-text search
 */
const buildSearchCondition = (search, searchFields = []) => {
  if (!search || searchFields.length === 0) return {};
  
  return {
    [Op.or]: searchFields.map(field => ({
      [field]: { [Op.like]: `%${search}%` }
    }))
  };
};

/**
 * @description Formats time-serialized data for API response consumption
 */
const buildPaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null
  };
};

/**
 * @description Type-safe filter extraction and casting
 */
const extractFilters = (query, allowedFilters = []) => {
  const filters = {};
  
  allowedFilters.forEach(({ key, type, enumValues }) => {
    let value = query[key];
    if (value === undefined) return;

    if (type === 'boolean') {
      filters[key] = value === 'true';
    } else if (type === 'number') {
      filters[key] = parseInt(value);
    } else if (type === 'enum' && enumValues) {
      if (enumValues.includes(value)) filters[key] = value;
    } else {
      filters[key] = value;
    }
  });

  return filters;
};

module.exports = {
  extractPaginationParams,
  buildSequelizeQueryOptions,
  buildSearchCondition,
  buildPaginationMeta,
  extractFilters,
  formatListResponse: (rows, count, params) => ({
    items: rows,
    pagination: buildPaginationMeta(params.page, params.limit, count)
  }),
  buildDateRangeCondition: (startDate, endDate, dateField = 'createdAt') => {
    if (!startDate || !endDate) return {};
    return {
      [dateField]: { [Op.between]: [new Date(startDate), new Date(endDate)] }
    };
  }
};
