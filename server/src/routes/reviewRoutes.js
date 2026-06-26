import { Router } from "express";
import {
  completeGoogleBusinessConnection,
  disconnectGoogleBusinessConnection,
  googleBusinessStatus,
  listReviews,
  refreshReviews,
  startGoogleBusinessConnection,
  syncGoogleBusiness
} from "../controllers/reviewController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listReviews);
router.get("/business/callback", completeGoogleBusinessConnection);
router.post("/refresh", requireAuth, requireRole("admin"), refreshReviews);
router.get("/business/status", requireAuth, requireRole("admin"), googleBusinessStatus);
router.get("/business/start", requireAuth, requireRole("admin"), startGoogleBusinessConnection);
router.post("/business/sync", requireAuth, requireRole("admin"), syncGoogleBusiness);
router.delete("/business", requireAuth, requireRole("admin"), disconnectGoogleBusinessConnection);

export default router;
