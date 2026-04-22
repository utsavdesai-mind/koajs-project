const Router = require("@koa/router");
const authV1Routes = require("./authRoutes");
const userV1Routes = require("./userRoutes");
const authV2Routes = require("./v2/authRoutes");
const userV2Routes = require("./v2/userRoutes");
const apiVersion = require("../middleware/apiVersion");

// Mount all API versions under one shared /api prefix.
const router = new Router({
  prefix: "/api",
});

// Register v1 auth and user routes.
router.use("/v1", apiVersion("v1"));
router.use("/v1", authV1Routes.routes(), authV1Routes.allowedMethods());
router.use("/v1", userV1Routes.routes(), userV1Routes.allowedMethods());

// Register v2 auth and user routes.
router.use("/v2", apiVersion("v2"));
router.use("/v2", authV2Routes.routes(), authV2Routes.allowedMethods());
router.use("/v2", userV2Routes.routes(), userV2Routes.allowedMethods());

module.exports = router;
