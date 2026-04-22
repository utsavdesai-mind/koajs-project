const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");

// Verify the access token from the Authorization header or auth cookie.
module.exports = async (ctx, next) => {
  try {
    const authHeader = ctx.headers.authorization;
    // Prefer the Bearer token, but fall back to a browser cookie if needed.
    const bearerToken = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const cookieToken = ctx.cookies.get("token");
    const token = bearerToken || cookieToken;

    if (!token) {
      return errorResponse(ctx, "Access denied. No token provided.", 401);
    }

    // Decode the token and expose the payload to later middleware/controllers.
    const decoded = verifyToken(token);
    
    // Save authenticated user data on ctx.state for downstream handlers.
    ctx.state.user = decoded;
    
    await next();
  } catch (error) {
    errorResponse(ctx, "Invalid or expired token", 401, error.message);
  }
};

