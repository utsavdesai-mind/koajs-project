/**
 * Common response utility for Koa.js
 */

const createMetadata = (status, extra = {}) => ({
    statusCode: status,
    timestamp: new Date().toISOString(),
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
        message,
        data,
        metadata: createMetadata(status, metadata || {})
    };
};

/**
 * Send an error response
 * @param {Object} ctx - Koa context
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {any} error - Detailed error if any
 * @param {Array|null} details - Validation or field-level errors
 * @param {Object|null} metadata - Extra metadata to attach
 */
const errorResponse = (
    ctx,
    message = "Internal Server Error",
    status = 500,
    error = null,
    details = null,
    metadata = null
) => {
    const errorMetadata = { ...(metadata || {}) };

    if (error) {
        errorMetadata.error = typeof error === "string" ? error : error.message || error;
    }

    if (details && details.length) {
        errorMetadata.details = details;
    }

    ctx.status = status;
    ctx.body = {
        success: false,
        message,
        data: null,
        metadata: createMetadata(status, errorMetadata)
    };
};

module.exports = {
    successResponse,
    errorResponse
};
