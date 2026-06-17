import mongoose from "mongoose";
import { env } from "./env.js";
import { ensureFileStore, fileStorePath } from "../services/fileStore.js";

let databaseMode = "mongodb";

export function useFileDatabase() {
  return databaseMode === "file";
}

export async function connectDatabase() {
  if (env.nodeEnv === "production" && env.databaseDriver === "file") {
    throw new Error("DATABASE_DRIVER=file is only intended for local development.");
  }

  if (env.databaseDriver === "file") {
    databaseMode = "file";
    await ensureFileStore();
    console.log(`Using local file database: ${fileStorePath}`);
    return;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== "production",
      serverSelectionTimeoutMS: env.nodeEnv === "production" ? 30000 : 2500
    });

    databaseMode = "mongodb";
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    if (env.nodeEnv === "production" || !env.databaseFallbackToFile) {
      throw error;
    }

    databaseMode = "file";
    await ensureFileStore();
    console.warn("MongoDB is not available. Falling back to the local development file database.");
    console.warn(`Using local file database: ${fileStorePath}`);
  }
}
