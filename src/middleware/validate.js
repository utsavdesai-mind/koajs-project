const { errorResponse } = require("../utils/response");

/**
 * Middleware to validate request body using Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} - Koa middleware function
 */
const validate = (schema) => {
    return async (ctx, next) => {
        const { error, value } = schema.validate(ctx.request.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove fields not defined in the schema
        });

        if (error) {
            const errorMessage = error.details[0].message;
            return errorResponse(ctx, errorMessage, 400);
        }

        ctx.request.body = value;
        await next();
    };
};

module.exports = validate;
