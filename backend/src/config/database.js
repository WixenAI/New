const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("MONGO_URL is required to start the backend.");
  }

  await mongoose.connect(mongoUrl);
}

module.exports = { connectDatabase };
