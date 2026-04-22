const Router = require("@koa/router");
const authController = require("../../controllers/v2/authController");
const validate = require("../../middleware/validate");
const upload = require("../../middleware/upload");
const {
  registerSchema,
  loginSchema,
} = require("../../validations/authValidation");

const router = new Router({
  prefix: "/auth",
});

router.post("/register", upload.single("profilePicture"), validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
