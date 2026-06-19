import { Router } from "express";
import auditRoutes from "./auditRoutes.js";
import authRoutes from "./authRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import leadRoutes from "./leadRoutes.js";
import quoteRoutes from "./quoteRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/audit", auditRoutes);
router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/employees", employeeRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/users", userRoutes);
router.use("/leads", leadRoutes);
router.use("/quote", quoteRoutes);
router.use("/reviews", reviewRoutes);

export default router;
