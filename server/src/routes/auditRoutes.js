import { Router } from "express";
import { listAudit, listAuditEventsSchema } from "../controllers/auditController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", validate(listAuditEventsSchema), listAudit);

export default router;
