// Idempotent seed script for the single, shared AI Assistant system
// user. Safe to run multiple times (locally, in CI, or as part of a
// deploy step) - it does nothing if the AI user already exists.
//
// Run with:
//   node scripts/createAiUser.js
// or:
//   pnpm run seed:ai

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config({ quiet: true });

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Check your .env file.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingAI = await User.findOne({ accountType: "ai" });

  if (existingAI) {
    console.log("AI assistant user already exists:", existingAI._id.toString());
  } else {
    const aiUser = await User.create({
      username: "ai_assistant",
      email: "ai@system.local",
      name: "AI Assistant",
      avatar: "",
      bio: "Your built-in AI assistant.",
      accountType: "ai",
      provider: "local",
      isVerified: true,
      // Intentionally no password: this account can never authenticate
      // through the normal login flow (see auth.service.js, which also
      // explicitly rejects accountType "ai" as a defense-in-depth check).
    });
    console.log("AI assistant user created:", aiUser._id.toString());
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to create AI assistant user:", error);
  process.exit(1);
});
