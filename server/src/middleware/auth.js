import jwt from "jsonwebtoken";
import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import User from "../models/User.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = useFileDatabase() ? await fileStore.findUserById(payload.sub) : await User.findById(payload.sub);

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Account is not available." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }

    return next();
  };
}
