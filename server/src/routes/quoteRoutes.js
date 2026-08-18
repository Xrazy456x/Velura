import { Router } from "express";
import {
  calculateQuoteSchema,
  createManagerCustomQuote,
  createManagerCustomQuoteSchema,
  getPricing,
  getQuote,
  listQuoteRequests,
  deleteQuoteRequest,
  permanentlyDeleteQuoteRequest,
  quoteRequestIdSchema,
  restoreQuoteRequest,
  resendManagerCustomQuote,
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
router.post("/custom", requireAuth, requireRole("admin"), validate(createManagerCustomQuoteSchema), createManagerCustomQuote);
router.get("/requests", requireAuth, requireRole("admin"), listQuoteRequests);
router.delete("/requests/:id/permanent", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), permanentlyDeleteQuoteRequest);
router.delete("/requests/:id", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), deleteQuoteRequest);
router.post("/requests/:id/restore", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), restoreQuoteRequest);
router.post("/requests/:id/send-custom-quote", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), resendManagerCustomQuote);
router.post("/requests/:id/photo-request", requireAuth, requireRole("admin"), validate(quoteRequestIdSchema), sendQuotePhotoRequest);
router.patch("/requests/:id/status", requireAuth, requireRole("admin"), validate(updateQuoteRequestStatusSchema), updateQuoteRequestStatus);
router.patch("/requests/:id/ownership", requireAuth, requireRole("admin"), validate(updateQuoteRequestOwnershipSchema), updateQuoteRequestOwnership);
router.get("/pricing", requireAuth, requireRole("admin"), getPricing);

export default router;
