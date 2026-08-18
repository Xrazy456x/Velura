import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Counter from "../models/Counter.js";
import QuoteRequest from "../models/QuoteRequest.js";
import { recordAuditEvent } from "../services/auditService.js";
import { sendManagerCustomQuoteEmail, sendQuotePhotoRequestEmail, sendQuoteRequestNotification } from "../services/emailService.js";
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

const customQuoteLineSchema = z.object({
  label: z.string().trim().min(2, "Each service line needs a name.").max(120),
  detail: z.string().trim().max(300).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
  unitPricePennies: z.coerce.number().int().min(0).max(5000000)
});

export const createManagerCustomQuoteSchema = z.object({
  body: z.object({
    clientName: z.string().trim().min(2, "Client name must be at least 2 characters.").max(100),
    email: z.string().trim().email("Please provide a valid client email.").toLowerCase(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    serviceTitle: z.string().trim().min(2, "Service title is required.").max(120),
    propertySummary: z.string().trim().min(2, "Property or scope summary is required.").max(240),
    quoteNotes: z.string().trim().max(1600).optional().or(z.literal("")),
    preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
    preferredTime: z.string().trim().max(40).optional().or(z.literal("")),
    lineItems: z.array(customQuoteLineSchema).min(1, "Add at least one service line.").max(20),
    standardAddOns: z
      .array(
        z.object({
          key: z.enum(addOnKeys),
          quantity: z.coerce.number().int().min(1).max(50).default(1)
        })
      )
      .max(addOnKeys.length)
      .default([]),
    customTotalPennies: z.coerce.number().int().min(1, "Final quote total must be greater than zero.").max(50000000)
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

function formatMoney(pennies) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pennies % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(pennies / 100);
}

export function buildManagerCustomQuote(payload) {
  const pricingAddOns = new Map(getPricingMatrix().addOns.map((addOn) => [addOn.key, addOn]));
  const seenAddOns = new Set();
  const lineItems = payload.lineItems.map((line) => ({
    type: "custom",
    label: line.label,
    detail: line.detail || "Custom service",
    quantity: line.quantity,
    unitPricePennies: line.unitPricePennies,
    lineTotalPennies: line.quantity * line.unitPricePennies
  }));

  payload.standardAddOns.forEach(({ key, quantity }) => {
    if (seenAddOns.has(key)) {
      return;
    }

    seenAddOns.add(key);
    const addOn = pricingAddOns.get(key);

    if (!addOn) {
      return;
    }

    lineItems.push({
      type: "standard_add_on",
      key,
      label: addOn.label,
      detail: `${quantity} ${addOn.unit}${quantity === 1 ? "" : "s"} at the Velura standard rate`,
      quantity,
      unitPricePennies: addOn.pricePennies,
      lineTotalPennies: quantity * addOn.pricePennies
    });
  });

  const lineItemsSubtotalPennies = lineItems.reduce((sum, line) => sum + line.lineTotalPennies, 0);
  const breakdown = lineItems.map((line) => ({
    ...line,
    minPricePennies: line.lineTotalPennies,
    maxPricePennies: line.lineTotalPennies,
    displayPrice: formatMoney(line.lineTotalPennies)
  }));

  return {
    quoteInput: {
      source: "manager_custom",
      serviceType: "custom",
      standardAddOns: payload.standardAddOns
    },
    quoteResult: {
      pricingVersion: getPricingMatrix().version,
      isCustom: true,
      serviceType: "custom",
      serviceLabel: payload.serviceTitle,
      propertyLabel: payload.propertySummary,
      customTotalPennies: payload.customTotalPennies,
      lineItemsSubtotalPennies,
      minPricePennies: payload.customTotalPennies,
      maxPricePennies: payload.customTotalPennies,
      displayPrice: formatMoney(payload.customTotalPennies),
      needsInspection: false,
      caveat: "This bespoke quote reflects the reviewed scope. Additional work requested later may be quoted separately.",
      breakdown
    }
  };
}

async function updateCustomQuote(id, updates) {
  if (useFileDatabase()) {
    return fileStore.updateQuoteRequest(id, updates);
  }

  return QuoteRequest.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate("assignedManager", "name email")
    .populate("lastClientContactedBy", "name email");
}

async function deliverManagerCustomQuote(req, quoteRequest) {
  try {
    const emailDelivery = await sendManagerCustomQuoteEmail(quoteRequest);

    if (!emailDelivery?.sent) {
      throw new Error(emailDelivery?.reason || "Custom quote email could not be sent.");
    }

    const quoteSentAt = new Date();
    const updatedQuote = await updateCustomQuote(quoteRequest._id, {
      status: "quoted",
      quoteSentAt,
      deliveryStatus: "sent",
      deliveryError: "",
      ...clientContactUpdates(req, "quote", "waiting_client")
    });

    return { quoteRequest: updatedQuote, emailDelivery };
  } catch (error) {
    const message = String(error?.message || "Custom quote email could not be sent.").slice(0, 500);
    const failedQuote = await updateCustomQuote(quoteRequest._id, {
      status: "reviewing",
      deliveryStatus: "failed",
      deliveryError: message,
      ...ownerUpdates(req, "in_progress")
    });

    const deliveryError = new Error("The custom quote was saved, but the email could not be sent. Check email settings and use Resend quote.");
    deliveryError.statusCode = 502;
    deliveryError.quoteRequest = failedQuote;
    throw deliveryError;
  }
}

export const createManagerCustomQuote = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const calculated = buildManagerCustomQuote(payload);
  const quotePayload = {
    clientName: payload.clientName,
    email: payload.email,
    phone: payload.phone || "",
    address: payload.address || "",
    preferredDate: payload.preferredDate || "",
    preferredTime: payload.preferredTime || "",
    quoteNotes: payload.quoteNotes || "",
    quoteReference: await createQuoteReference(),
    source: "manager_custom",
    status: "reviewing",
    assignedManager: req.user?._id || req.user?.id || null,
    communicationStatus: "in_progress",
    deliveryStatus: "pending",
    ...calculated
  };
  const createdQuote = useFileDatabase()
    ? await fileStore.createQuoteRequest(quotePayload)
    : await QuoteRequest.create(quotePayload);

  let delivery;

  try {
    delivery = await deliverManagerCustomQuote(req, createdQuote);
  } catch (error) {
    await recordAuditEvent(req, {
      action: "quote_request.custom_email_failed",
      resource: "quoteRequest",
      resourceId: createdQuote._id,
      summary: `Custom quote ${createdQuote.quoteReference} was saved but email delivery failed.`,
      metadata: { quoteReference: createdQuote.quoteReference, clientName: createdQuote.clientName, error: error.message }
    });

    return res.status(error.statusCode || 502).json({ message: error.message, quoteRequest: error.quoteRequest || createdQuote });
  }

  await recordAuditEvent(req, {
    action: "quote_request.custom_created_and_sent",
    resource: "quoteRequest",
    resourceId: delivery.quoteRequest._id,
    summary: `Custom quote ${delivery.quoteRequest.quoteReference} created and emailed to ${delivery.quoteRequest.clientName}.`,
    metadata: {
      quoteReference: delivery.quoteRequest.quoteReference,
      clientName: delivery.quoteRequest.clientName,
      email: delivery.quoteRequest.email,
      total: delivery.quoteRequest.quoteResult?.displayPrice,
      emailDelivery: delivery.emailDelivery
    }
  });

  return res.status(201).json(delivery);
});

export const resendManagerCustomQuote = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const quoteRequest = useFileDatabase()
    ? await fileStore.findQuoteRequestById(id)
    : await QuoteRequest.findById(id).populate("assignedManager", "name email").lean();

  if (!quoteRequest) {
    return res.status(404).json({ message: "Quote request not found." });
  }

  if (quoteRequest.source !== "manager_custom") {
    return res.status(400).json({ message: "Only manager-created custom quotes can be sent from this action." });
  }

  if (isOwnedByAnotherManager(quoteRequest, req.user)) {
    return sendOwnershipConflict(res, quoteRequest);
  }

  let delivery;

  try {
    delivery = await deliverManagerCustomQuote(req, quoteRequest);
  } catch (error) {
    return res.status(error.statusCode || 502).json({ message: error.message, quoteRequest: error.quoteRequest || quoteRequest });
  }

  await recordAuditEvent(req, {
    action: "quote_request.custom_resent",
    resource: "quoteRequest",
    resourceId: delivery.quoteRequest._id,
    summary: `Custom quote ${delivery.quoteRequest.quoteReference} emailed again to ${delivery.quoteRequest.clientName}.`,
    metadata: { quoteReference: delivery.quoteRequest.quoteReference, emailDelivery: delivery.emailDelivery }
  });

  return res.json(delivery);
});

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
    const [quoteRequests, deletedQuoteRequests] = await Promise.all([
      fileStore.listQuoteRequests(),
      fileStore.listDeletedQuoteRequests()
    ]);
    return res.json({ quoteRequests, deletedQuoteRequests });
  }

  const [quoteRequests, deletedQuoteRequests] = await Promise.all([
    QuoteRequest.find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("assignedManager", "name email")
      .populate("lastClientContactedBy", "name email")
      .lean(),
    QuoteRequest.find({ deletedAt: { $exists: true, $ne: null } })
      .sort({ deletedAt: -1 })
      .limit(100)
      .populate("deletedBy", "name email")
      .lean()
  ]);
  return res.json({ quoteRequests, deletedQuoteRequests });
});

