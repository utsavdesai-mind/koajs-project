const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");
const { successResponse, errorResponse } = require("../../utils/response");
const fs = require("fs");
const path = require("path");

// Reuse one cookie configuration for login-related browser storage.
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  overwrite: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 1000,
};

const clearAuthCookies = (ctx) => {
  ctx.cookies.set("token", null, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
};

// Remove an uploaded file when the request fails after Multer saves it.
const clearUploadedFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

// Register a v2 user and optionally save a profile picture.
exports.register = async (ctx) => {
  try {
    const { name, email, password, age } = ctx.request.body;

    // Prevent duplicate accounts and clean up uploaded files if needed.
    const userExists = await User.findOne({ email });
    if (userExists) {
      clearUploadedFile(ctx.file);
      return errorResponse(
        ctx,
        "An account with this email already exists. Please login instead.",
        400,
        null,
        [{ field: "email", message: "This email is already registered." }]
      );
    }

    const userData = { name, email, password, age };
    if (ctx.file) {
      // Keep a relative file path that the frontend can use directly.
      userData.profilePicture = path.posix.join("uploads", ctx.file.filename);
    }

    const user = new User(userData);
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
        },
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error(error);
    clearUploadedFile(ctx.file);
    errorResponse(ctx, "Registration failed", 500, error);
  }
};

// Authenticate a v2 user, then send the token in cookies and the response body.
exports.login = async (ctx) => {
  try {
    const { email, password } = ctx.request.body;

    // Return a field-level email error when the account does not exist.
    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(
        ctx,
        "No account found with this email address. Please sign up first.",
        404,
        null,
        [{ field: "email", message: "No account found with this email address." }]
      );
    }

    // Return a field-level password error when the password is incorrect.
    if (!(await user.comparePassword(password))) {
      return errorResponse(
        ctx,
        "Incorrect password. Please try again.",
        401,
        null,
        [{ field: "password", message: "Incorrect password. Please try again." }]
      );
    }

    // Save the token in cookies so browser requests stay authenticated.
    const accessToken = generateToken({ id: user._id });
    ctx.cookies.set("token", accessToken, AUTH_COOKIE_OPTIONS);

    successResponse(
      ctx,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          profilePicture: user.profilePicture,
        },
      },
      "Login successful",
      200
    );
  } catch (error) {
    console.error(error);
    errorResponse(ctx, "Login failed", 500, error);
  }
};

// Return the current authenticated user from the login cookie.
exports.me = async (ctx) => {
  try {
    const userId = ctx.state.user?.id;

    if (!userId) {
      return errorResponse(ctx, "Unauthorized", 401);
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return errorResponse(ctx, "User not found", 404);
    }

    successResponse(
      ctx,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          profilePicture: user.profilePicture,
        },
      },
      "User fetched successfully",
      200
    );
  } catch (error) {
    console.error(error);
    errorResponse(ctx, "Unable to load current user", 500, error);
  }
};

// Clear the auth cookie so the browser fully logs out.
exports.logout = async (ctx) => {
  clearAuthCookies(ctx);
  successResponse(ctx, null, "Logged out successfully", 200);
};
