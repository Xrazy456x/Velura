import { Router } from "express";
import {
  calculateQuoteSchema,
  getPricing,
  getQuote,
  listQuoteRequests,
  quoteRequestIdSchema,
  sendQuotePhotoRequest,
  submitQuoteRequest,
  submitQuoteRequestSchema,
  updateQuoteRequestOwnership,
  updateQuoteRequestOwnershipSchema,
  updateQuoteRequestStatus,
  updateQuoteRequestStatusSchema
} from "../controllers/quoteController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/calculate", validate(calculateQuoteSchema), getQuote);
router.post("/requests", validate(submitQuoteRequestSchema), submitQuoteRequest);
router.get("/requests", requireAuth, requireRole("admin"), listQuoteRequests);
router.post("/requests/:id/photo-request", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), sendQuotePhotoRequest);
router.patch("/requests/:id/status", requireAuth, requireRole("admin"), validate(updateQuoteRequestStatusSchema), updateQuoteRequestStatus);
router.patch("/requests/:id/ownership", requireAuth, requireRole("admin"), validate(updateQuoteRequestOwnershipSchema), updateQuoteRequestOwnership);
router.get("/pricing", requireAuth, requireRole("admin"), getPricing);

export default router;
