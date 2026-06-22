import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Counter from "../models/Counter.js";
import QuoteRequest from "../models/QuoteRequest.js";
import { recordAuditEvent } from "../services/auditService.js";
import { sendQuotePhotoRequestEmail, sendQuoteRequestNotification } from "../services/emailService.js";
import * as fileStore from "../services/fileStore.js";
import {
  addOnKeys,
  calculateQuote,
  conditionKeys,
  frequencyKeys,
  getPricingMatrix,
  propertyTypeKeys,
  serviceTypeKeys,
  urgencyKeys
} from "../services/pricingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const quoteInputSchema = z.object({
  serviceType: z.enum(serviceTypeKeys),
  propertyType: z.enum(propertyTypeKeys).default("flat"),
  bedrooms: z.coerce.number().int().min(0).max(5).default(1),
  bathrooms: z.coerce.number().int().min(1).max(8).default(1),
  condition: z.enum(conditionKeys).default("good"),
  urgency: z.enum(urgencyKeys).default("standard"),
  frequency: z.enum(frequencyKeys).default("one_off"),
  addOns: z.array(z.enum(addOnKeys)).default([]),
  carpetRooms: z.coerce.number().int().min(1).max(10).default(1),
  linenSets: z.coerce.number().int().min(1).max(10).default(1),
  addOnAreas: z.coerce.number().int().min(1).max(10).default(1)
});

const quoteStatuses = ["new", "reviewing", "awaiting_photos", "quoted", "booked", "closed"];

export const calculateQuoteSchema = z.object({
  body: quoteInputSchema
});

export const submitQuoteRequestSchema = z.object({
  body: z.object({
    clientName: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
    email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
    phone: z.string().trim().min(5, "Phone number is required.").max(40),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
    preferredTime: z.string().trim().max(40).optional().or(z.literal("")),
    accessInstructions: z.string().trim().max(1200).optional().or(z.literal("")),
    parkingNotes: z.string().trim().max(1200).optional().or(z.literal("")),
    quoteNotes: z.string().trim().max(1600).optional().or(z.literal("")),
    quoteInput: quoteInputSchema
  })
});

export const updateQuoteRequestStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(quoteStatuses)
  })
});

export const quoteRequestIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const getQuote = asyncHandler(async (req, res) => {
  return res.json({ quote: calculateQuote(req.validated.body) });
});

export const getPricing = asyncHandler(async (req, res) => {
  return res.json({ pricing: getPricingMatrix() });
});

function referenceYear(value = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

async function createQuoteReference() {
  const year = referenceYear();

  if (useFileDatabase()) {
    return fileStore.nextQuoteReference(year);
  }

  const counter = await Counter.findOneAndUpdate(
    { key: `quotes:${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `VQ-${year}-${String(counter.seq).padStart(4, "0")}`;
}

export const submitQuoteRequest = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const quoteResult = calculateQuote(payload.quoteInput);
  const quotePayload = {
    ...payload,
    quoteReference: await createQuoteReference(),
    quoteResult
  };
  const quoteRequest = useFileDatabase()
    ? await fileStore.createQuoteRequest(quotePayload)
    : await QuoteRequest.create(quotePayload);
  const emailNotification = await sendQuoteRequestNotification(quoteRequest);

  await recordAuditEvent(req, {
    action: "quote_request.created",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Quote request ${quoteRequest.quoteReference} received from ${quoteRequest.clientName}.`,
    metadata: {
      quoteReference: quoteRequest.quoteReference,
      clientName: quoteRequest.clientName,
      email: quoteRequest.email,
      displayPrice: quoteRequest.quoteResult?.displayPrice,
      emailNotification
    }
  });

  return res.status(201).json({ quoteRequest, emailNotification });
});

export const listQuoteRequests = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const quoteRequests = await fileStore.listQuoteRequests();
    return res.json({ quoteRequests });
  }

  const quoteRequests = await QuoteRequest.find().sort({ createdAt: -1 }).limit(200);
  return res.json({ quoteRequests });
});

export const updateQuoteRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  const before = useFileDatabase() ? await fileStore.findQuoteRequestById(id) : await QuoteRequest.findById(id).lean();
  const quoteRequest = useFileDatabase()
    ? await fileStore.updateQuoteRequest(id, { status })
    : await QuoteRequest.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

  if (!quoteRequest) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  await recordAuditEvent(req, {
    action: "quote_request.status_updated",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Quote request ${quoteRequest.quoteReference} changed from ${before?.status || "unknown"} to ${quoteRequest.status}.`,
    metadata: {
      before: { status: before?.status },
      after: { status: quoteRequest.status }
    }
  });

  return res.json({ quoteRequest });
});

export const sendQuotePhotoRequest = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const before = useFileDatabase() ? await fileStore.findQuoteRequestById(id) : await QuoteRequest.findById(id).lean();

  if (!before) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  let photoRequestEmail;

  try {
    photoRequestEmail = await sendQuotePhotoRequestEmail(before);
  } catch (error) {
    console.error("Quote photo request email failed:", error);
    return res.status(502).json({ message: "Photo request email could not be sent. Check email settings." });
  }

  if (!photoRequestEmail?.sent) {
    return res.status(502).json({ message: photoRequestEmail?.reason || "Photo request email could not be sent." });
  }

  const updates = {
    status: "awaiting_photos",
    photoRequestSentAt: new Date()
  };
  const quoteRequest = useFileDatabase()
    ? await fileStore.updateQuoteRequest(id, updates)
    : await QuoteRequest.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  await recordAuditEvent(req, {
    action: "quote_request.photo_request_sent",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Photo request email sent for quote ${quoteRequest.quoteReference}.`,
    metadata: {
      before: { status: before.status },
      after: { status: quoteRequest.status, photoRequestSentAt: quoteRequest.photoRequestSentAt },
      photoRequestEmail
    }
  });

  return res.json({ quoteRequest, photoRequestEmail });
});
