import { Router } from "express";
import {
  createInvoice,
  createInvoiceSchema,
  createInvoiceDownloadTicket,
  downloadInvoicePdf,
  downloadInvoicePdfWithTicket,
  invoiceIdSchema,
  invoicePdfTicketSchema,
  listInvoices,
  updateInvoiceStatus,
  updateInvoiceStatusSchema
} from "../controllers/invoiceController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/:id/pdf/direct", validate(invoicePdfTicketSchema), downloadInvoicePdfWithTicket);

router.use(requireAuth, requireRole("admin"));

router.get("/", listInvoices);
router.post("/", validate(createInvoiceSchema), createInvoice);
router.post("/:id/download-ticket", validate(invoiceIdSchema), createInvoiceDownloadTicket);
router.get("/:id/pdf", validate(invoiceIdSchema), downloadInvoicePdf);
router.patch("/:id/status", validate(updateInvoiceStatusSchema), updateInvoiceStatus);

export default router;
