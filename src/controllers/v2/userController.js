const fs = require("fs");
const path = require("path");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/response");

const buildMeta = (ctx) => ({
  version: ctx.state.apiVersion || "v2",
  timestamp: new Date().toISOString(),
});

exports.getUserById = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id).select("-password");

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    successResponse(
      ctx,
      {
        user,
      },
      "User fetched successfully",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    errorResponse(ctx, "Invalid User ID format", 400, error);
  }
};

exports.updateUser = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    Object.assign(user, ctx.request.body);
    await user.save();

    successResponse(
      ctx,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          profilePicture: user.profilePicture,
          updatedAt: user.updatedAt,
        },
      },
      "User updated successfully",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    errorResponse(ctx, "Update failed", 400, error);
  }
};

exports.deleteUser = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    if (user.profilePicture) {
      const filePath = path.join(__dirname, "../../../", user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await User.findByIdAndDelete(ctx.params.id);

    successResponse(
      ctx,
      {
        deleted: true,
      },
      "Account deleted successfully",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    errorResponse(ctx, "Delete failed", 400, error);
  }
};

exports.uploadProfilePicture = async (ctx) => {
  try {
    if (!ctx.file) {
      return errorResponse(ctx, "Please upload an image", 400);
    }

    const userId = ctx.params.id || ctx.state.user.id;
    const user = await User.findById(userId);

    if (!user) {
      fs.unlinkSync(ctx.file.path);
      return errorResponse(ctx, "User not found", 404);
    }

    if (user.profilePicture) {
      const oldPath = path.join(__dirname, "../../../", user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = `uploads/${ctx.file.filename}`;
    await user.save();

    successResponse(
      ctx,
      {
        image: {
          path: user.profilePicture,
          url: `${ctx.origin}/${user.profilePicture}`,
        },
      },
      "Profile picture uploaded successfully",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    if (ctx.file) {
      fs.unlinkSync(ctx.file.path);
    }
    errorResponse(ctx, "Upload failed", 500, error);
  }
};

exports.deleteProfilePicture = async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    if (!user.profilePicture) {
      return errorResponse(ctx, "No profile picture found to delete", 400);
    }

    const filePath = path.join(__dirname, "../../../", user.profilePicture);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    user.profilePicture = "";
    await user.save();

    successResponse(
      ctx,
      {
        deleted: true,
      },
      "Profile picture deleted successfully",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    errorResponse(ctx, "Delete profile picture failed", 500, error);
  }
};
