const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");
const { successResponse, errorResponse } = require("../../utils/response");
const fs = require("fs");
const path = require("path");

const buildMeta = (ctx) => ({
  version: ctx.state.apiVersion || "v2",
  timestamp: new Date().toISOString(),
});

const AUTH_COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax",
  overwrite: true,
  maxAge: 60 * 60 * 1000,
};

const clearUploadedFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

exports.register = async (ctx) => {
  try {
    const { name, email, password, age } = ctx.request.body;

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
      201,
      buildMeta(ctx)
    );
  } catch (error) {
    console.error(error);
    clearUploadedFile(ctx.file);
    errorResponse(ctx, "Registration failed", 500, error);
  }
};

exports.login = async (ctx) => {
  try {
    const { email, password } = ctx.request.body;

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

    if (!(await user.comparePassword(password))) {
      return errorResponse(
        ctx,
        "Incorrect password. Please try again.",
        401,
        null,
        [{ field: "password", message: "Incorrect password. Please try again." }]
      );
    }

    const accessToken = generateToken({ id: user._id });
    ctx.cookies.set("token", accessToken, AUTH_COOKIE_OPTIONS);
    ctx.cookies.set("userId", String(user._id), AUTH_COOKIE_OPTIONS);

    successResponse(
      ctx,
      {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          profilePicture: user.profilePicture,
        },
      },
      "Login successful",
      200,
      buildMeta(ctx)
    );
  } catch (error) {
    console.error(error);
    errorResponse(ctx, "Login failed", 500, error);
  }
};
