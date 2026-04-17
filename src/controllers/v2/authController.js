const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");
const { successResponse, errorResponse } = require("../../utils/response");

const buildMeta = (ctx) => ({
  version: ctx.state.apiVersion || "v2",
  timestamp: new Date().toISOString(),
});

exports.register = async (ctx) => {
  try {
    const { name, email, password, age } = ctx.request.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(ctx, "User already exists", 400);
    }

    const user = new User({ name, email, password, age });
    await user.save();

    successResponse(
      ctx,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
        },
        meta: buildMeta(ctx),
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error(error);
    errorResponse(ctx, "Registration failed", 500, error);
  }
};

exports.login = async (ctx) => {
  try {
    const { email, password } = ctx.request.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(ctx, "Invalid email or password", 401);
    }

    const accessToken = generateToken({ id: user._id });

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
        meta: buildMeta(ctx),
      },
      "Login successful"
    );
  } catch (error) {
    console.error(error);
    errorResponse(ctx, "Login failed", 500, error);
  }
};
