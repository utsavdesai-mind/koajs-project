require("dotenv").config();
const mongoose = require("mongoose");

// Open the MongoDB connection used by the whole application.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    // Exit early if the app cannot talk to the database at startup.
    console.log("Database Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;