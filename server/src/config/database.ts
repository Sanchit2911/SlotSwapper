// server/src/config/database.ts
import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error("❌ Missing MONGODB_URI in environment variables");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Try detecting replica set (for transactions)
    try {
      const db = conn.connection.db;
      if (!db) throw new Error("Database not initialized yet");
      const admin = db.admin();
      const repl = await admin
        .command({ replSetGetStatus: 1 })
        .catch(() => null);

      if (repl) {
        console.log("✅ Replica set detected — transactions supported");
      } else {
        console.warn("⚠️ Standalone MongoDB detected — transactions disabled");
      }
    } catch {
      console.warn(
        "⚠️ Could not verify replica set — continuing without transactions"
      );
    }

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Retrying in 5s...");
      setTimeout(connectDB, 5000);
    });
  } catch (err: any) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
