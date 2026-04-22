const Joi = require("joi");

const fieldMessages = {
    name: {
        "string.base": "Full name must be a text value.",
        "string.empty": "Full name is required.",
        "string.min": "Full name must be at least 3 characters.",
        "string.max": "Full name must be 30 characters or less.",
        "any.required": "Full name is required."
    },
    email: {
        "string.base": "Email must be a text value.",
        "string.empty": "Email is required.",
        "string.email": "Enter a valid email address.",
        "any.required": "Email is required."
    },
    password: {
        "string.base": "Password must be a text value.",
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 6 characters.",
        "any.required": "Password is required."
    },
    age: {
        "number.base": "Age must be a valid number.",
        "number.integer": "Age must be a whole number.",
        "number.min": "Age must be at least 1."
    }
};

// Rules for validating the signup request payload.
const registerSchema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages(fieldMessages.name),
    email: Joi.string().email().required().messages(fieldMessages.email),
    password: Joi.string().min(6).required().messages(fieldMessages.password),
    age: Joi.number().integer().min(1).messages(fieldMessages.age)
});

// Rules for validating the login request payload.
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages(fieldMessages.email),
    password: Joi.string().required().messages(fieldMessages.password)
});

module.exports = {
    registerSchema,
    loginSchema
};
