import { Router } from "express";
import {
  createUser,
  createUserSchema,
  deleteUser,
  listUsers,
  resetUserPassword,
  resetUserPasswordSchema,
  updateUser,
  updateUserSchema,
  userIdSchema
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", listUsers);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.patch("/:id/password", validate(resetUserPasswordSchema), resetUserPassword);
router.delete("/:id", validate(userIdSchema), deleteUser);

export default router;
