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
const communicationStatuses = ["new", "in_progress", "waiting_client", "booked", "closed"];

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

export const updateQuoteRequestOwnershipSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    action: z.enum(["take", "release"]),
    communicationStatus: z.enum(communicationStatuses).optional()
  })
});

function userId(user) {
  return String(user?._id || user?.id || "");
}

function ownerId(record) {
  const owner = record?.assignedManager;
  return String(typeof owner === "object" ? owner?._id || owner?.id || "" : owner || "");
}

function ownerName(record) {
  const owner = record?.assignedManager;

  if (!owner) {
    return "another manager";
  }

  if (typeof owner === "object") {
    return owner.name || owner.email || "another manager";
  }

  return "another manager";
}

function isOwnedByAnotherManager(record, user) {
  const currentOwner = ownerId(record);
  return Boolean(currentOwner && currentOwner !== userId(user));
}

function sendOwnershipConflict(res, record) {
  return res.status(409).json({
    message: `This quote is owned by ${ownerName(record)}. Ask them to release it before emailing the client.`
  });
}

function communicationStatusForQuoteStatus(status) {
  if (status === "awaiting_photos") {
    return "waiting_client";
  }

  if (status === "booked") {
    return "booked";
  }

  if (status === "closed") {
    return "closed";
  }

  if (status === "new") {
    return "new";
  }

  return "in_progress";
}

function ownerUpdates(req, communicationStatus = "in_progress") {
  return {
    assignedManager: req.user?._id || req.user?.id || null,
    communicationStatus
  };
}

function clientContactUpdates(req, type, communicationStatus = "waiting_client") {
  return {
    ...ownerUpdates(req, communicationStatus),
    lastClientContactedAt: new Date(),
    lastClientContactedBy: req.user?._id || req.user?.id || null,
    lastClientContactType: type
  };
}

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

  const quoteRequests = await QuoteRequest.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("assignedManager", "name email")
    .populate("lastClientContactedBy", "name email");
  return res.json({ quoteRequests });
});

export const updateQuoteRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  const before = useFileDatabase()
    ? await fileStore.findQuoteRequestById(id)
    : await QuoteRequest.findById(id).populate("assignedManager", "name email").lean();

  if (!before) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  if (isOwnedByAnotherManager(before, req.user)) {
    return sendOwnershipConflict(res, before);
  }

  const updates = {
    status,
    ...ownerUpdates(req, communicationStatusForQuoteStatus(status))
  };
  const quoteRequest = useFileDatabase()
    ? await fileStore.updateQuoteRequest(id, updates)
    : await QuoteRequest.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate("assignedManager", "name email")
        .populate("lastClientContactedBy", "name email");

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
  const before = useFileDatabase()
    ? await fileStore.findQuoteRequestById(id)
    : await QuoteRequest.findById(id).populate("assignedManager", "name email").lean();

  if (!before) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  if (isOwnedByAnotherManager(before, req.user)) {
    return sendOwnershipConflict(res, before);
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
    photoRequestSentAt: new Date(),
    ...clientContactUpdates(req, "photo_request", "waiting_client")
  };
  const quoteRequest = useFileDatabase()
    ? await fileStore.updateQuoteRequest(id, updates)
    : await QuoteRequest.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate("assignedManager", "name email")
        .populate("lastClientContactedBy", "name email");

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

export const updateQuoteRequestOwnership = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { action, communicationStatus } = req.validated.body;
  const before = useFileDatabase()
    ? await fileStore.findQuoteRequestById(id)
    : await QuoteRequest.findById(id).populate("assignedManager", "name email").lean();

  if (!before) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  const updates =
    action === "take"
      ? ownerUpdates(req, communicationStatus || before.communicationStatus || "in_progress")
      : {
          assignedManager: null,
          communicationStatus: communicationStatus || communicationStatusForQuoteStatus(before.status)
        };
  const quoteRequest = useFileDatabase()
    ? await fileStore.updateQuoteRequest(id, updates)
    : await QuoteRequest.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate("assignedManager", "name email")
        .populate("lastClientContactedBy", "name email");

  await recordAuditEvent(req, {
    action: action === "take" ? "quote_request.ownership_taken" : "quote_request.ownership_released",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary:
      action === "take"
        ? `Quote ${quoteRequest.quoteReference} assigned to ${req.user?.name || req.user?.email}.`
        : `Quote ${quoteRequest.quoteReference} ownership released.`,
    metadata: {
      before: {
        assignedManager: before.assignedManager,
        communicationStatus: before.communicationStatus
      },
      after: {
        assignedManager: quoteRequest.assignedManager,
        communicationStatus: quoteRequest.communicationStatus
      }
    }
  });

  return res.json({ quoteRequest });
});
