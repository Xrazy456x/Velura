import bcrypt from "bcryptjs";
import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createToken } from "../utils/createToken.js";
import { toSafeUser } from "../utils/safeUser.js";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters.")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
    password: z.string().min(1, "Password is required.")
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters.")
  })
});

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const existing = useFileDatabase() ? await fileStore.findUserByEmail(email) : await User.findOne({ email });

  if (existing) {
    return res.status(409).json({ message: "An account already exists for that email." });
  }

  const userCount = useFileDatabase() ? await fileStore.countUsers() : await User.countDocuments();
  const isConfiguredAdmin = env.adminEmails.includes(email);
  const passwordHash = await bcrypt.hash(password, 12);
  const userPayload = {
    name,
    email,
    passwordHash,
    role: userCount === 0 || isConfiguredAdmin ? "admin" : "user"
  };
  const user = useFileDatabase() ? await fileStore.createUser(userPayload) : await User.create(userPayload);
  const token = createToken(user);

  return res.status(201).json({ user: toSafeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = useFileDatabase()
    ? await fileStore.findUserByEmail(email)
    : await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.status !== "active") {
    return res.status(403).json({ message: "Account is inactive." });
  }

  const token = createToken(user);

  return res.json({ user: toSafeUser(user), token });
});

export const me = asyncHandler(async (req, res) => {
  return res.json({ user: toSafeUser(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  const user = useFileDatabase()
    ? await fileStore.findUserById(req.user._id)
    : await User.findById(req.user._id).select("+passwordHash");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updatedUser = useFileDatabase()
    ? await fileStore.updateUser(user._id, { passwordHash })
    : await User.findByIdAndUpdate(user._id, { passwordHash }, { new: true, runValidators: true });
  const safeUser = toSafeUser(updatedUser);

  await recordAuditEvent(req, {
    action: "account.password_changed",
    resource: "user",
    resourceId: safeUser._id,
    summary: `Password changed for ${safeUser.email}.`,
    metadata: {
      user: safeUser
    }
  });

  return res.json({ user: safeUser });
});
