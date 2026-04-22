const fs = require("fs");
const { errorResponse } = require("../utils/response");

/**
 * Middleware to validate request body using Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} - Koa middleware function
 */
const validate = (schema) => {
    return async (ctx, next) => {
        // Validate and sanitize the incoming request body with Joi.
        const { error, value } = schema.validate(ctx.request.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove fields not defined in the schema
        });

        if (error) {
            // Remove any uploaded file if validation fails after the file was saved.
            if (ctx.file && ctx.file.path && fs.existsSync(ctx.file.path)) {
                fs.unlinkSync(ctx.file.path);
            }

            // Convert Joi validation details into a frontend-friendly format.
            const errorMessage = error.details[0].message;
            const details = error.details.map((detail) => ({
                field: detail.path[0],
                message: detail.message.replace(/"/g, "")
            }));

            return errorResponse(ctx, errorMessage.replace(/"/g, ""), 400, null, details);
        }

        // Replace the request body with the cleaned Joi output.
        ctx.request.body = value;
        await next();
    };
};

module.exports = validate;
