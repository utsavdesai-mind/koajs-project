// Save the active API version in the request state.
module.exports = (version) => {
  return async (ctx, next) => {
    ctx.state.apiVersion = version;
    await next();
  };
};