export const deleteQuoteRequest = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const quoteRequest = useFileDatabase()
    ? await fileStore.softDeleteQuoteRequest(id, req.user?._id || null)
    : await QuoteRequest.findOneAndUpdate(
        { _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
        { $set: { deletedAt: new Date(), deletedBy: req.user?._id || null } },
        { new: true, runValidators: true }
      ).populate("deletedBy", "name email");

  if (!quoteRequest) return res.status(404).json({ message: "Quote request not found." });

  await recordAuditEvent(req, {
    action: "quote_request.deleted",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Quote ${quoteRequest.quoteReference} moved to recently deleted.`,
    metadata: { quoteReference: quoteRequest.quoteReference, clientName: quoteRequest.clientName }
  });
  return res.json({ quoteRequest });
});

export const restoreQuoteRequest = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const quoteRequest = useFileDatabase()
    ? await fileStore.restoreQuoteRequest(id)
    : await QuoteRequest.findOneAndUpdate(
        { _id: id, deletedAt: { $exists: true, $ne: null } },
        { $set: { deletedAt: null, deletedBy: null } },
        { new: true, runValidators: true }
      );

  if (!quoteRequest) return res.status(404).json({ message: "Deleted quote request not found." });

  await recordAuditEvent(req, {
    action: "quote_request.restored",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Quote ${quoteRequest.quoteReference} restored.`,
    metadata: { quoteReference: quoteRequest.quoteReference, clientName: quoteRequest.clientName }
  });
  return res.json({ quoteRequest });
});

export const permanentlyDeleteQuoteRequest = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const quoteRequest = useFileDatabase()
    ? await fileStore.permanentlyDeleteQuoteRequest(id)
    : await QuoteRequest.findOneAndDelete({ _id: id, deletedAt: { $exists: true, $ne: null } });

  if (!quoteRequest) return res.status(404).json({ message: "Deleted quote request not found." });

  await recordAuditEvent(req, {
    action: "quote_request.permanently_deleted",
    resource: "quoteRequest",
    resourceId: quoteRequest._id,
    summary: `Quote ${quoteRequest.quoteReference} permanently deleted.`,
    metadata: { quoteReference: quoteRequest.quoteReference, clientName: quoteRequest.clientName }
  });
  return res.json({ message: "Quote request permanently deleted." });
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
