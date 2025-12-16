import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

if (!MONGODB_DB) {
  throw new Error("Missing MONGODB_DB in .env.local");
}

// Prevent multiple connections in dev mode
let isConnected = false;

export async function dbConnect() {
  if (isConnected) {
    return;
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
    });

    isConnected = true;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    throw err;
  }
}
