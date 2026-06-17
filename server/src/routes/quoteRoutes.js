import { Router } from "express";
import { calculateQuoteSchema, getPricing, getQuote } from "../controllers/quoteController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/calculate", validate(calculateQuoteSchema), getQuote);
router.get("/pricing", requireAuth, requireRole("admin"), getPricing);

export default router;
