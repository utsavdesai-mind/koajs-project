const Router = require("@koa/router");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const { updateUserSchema } = require("../validations/userValidation");

const router = new Router({
  prefix: "/users",
});

// Protect all user routes
router.use(auth);

router.get("/:id", userController.getUserById);
router.put("/:id", validate(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.post("/upload-profile", upload.single("image"), userController.uploadProfilePicture);
router.delete("/profile/image", userController.deleteProfilePicture);

module.exports = router;