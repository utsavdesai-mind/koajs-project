const fs = require("fs");
const path = require("path");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/response");

// Fetch a single user profile without returning the password hash.
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
      200
    );
  } catch (error) {
    errorResponse(ctx, "Invalid User ID format", 400, error);
  }
};

// Update the selected user profile with validated request data.
exports.updateUser = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    // Copy only validated fields onto the loaded user document.
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
      200
    );
  } catch (error) {
    errorResponse(ctx, "Update failed", 400, error);
  }
};

// Delete a user account and clean up the stored profile image file.
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
      null,
      "Account deleted successfully",
      200
    );
  } catch (error) {
    errorResponse(ctx, "Delete failed", 400, error);
  }
};

// Upload a replacement profile picture for the current user.
exports.uploadProfilePicture = async (ctx) => {
  try {
    if (!ctx.file) {
      return errorResponse(ctx, "Please upload an image", 400);
    }

    const userId = ctx.params.id || ctx.state.user.id;
    const user = await User.findById(userId);

    // Delete the newly uploaded file if the user cannot be found.
    if (!user) {
      fs.unlinkSync(ctx.file.path);
      return errorResponse(ctx, "User not found", 404);
    }

    // Remove the previous file so only the latest image remains on disk.
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
      200
    );
  } catch (error) {
    if (ctx.file) {
      fs.unlinkSync(ctx.file.path);
    }
    errorResponse(ctx, "Upload failed", 500, error);
  }
};

// Delete the currently saved profile picture for the authenticated user.
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
      null,
      "Profile picture deleted successfully",
      200
    );
  } catch (error) {
    errorResponse(ctx, "Delete profile picture failed", 500, error);
  }
};
