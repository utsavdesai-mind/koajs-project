const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Describe how user documents are stored in MongoDB.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  profilePicture: { type: String, default: "" },
}, { timestamps: true });

// Hash the password only when it is first set or later changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare a plain-text password with the stored hashed password.
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model so routes and controllers can use it.
module.exports = mongoose.model("User", userSchema);