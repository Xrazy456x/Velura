import { Router } from "express";
import {
  createLead,
  createLeadSchema,
  deleteLead,
  leadIdSchema,
  listLeads,
  permanentlyDeleteLead,
  restoreLead,
  updateLeadStatus,
  updateLeadStatusSchema
} from "../controllers/leadController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/", validate(createLeadSchema), createLead);
router.get("/", requireAuth, requireRole("admin"), listLeads);
router.delete("/:id/permanent", requireAuth, requireRole("admin"), validate(leadIdSchema), permanentlyDeleteLead);
router.delete("/:id", requireAuth, requireRole("admin"), validate(leadIdSchema), deleteLead);
router.post("/:id/restore", requireAuth, requireRole("admin"), validate(leadIdSchema), restoreLead);
router.patch("/:id/status", requireAuth, requireRole("admin"), validate(updateLeadStatusSchema), updateLeadStatus);

export default router;
