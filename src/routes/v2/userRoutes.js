const Router = require("@koa/router");
const userController = require("../../controllers/v2/userController");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const upload = require("../../middleware/upload");
const { updateUserSchema } = require("../../validations/userValidation");

// Group v2 user endpoints under /users.
const router = new Router({
  prefix: "/users",
});

// Require authentication for all v2 user routes.
router.use(auth);

// Support profile read, update, delete, and image-management actions.
router.get("/:id", userController.getUserById);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.post(
  "/upload-profile",
  upload.single("image"),
  userController.uploadProfilePicture
);
router.delete("/profile/image", userController.deleteProfilePicture);

module.exports = router;
