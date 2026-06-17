import { Router } from "express";
import {
  changePassword,
  changePasswordSchema,
  login,
  loginSchema,
  me,
  signup,
  signupSchema
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);
router.patch("/password", requireAuth, validate(changePasswordSchema), changePassword);

export default router;
