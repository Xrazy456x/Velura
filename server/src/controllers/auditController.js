import { z } from "zod";
import { listAuditEvents } from "../services/auditService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAuditEventsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : 100))
      .pipe(z.number().int().min(1).max(500))
  })
});

export const listAudit = asyncHandler(async (req, res) => {
  const { limit } = req.validated.query;
  const auditEvents = await listAuditEvents({ limit });

  return res.json({ auditEvents });
});
