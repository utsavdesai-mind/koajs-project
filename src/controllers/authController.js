const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { successResponse, errorResponse } = require("../utils/response");

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

        successResponse(ctx, {
            token,
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