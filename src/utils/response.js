/**
 * Common response utility for Koa.js
 */

/**
 * Send a success response
 * @param {Object} ctx - Koa context
 * @param {any} data - Data to send in response
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 */
const successResponse = (ctx, data = null, message = "Success", status = 200) => {
    ctx.status = status;
    ctx.body = {
        success: true,
        message,
        data
    };
};

/**
 * Send an error response
 * @param {Object} ctx - Koa context
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {any} error - Detailed error if any
 */
const errorResponse = (ctx, message = "Internal Server Error", status = 500, error = null, details = null) => {
    ctx.status = status;
    ctx.body = {
        success: false,
        message,
        ...(error && { error: typeof error === 'string' ? error : error.message || error }),
        ...(details && details.length ? { details } : {})
    };
};

module.exports = {
    successResponse,
    errorResponse
};
