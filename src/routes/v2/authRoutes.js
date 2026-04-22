const Router = require("@koa/router");
const authController = require("../../controllers/v2/authController");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const upload = require("../../middleware/upload");
const {
  registerSchema,
  loginSchema,
} = require("../../validations/authValidation");

// Group v2 authentication routes under /auth.
const router = new Router({
  prefix: "/auth",
});

// Accept an optional profile picture during signup, then validate the rest of the form.
router.post("/register", upload.single("profilePicture"), validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", auth, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
