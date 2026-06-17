import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase, useFileDatabase } from "../config/database.js";
import User from "../models/User.js";
import * as fileStore from "../services/fileStore.js";

const email = (process.env.ADMIN_SEED_EMAIL || "lr@veluraservices.com").trim().toLowerCase();
const name = (process.env.ADMIN_SEED_NAME || "Leonard Rexha").trim();
const password = process.env.ADMIN_SEED_PASSWORD;

if (!password || password.length < 8) {
  console.error("ADMIN_SEED_PASSWORD must be set and at least 8 characters.");
  process.exit(1);
}

await connectDatabase();

const passwordHash = await bcrypt.hash(password, 12);
const existing = useFileDatabase() ? await fileStore.findUserByEmail(email) : await User.findOne({ email }).select("+passwordHash");

if (existing) {
  const updates = {
    name: existing.name || name,
    passwordHash,
    role: "admin",
    status: "active"
  };

  if (useFileDatabase()) {
    await fileStore.updateUser(existing._id, updates);
  } else {
    await User.findByIdAndUpdate(existing._id, updates, { runValidators: true });
  }

  console.log(`Updated admin account: ${email}`);
} else {
  const payload = {
    name,
    email,
    passwordHash,
    role: "admin",
    status: "active"
  };

  if (useFileDatabase()) {
    await fileStore.createUser(payload);
  } else {
    await User.create(payload);
  }

  console.log(`Created admin account: ${email}`);
}

await mongoose.disconnect();
