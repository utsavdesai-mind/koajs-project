const Router = require("@koa/router");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validations/authValidation");

// Group authentication endpoints under /auth.
const router = new Router({
    prefix: "/auth",
});

// Validate request bodies before passing them to the controller.
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;