import { Router } from "express";
import {
  createEmployee,
  createEmployeeSchema,
  deleteEmployee,
  employeeIdSchema,
  listEmployees,
  updateEmployee,
  updateEmployeeSchema
} from "../controllers/employeeController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", listEmployees);
router.post("/", validate(createEmployeeSchema), createEmployee);
router.patch("/:id", validate(updateEmployeeSchema), updateEmployee);
router.delete("/:id", validate(employeeIdSchema), deleteEmployee);

export default router;
