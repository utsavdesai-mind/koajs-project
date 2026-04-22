const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");
const fs = require("fs");
const path = require("path");

// Fetch one user profile while excluding the password hash from the response.
exports.getUserById = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id).select("-password");


    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    successResponse(ctx, user, "User fetched successfully");
  } catch (error) {
    errorResponse(ctx, "Invalid User ID format", 400, error);
  }
};

// Update editable user fields and save the changes.
exports.updateUser = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    // Copy the already-validated request fields onto the user document.
    Object.assign(user, ctx.request.body);

    await user.save();

    successResponse(ctx, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age
      }
    }, "User updated successfully");
  } catch (error) {
    errorResponse(ctx, "Update failed", 400, error);
  }
};


// Delete a user and remove the stored profile picture from disk if it exists.
exports.deleteUser = async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    // Remove the linked profile picture file before deleting the user record.
    if (user.profilePicture) {
      const filePath = path.join(__dirname, "../../", user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await User.findByIdAndDelete(ctx.params.id);

    successResponse(ctx, null, "User deleted successfully");
  } catch (error) {
    errorResponse(ctx, "Delete failed", 400, error);
  }
};

// Upload a new profile picture and replace any old one for the user.
exports.uploadProfilePicture = async (ctx) => {
  try {
    if (!ctx.file) {
      return errorResponse(ctx, "Please upload an image", 400);
    }

    const userId = ctx.params.id || ctx.state.user.id;
    const user = await User.findById(userId);

    if (!user) {
      // Delete the uploaded file immediately if the user record does not exist.
      fs.unlinkSync(ctx.file.path);
      return errorResponse(ctx, "User not found", 404);
    }

    // Remove the previous image so the user only keeps one profile picture.
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, "../../", user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store the relative upload path so the frontend can build a public URL.
    user.profilePicture = `uploads/${ctx.file.filename}`;
    await user.save();

    successResponse(ctx, {
      profilePicture: user.profilePicture,
      url: `${ctx.origin}/${user.profilePicture}`
    }, "Profile picture uploaded successfully");

  } catch (error) {
    if (ctx.file) {
      fs.unlinkSync(ctx.file.path);
    }
    errorResponse(ctx, "Upload failed", 500, error);
  }
};

// Delete the current authenticated user's profile picture.
exports.deleteProfilePicture = async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    if (user.profilePicture) {
      const filePath = path.join(__dirname, "../../", user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      user.profilePicture = "";
      await user.save();
    }

    successResponse(ctx, null, "Profile picture deleted successfully");
  } catch (error) {
    errorResponse(ctx, "Delete profile picture failed", 500, error);
  }
};