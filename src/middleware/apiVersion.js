module.exports = (version) => {
  return async (ctx, next) => {
    ctx.state.apiVersion = version;
    ctx.set("X-API-Version", version);
    await next();
  };
};
