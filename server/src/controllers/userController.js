import bcrypt from "bcryptjs";
import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import User from "../models/User.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toSafeUser } from "../utils/safeUser.js";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    role: z.enum(["admin", "user"]).default("user")
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    role: z.enum(["admin", "user"]).optional(),
    status: z.enum(["active", "inactive"]).optional()
  })
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const resetUserPasswordSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    password: z.string().min(8, "Password must be at least 8 characters.")
  })
});

export const listUsers = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const users = await fileStore.listUsers();
    return res.json({ users });
  }

  const users = await User.find().sort({ createdAt: -1 });
  return res.json({ users: users.map((user) => user.toSafeObject()) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validated.body;
  const existing = useFileDatabase() ? await fileStore.findUserByEmail(email) : await User.findOne({ email });

  if (existing) {
    return res.status(409).json({ message: "An account already exists for that email." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userPayload = {
    name,
    email,
    passwordHash,
    role,
    status: "active"
  };
  const user = useFileDatabase() ? await fileStore.createUser(userPayload) : await User.create(userPayload);
  const safeUser = toSafeUser(user);

  await recordAuditEvent(req, {
    action: "account.created",
    resource: "user",
    resourceId: safeUser._id,
    summary: `Account created for ${safeUser.email}.`,
    metadata: {
      user: safeUser
    }
  });

  return res.status(201).json({ user: safeUser });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const updates = req.validated.body;
  const before = useFileDatabase() ? await fileStore.findUserById(id) : await User.findById(id).lean();

  if (id === req.user._id.toString() && updates.role && updates.role !== req.user.role) {
    return res.status(400).json({ message: "You cannot change your own role." });
  }

  const user = useFileDatabase()
    ? await fileStore.updateUser(id, updates)
    : await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const safeUser = typeof user.toSafeObject === "function" ? user.toSafeObject() : user;

  await recordAuditEvent(req, {
    action: "manager.updated",
    resource: "user",
    resourceId: safeUser._id,
    summary: `Account updated for ${safeUser.email}.`,
    metadata: {
      before: {
        role: before?.role,
        status: before?.status
      },
      after: {
        role: safeUser.role,
        status: safeUser.status
      }
    }
  });

  return res.json({ user: safeUser });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;

  if (id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot delete your own manager account while signed in." });
  }

  const user = useFileDatabase() ? await fileStore.deleteUser(id) : await User.findByIdAndDelete(id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const safeUser = typeof user.toSafeObject === "function" ? user.toSafeObject() : toSafeUser(user);

  await recordAuditEvent(req, {
    action: "manager.deleted",
    resource: "user",
    resourceId: safeUser._id,
    summary: `Account deleted for ${safeUser.email}.`,
    metadata: {
      user: safeUser
    }
  });

  return res.json({ user: safeUser });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { password } = req.validated.body;
  const before = useFileDatabase() ? await fileStore.findUserById(id) : await User.findById(id).lean();

  if (!before) {
    return res.status(404).json({ message: "User not found." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = useFileDatabase()
    ? await fileStore.updateUser(id, { passwordHash })
    : await User.findByIdAndUpdate(id, { passwordHash }, { new: true, runValidators: true });
  const safeUser = typeof user.toSafeObject === "function" ? user.toSafeObject() : toSafeUser(user);

  await recordAuditEvent(req, {
    action: "manager.password_reset",
    resource: "user",
    resourceId: safeUser._id,
    summary: `Password reset for ${safeUser.email}.`,
    metadata: {
      user: {
        _id: safeUser._id,
        email: safeUser.email,
        role: safeUser.role,
        status: safeUser.status
      }
    }
  });

  return res.json({ user: safeUser });
});
