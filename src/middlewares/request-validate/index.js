const validator = require('validator');

const logger = require('../../libraries/log/logger');

function validateRequest({ schema, isParam = false, isQuery = false }) {
  return (req, res, next) => {
    const input = isParam ? req.params : isQuery ? req.query : req.body;

    // Sanitize inputs
    for (let key in input) {
      if (typeof input[key] === 'string') {
        input[key] = validator.escape(input[key]);
      }
    }

    const validationResult = schema.validate(input, { abortEarly: false });

    if (validationResult.error) {
      logger.error(`${req.method} ${req.originalUrl} Validation failed`, {
        errors: validationResult.error.details.map((detail) => detail.message),
      });
      // Handle validation error
      return res.status(400).json({
        errors: validationResult.error.details.map((detail) => detail.message),
      });
    }

    // Attach validation result back to the original field
    if (isParam) {
      req.params = validationResult.value;
    } else if (isQuery) {
      req.query = validationResult.value;
    } else {
      req.body = validationResult.value;
    }

    // Validation successful - proceed
    next();
  };
}

module.exports = { validateRequest };
