import { Router } from "express";
import { getGovernance } from "../controllers/governanceController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", getGovernance);

export default router;
