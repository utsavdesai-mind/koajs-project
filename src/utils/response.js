/**
 * Common response utility for Koa.js
 */

// Build a compact metadata object that carries only the useful response details.
const createMetadata = (status, message, extra = {}) => ({
    status,
    message,
    ...extra
});

/**
 * Send a success response
 * @param {Object} ctx - Koa context
 * @param {any} data - Data to send in response
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 * @param {Object|null} metadata - Extra metadata to attach
 */
const successResponse = (ctx, data = null, message = "Success", status = 200, metadata = null) => {
    ctx.status = status;
    ctx.body = {
        success: true,
        data,
        metadata: createMetadata(status, message, metadata || {})
    };
};

/**
 * Send an error response
 * @param {Object} ctx - Koa context
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {any} error - Detailed error if any
 */
const errorResponse = (ctx, message = "Internal Server Error", status = 500, error = null) => {
    // Keep the public error payload minimal and consistent across the app.
    ctx.status = status;
    ctx.body = {
        status,
        message
    };
};

module.exports = {
    successResponse,
    errorResponse
};
