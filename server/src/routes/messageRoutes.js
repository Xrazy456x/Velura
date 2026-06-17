import { Router } from "express";
import { listMessages, updateMessage, updateMessageSchema } from "../controllers/messageController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", listMessages);
router.patch("/:id", validate(updateMessageSchema), updateMessage);

export default router;
