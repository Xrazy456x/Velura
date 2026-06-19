import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Invoice from "../models/Invoice.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { generateInvoicePdf } from "../services/invoicePdfService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const invoiceStatuses = ["draft", "sent", "paid", "void"];

const lineItemSchema = z.object({
  description: z.string().trim().min(2, "Line item description is required.").max(200),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0.").max(999),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative.").max(100000),
  vatRate: z.coerce.number().min(0).max(100).default(0)
});

export const createInvoiceSchema = z.object({
  body: z.object({
    bookingId: z.string().trim().min(1, "Choose a booking to invoice."),
    status: z.enum(invoiceStatuses).optional().default("draft"),
    issueDate: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Issue date is invalid."),
    dueDate: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Due date is invalid."),
    paymentInstructions: z.string().trim().max(1200).optional().or(z.literal("")),
    notes: z.string().trim().max(1200).optional().or(z.literal("")),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one invoice line item.").max(12)
  })
});

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const updateInvoiceStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(invoiceStatuses)
  })
});

function invoiceYear(value = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

async function createInvoiceNumber(issueDate) {
  const year = invoiceYear(issueDate);

  if (useFileDatabase()) {
    return fileStore.nextInvoiceNumber(year);
  }

  const counter = await Counter.findOneAndUpdate(
    { key: `invoices:${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `INV-${year}-${String(counter.seq).padStart(4, "0")}`;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function bookingReference(booking) {
  if (booking?.bookingNumber) {
    return booking.bookingNumber;
  }

  const fallback = String(booking?._id || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-6);

  return fallback ? `VEL-${fallback}` : "VEL-BOOKING";
}

function normalizeLineItems(lineItems = []) {
  return lineItems.map((item) => {
    const quantity = roundMoney(item.quantity);
    const unitPrice = roundMoney(item.unitPrice);
    const vatRate = roundMoney(item.vatRate);
    const amount = roundMoney(quantity * unitPrice);
    const vatAmount = roundMoney(amount * (vatRate / 100));
    const total = roundMoney(amount + vatAmount);

    return {
      description: item.description,
      quantity,
      unitPrice,
      vatRate,
      amount,
      vatAmount,
      total
    };
  });
}

function buildInvoicePayload(payload, booking, invoiceNumber, req) {
  const issueDate = payload.issueDate ? new Date(payload.issueDate) : new Date();
  const dueDate = payload.dueDate ? new Date(payload.dueDate) : addDays(issueDate, 14);
  const lineItems = normalizeLineItems(payload.lineItems);
  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const vatTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.vatAmount, 0));
  const total = roundMoney(lineItems.reduce((sum, item) => sum + item.total, 0));

  return {
    booking: booking._id,
    invoiceNumber,
    bookingReference: bookingReference(booking),
    status: payload.status || "draft",
    clientName: booking.clientName,
    email: booking.email,
    phone: booking.phone || "",
    billingAddress: booking.address,
    service: booking.service,
    bookingDate: booking.scheduledFor ? new Date(booking.scheduledFor) : undefined,
    issueDate,
    dueDate,
    currency: "GBP",
    lineItems,
    subtotal,
    vatTotal,
    total,
    paymentInstructions:
      payload.paymentInstructions ||
      "Please pay by bank transfer to the Velura Services Tide account. Use the invoice number as the payment reference.",
    notes: payload.notes || "",
    createdBy: req.user?._id || null
  };
}

async function findActiveBooking(id) {
  if (useFileDatabase()) {
    const booking = await fileStore.findBookingById(id);
    return booking && !booking.deletedAt ? booking : null;
  }

  return Booking.findOne({
    _id: id,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
  }).lean();
}

async function findInvoice(id) {
  if (useFileDatabase()) {
    return fileStore.findInvoiceById(id);
  }

  return Invoice.findById(id).populate("booking", "bookingNumber clientName service scheduledFor address").populate("createdBy", "name email").lean();
}

async function listInvoiceRecords() {
  if (useFileDatabase()) {
    return fileStore.listInvoices();
  }

  return Invoice.find()
    .sort({ createdAt: -1 })
    .populate("booking", "bookingNumber clientName service scheduledFor address")
    .populate("createdBy", "name email")
    .lean();
}

export const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await listInvoiceRecords();
  return res.json({ invoices });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const booking = await findActiveBooking(payload.bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found for invoice." });
  }

  const invoiceNumber = await createInvoiceNumber(payload.issueDate || new Date());
  const invoicePayload = buildInvoicePayload(payload, booking, invoiceNumber, req);
  const invoice = useFileDatabase() ? await fileStore.createInvoice(invoicePayload) : await Invoice.create(invoicePayload);
  const savedInvoice = await findInvoice(invoice._id);

  await recordAuditEvent(req, {
    action: "invoice.created",
    resource: "invoice",
    resourceId: invoice._id,
    summary: `Invoice ${invoice.invoiceNumber} created for ${invoice.clientName}.`,
    metadata: { invoice: savedInvoice || invoice }
  });

  return res.status(201).json({ invoice: savedInvoice || invoice });
});

export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  const invoice = useFileDatabase()
    ? await fileStore.updateInvoice(id, { status })
    : await Invoice.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
        .populate("booking", "bookingNumber clientName service scheduledFor address")
        .populate("createdBy", "name email")
        .lean();

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found." });
  }

  await recordAuditEvent(req, {
    action: "invoice.status_updated",
    resource: "invoice",
    resourceId: invoice._id,
    summary: `Invoice ${invoice.invoiceNumber} marked ${invoice.status}.`,
    metadata: { invoice }
  });

  return res.json({ invoice });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const invoice = await findInvoice(id);

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found." });
  }

  const pdf = generateInvoicePdf(invoice);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.setHeader("Content-Length", pdf.length);
  return res.send(pdf);
});
