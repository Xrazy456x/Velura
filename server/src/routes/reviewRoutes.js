import { Router } from "express";
import { listReviews, refreshReviews } from "../controllers/reviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listReviews);
router.post("/refresh", requireAuth, requireRole("admin"), refreshReviews);

export default router;
