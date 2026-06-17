import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import AuditEvent from "../models/AuditEvent.js";
import * as fileStore from "./fileStore.js";

const REDACTED = "[redacted]";
const sensitiveKeys = new Set(["password", "passwordHash", "token", "jwt", "authorization"]);

function expiresAt() {
  return new Date(Date.now() + env.auditLogRetentionDays * 24 * 60 * 60 * 1000);
}

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeys.has(key.toLowerCase()) ? REDACTED : sanitize(nestedValue)
      ])
    );
  }

  return value;
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

  try {
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
