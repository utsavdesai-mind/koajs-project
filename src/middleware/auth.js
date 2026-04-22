const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");

module.exports = async (ctx, next) => {
  try {
    const authHeader = ctx.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const cookieToken = ctx.cookies.get("token");
    const token = bearerToken || cookieToken;

    if (!token) {
      return errorResponse(ctx, "Access denied. No token provided.", 401);
    }

    const decoded = verifyToken(token);
    
    // Attach user info to context
    ctx.state.user = decoded;
    
    await next();
  } catch (error) {
    errorResponse(ctx, "Invalid or expired token", 401, error.message);
  }
};

