// Save the active API version in the request state and response headers.
module.exports = (version) => {
  return async (ctx, next) => {
    ctx.state.apiVersion = version;
    ctx.set("X-API-Version", version);
    await next();
  };
};
