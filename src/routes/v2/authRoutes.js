const Router = require("@koa/router");
const authController = require("../../controllers/v2/authController");
const validate = require("../../middleware/validate");
const {
  registerSchema,
  loginSchema,
} = require("../../validations/authValidation");

const router = new Router({
  prefix: "/auth",
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
