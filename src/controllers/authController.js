const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { successResponse, errorResponse } = require("../utils/response");

const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    overwrite: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000
};

const clearAuthCookies = (ctx) => {
    ctx.cookies.set("token", null, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: 0
    });
};

// Create a new user account after checking that the email is not already in use.
exports.register = async (ctx) => {
    try {
        const { name, email, password, age } = ctx.request.body;

        // Stop registration if another account already uses the same email.
        const userExists = await User.findOne({ email });
        if (userExists) {
            return errorResponse(ctx, "User already exists", 400);
        }

        // Save the new user so the model hook can hash the password automatically.
        const user = new User({ name, email, password, age });
        await user.save();

        successResponse(ctx, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        }, "User registered successfully", 201);
    } catch (error) {
        console.error(error);
        errorResponse(ctx, "Registration failed", 500, error);
    }
};

// Authenticate a user and return a JWT for protected requests.
exports.login = async (ctx) => {
    try {
        const { email, password } = ctx.request.body;

        // Look up the account before verifying the submitted password.
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return errorResponse(ctx, "Invalid email or password", 401);
        }

        // Generate a signed token containing the user's id.
        const token = generateToken({ id: user._id });
        ctx.cookies.set("token", token, AUTH_COOKIE_OPTIONS);

        successResponse(ctx, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                age: user.age,
                profilePicture: user.profilePicture
            }
        }, "Login successful");
    } catch (error) {
        console.error(error);
        errorResponse(ctx, "Login failed", 500, error);
    }
};

// Return the currently authenticated user based on the auth cookie.
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

        successResponse(ctx, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                age: user.age,
                profilePicture: user.profilePicture
            }
        }, "User fetched successfully", 200);
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