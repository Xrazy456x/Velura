import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import AuditEvent from "../models/AuditEvent.js";
import * as fileStore from "./fileStore.js";

const REDACTED = "[redacted]";
const CIRCULAR = "[circular]";
const sensitiveKeys = new Set(["password", "passwordHash", "token", "jwt", "authorization"]);

function expiresAt() {
  return new Date(Date.now() + env.auditLogRetentionDays * 24 * 60 * 60 * 1000);
}

function sanitize(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value !== "object") {
    return value;
  }

  if (typeof value.toHexString === "function") {
    return value.toString();
  }

  if (seen.has(value)) {
    return CIRCULAR;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen));
  }

  if (value instanceof Map) {
    return sanitize(Object.fromEntries(value), seen);
  }

  if (typeof value.toObject === "function") {
    return sanitize(value.toObject({ depopulate: false, getters: false, versionKey: false, virtuals: false }), seen);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? REDACTED : sanitize(nestedValue, seen)
    ])
  );
}

function actorFromRequest(req) {
  if (!req.user) {
    return null;
  }

  return {
    id: req.user._id?.toString?.() || req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  };
}

export async function recordAuditEvent(req, event) {
  try {
    const payload = {
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId?.toString?.() || event.resourceId,
      summary: event.summary,
      actor: event.actor || actorFromRequest(req),
      metadata: sanitize(event.metadata || {}),
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      expiresAt: expiresAt()
    };

    if (useFileDatabase()) {
      return fileStore.createAuditEvent(payload);
    }

    return AuditEvent.create(payload);
  } catch (error) {
    console.error("Audit logging failed:", error);
    return null;
  }
}

export async function listAuditEvents({ limit = 100 } = {}) {
  if (useFileDatabase()) {
    return fileStore.listAuditEvents({ limit });
  }

  return AuditEvent.find().sort({ createdAt: -1 }).limit(limit).lean();
}
