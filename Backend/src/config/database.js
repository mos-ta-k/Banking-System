const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const connectToDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not defined. Falling back to mongodb://127.0.0.1:27017/banking-system");
  }

  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
      maxPoolSize: 10,
      dbName: "banking-system",
    });

    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectToDB;
