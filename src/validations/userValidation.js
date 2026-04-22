const Joi = require("joi");

const fieldMessages = {
    name: {
        "string.base": "Full name must be a text value.",
        "string.empty": "Full name is required.",
        "string.min": "Full name must be at least 3 characters.",
        "string.max": "Full name must be 30 characters or less."
    },
    email: {
        "string.base": "Email must be a text value.",
        "string.empty": "Email is required.",
        "string.email": "Enter a valid email address."
    },
    password: {
        "string.base": "Password must be a text value.",
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 6 characters."
    },
    age: {
        "number.base": "Age must be a valid number.",
        "number.integer": "Age must be a whole number.",
        "number.min": "Age must be at least 1."
    }
};

// Rules for validating editable user profile fields.
const updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(30).messages(fieldMessages.name),
    email: Joi.string().email().messages(fieldMessages.email),
    password: Joi.string().min(6).messages(fieldMessages.password),
    age: Joi.number().integer().min(1).allow(null).messages(fieldMessages.age)
}).min(1); // At least one field should be provided for update

module.exports = {
    updateUserSchema
};
