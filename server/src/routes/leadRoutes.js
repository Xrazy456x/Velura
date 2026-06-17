import { Router } from "express";
import {
  createLead,
  createLeadSchema,
  listLeads,
  updateLeadStatus,
  updateLeadStatusSchema
} from "../controllers/leadController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/", validate(createLeadSchema), createLead);
router.get("/", requireAuth, requireRole("admin"), listLeads);
router.patch("/:id/status", requireAuth, requireRole("admin"), validate(updateLeadStatusSchema), updateLeadStatus);

export default router;
