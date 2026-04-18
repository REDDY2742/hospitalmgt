const logger = require('../utils/logger.util');

/**
 * Universal Validation Middleware Factory
 * 
 * Validates request body, query, and params against Joi schemas.
 * Supports individual or combined validation targets.
 */

const validate = (schemaObj) => {
  return async (req, res, next) => {
    // Determine targets (body, query, params)
    const targets = ['body', 'query', 'params'];
    const errors = [];

    for (const target of targets) {
      if (schemaObj[target]) {
        const { error, value } = schemaObj[target].validate(req[target], {
          abortEarly: false, // Return all errors
          stripUnknown: true, // Prevent mass assignment attacks
          allowUnknown: false
        });

        if (error) {
          const detail = error.details.map(err => ({
            field: err.path.join('.'),
            message: err.message.replace(/"/g, ''),
            value: err.context.value
          }));
          errors.push(...detail);
        } else {
          // Replace raw input with sanitized/validated values from Joi
          req[target] = value;
        }
      }
    }

    // Handle Validation Failures
    if (errors.length > 0) {
      logger.warn(`Validation Failure | Path: ${req.originalUrl} | Errors: ${errors.length}`, {
        endpoint: req.originalUrl,
        userId: req.user ? req.user.id : 'anonymous',
        errorCount: errors.length,
        fields: errors.map(e => e.field)
      });

      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        errors
      });
    }

    next();
  };
};

/**
 * Legacy Support for single target validation: validate(schema, 'body')
 */
const validateTarget = (schema, target = 'body') => {
  return validate({ [target]: schema });
};

module.exports = {
  validate,
  validateTarget
};
