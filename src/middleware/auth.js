const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");

module.exports = async (ctx, next) => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(ctx, "Access denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    
    // Attach user info to context
    ctx.state.user = decoded;
    
    await next();
  } catch (error) {
    errorResponse(ctx, "Invalid or expired token", 401, error.message);
  }
};

