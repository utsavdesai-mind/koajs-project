const Joi = require("joi");

const updateUserSchema = Joi.object({
    name: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    age: Joi.number().integer().min(1)
}).min(1); // At least one field should be provided for update

module.exports = {
    updateUserSchema
};
