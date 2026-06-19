import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Booking from "../models/Booking.js";
import Counter from "../models/Counter.js";
import Employee from "../models/Employee.js";
import Lead from "../models/Lead.js";
import { recordAuditEvent } from "../services/auditService.js";
import {
  sendBookingConfirmation,
  sendBookingSmsConfirmation,
  sendBookingSmsStatusUpdate,
  sendBookingStatusUpdate,
  sendBookingTeamNotification
} from "../services/emailService.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const bookingStatuses = ["scheduled", "confirmed", "completed", "cancelled"];

function bookingNumberYear(value = new Date()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

async function createBookingNumber(scheduledFor) {
  const year = bookingNumberYear(scheduledFor);

  if (useFileDatabase()) {
    return fileStore.nextBookingNumber(year);
  }

  const counter = await Counter.findOneAndUpdate(
    { key: `bookings:${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `VEL-${year}-${String(counter.seq).padStart(4, "0")}`;
}

const bookingBodySchema = z.object({
  leadId: z.string().trim().optional().or(z.literal("")),
  clientName: z.string().trim().min(2, "Client name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
  phone: z.string().trim().min(5, "Phone number is required for booking confirmation.").max(40),
  service: z.string().trim().min(2, "Service is required.").max(120),
  address: z.string().trim().min(5, "Address is required.").max(300),
  scheduledFor: z.string().trim().min(1, "Booking date and time is required.").refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    "Please provide a valid booking date and time."
  ),
  durationMinutes: z.coerce.number().int().min(30).max(720).default(120),
  communicationPreference: z.enum(["email", "sms", "phone"]).default("email"),
  assignedEmployeeIds: z.array(z.string().trim().min(1)).default([]),
  accessInstructions: z.string().trim().max(1200).optional().or(z.literal("")),
  parkingNotes: z.string().trim().max(1200).optional().or(z.literal("")),
  notes: z.string().trim().max(1200).optional().or(z.literal("")),
  sendConfirmation: z.boolean().optional().default(true)
});

export const createBookingSchema = z.object({
  body: bookingBodySchema
});

export const updateBookingSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: bookingBodySchema.omit({ sendConfirmation: true })
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(bookingStatuses),
    sendClientUpdate: z.boolean().optional().default(true)
  })
});

export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const markPhoneConfirmationSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    detail: z.string().trim().max(300).optional().or(z.literal(""))
  })
});

function buildCommunicationLog(channel, type, result) {
  return {
    channel,
    type,
    status: result?.status || (result?.sent ? "sent" : "skipped"),
    detail: result?.sent ? "Message sent successfully." : result?.reason || "Message was not sent.",
    sentAt: new Date()
  };
}

async function attemptClientCommunication(sender) {
  try {
    return await sender();
  } catch (error) {
    console.error("Booking communication failed:", error);
    return { sent: false, status: "failed", reason: "Communication failed. Check email/SMS settings." };
  }
}

async function attemptTeamNotification(booking, eventLabel) {
  try {
    return await sendBookingTeamNotification(booking, eventLabel);
  } catch (error) {
    console.error("Internal booking notification failed:", error);
    return { sent: false, status: "failed", reason: "Internal email failed. Check email provider settings." };
  }
}

async function findLead(leadId) {
  if (!leadId) {
    return null;
  }

  return useFileDatabase() ? fileStore.findLeadById(leadId) : Lead.findById(leadId).lean();
}

async function findEmployees(employeeIds = []) {
  if (!employeeIds.length) {
    return [];
  }

  if (useFileDatabase()) {
    const employees = await Promise.all(employeeIds.map((id) => fileStore.findEmployeeById(id)));
    return employees.filter(Boolean);
  }

  return Employee.find({ _id: { $in: employeeIds } }).lean();
}

async function findBooking(id) {
  return useFileDatabase() ? fileStore.findBookingById(id) : Booking.findById(id).lean();
}

function isDeletedBooking(booking) {
  return Boolean(booking?.deletedAt);
}

async function updateBookingRecord(id, updates) {
  if (useFileDatabase()) {
    return fileStore.updateBooking(id, updates);
  }

  return Booking.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate("lead", "status service name email phone company message")
    .populate("assignedEmployees", "name email phone role status")
    .populate("createdBy", "name email");
}

function normalizeBookingPayload(payload, req, lead, employees = []) {
  return {
    lead: lead?._id || null,
    bookingNumber: payload.bookingNumber,
    clientName: payload.clientName,
    email: payload.email,
    phone: payload.phone,
    service: payload.service,
    address: payload.address,
    scheduledFor: new Date(payload.scheduledFor),
    durationMinutes: payload.durationMinutes,
    status: "scheduled",
    communicationPreference: payload.communicationPreference,
    assignedEmployees: employees.map((employee) => employee._id),
    accessInstructions: payload.accessInstructions || "",
    parkingNotes: payload.parkingNotes || "",
    notes: payload.notes || "",
    communicationLog: [],
    createdBy: req.user?._id,
    leadSnapshot: lead
      ? {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          service: lead.service,
          status: lead.status
        }
      : null
  };
}

function normalizeBookingUpdates(payload, lead, employees = []) {
  return {
    lead: lead?._id || null,
    clientName: payload.clientName,
    email: payload.email,
    phone: payload.phone,
    service: payload.service,
    address: payload.address,
    scheduledFor: new Date(payload.scheduledFor),
    durationMinutes: payload.durationMinutes,
    communicationPreference: payload.communicationPreference,
    assignedEmployees: employees.map((employee) => employee._id),
    accessInstructions: payload.accessInstructions || "",
    parkingNotes: payload.parkingNotes || "",
    notes: payload.notes || "",
    leadSnapshot: lead
      ? {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          service: lead.service,
          status: lead.status
        }
      : null
  };
}

async function persistCommunicationLog(booking, logEntry) {
  const communicationLog = [...(booking.communicationLog || []), logEntry];

  if (useFileDatabase()) {
    return fileStore.updateBooking(booking._id, { communicationLog });
  }

  return Booking.findByIdAndUpdate(booking._id, { communicationLog }, { new: true, runValidators: true })
    .populate("lead", "status service name email phone company message")
    .populate("assignedEmployees", "name email phone role status")
    .populate("createdBy", "name email");
}

export const createBooking = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const lead = await findLead(payload.leadId);

  if (payload.leadId && !lead) {
    return res.status(404).json({ message: "Linked inquiry was not found." });
  }

  const employees = await findEmployees(payload.assignedEmployeeIds);

  if (employees.length !== payload.assignedEmployeeIds.length) {
    return res.status(404).json({ message: "One or more assigned cleaners could not be found." });
  }

  const bookingPayload = normalizeBookingPayload(
    {
      ...payload,
      bookingNumber: await createBookingNumber(payload.scheduledFor)
    },
    req,
    lead,
    employees
  );
  let booking = useFileDatabase() ? await fileStore.createBooking(bookingPayload) : await Booking.create(bookingPayload);
  let clientCommunication = { sent: false, reason: "Client confirmation not requested" };

  if (payload.sendConfirmation && payload.communicationPreference === "email") {
    clientCommunication = await attemptClientCommunication(() => sendBookingConfirmation(booking));
    booking = await persistCommunicationLog(booking, buildCommunicationLog("email", "booking_confirmation", clientCommunication));
  } else if (payload.sendConfirmation && payload.communicationPreference === "sms") {
    clientCommunication = await attemptClientCommunication(() => sendBookingSmsConfirmation(booking));
    booking = await persistCommunicationLog(booking, buildCommunicationLog("sms", "booking_confirmation", clientCommunication));
  } else if (payload.sendConfirmation && payload.communicationPreference === "phone") {
    clientCommunication = { sent: false, reason: "Phone call selected for manual follow-up" };
    booking = await persistCommunicationLog(
      booking,
      buildCommunicationLog(payload.communicationPreference, "booking_confirmation", clientCommunication)
    );
  }

  const teamNotification = await attemptTeamNotification(booking, "created");
  booking = await persistCommunicationLog(
    booking,
    buildCommunicationLog("internal", "booking_created_notification", teamNotification)
  );

  await recordAuditEvent(req, {
    action: "booking.created",
    resource: "booking",
    resourceId: booking._id,
    summary: `Booking created for ${booking.clientName} on ${new Date(booking.scheduledFor).toLocaleString("en-GB")}.`,
    metadata: {
      booking: {
        bookingNumber: booking.bookingNumber,
        clientName: booking.clientName,
        email: booking.email,
        service: booking.service,
        status: booking.status,
        scheduledFor: booking.scheduledFor
      },
      clientCommunication,
      teamNotification
    }
  });

  return res.status(201).json({ booking, clientCommunication });
});

export const listBookings = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const bookings = await fileStore.listBookings();
    return res.json({ bookings });
  }

  const bookings = await Booking.find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] })
    .sort({ scheduledFor: 1, createdAt: -1 })
    .populate("lead", "status service name email phone company message")
    .populate("assignedEmployees", "name email phone role status")
    .populate("createdBy", "name email");

  return res.json({ bookings });
});

export const listDeletedBookings = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const bookings = await fileStore.listDeletedBookings();
    return res.json({ bookings });
  }

  const bookings = await Booking.find({ deletedAt: { $exists: true, $ne: null } })
    .sort({ deletedAt: -1 })
    .limit(50)
    .populate("lead", "status service name email phone company message")
    .populate("assignedEmployees", "name email phone role status")
    .populate("createdBy", "name email")
    .populate("deletedBy", "name email");

  return res.json({ bookings });
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const booking = useFileDatabase()
    ? await fileStore.softDeleteBooking(id, req.user?._id || null)
    : await Booking.findOneAndUpdate(
        { _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
        { deletedAt: new Date(), deletedBy: req.user?._id || null },
        { new: true, runValidators: true }
      )
        .populate("lead", "status service name email phone company message")
        .populate("assignedEmployees", "name email phone role status")
        .populate("createdBy", "name email")
        .populate("deletedBy", "name email");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  await recordAuditEvent(req, {
    action: "booking.deleted",
    resource: "booking",
    resourceId: booking._id,
    summary: `Booking moved to recently deleted for ${booking.clientName}.`,
    metadata: { booking }
  });

  return res.json({ booking });
});

export const restoreBooking = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const booking = useFileDatabase()
    ? await fileStore.restoreBooking(id)
    : await Booking.findOneAndUpdate(
        { _id: id, deletedAt: { $exists: true, $ne: null } },
        { deletedAt: null, deletedBy: null },
        { new: true, runValidators: true }
      )
        .populate("lead", "status service name email phone company message")
        .populate("assignedEmployees", "name email phone role status")
        .populate("createdBy", "name email");

  if (!booking) {
    return res.status(404).json({ message: "Deleted booking not found." });
  }

  await recordAuditEvent(req, {
    action: "booking.restored",
    resource: "booking",
    resourceId: booking._id,
    summary: `Booking restored for ${booking.clientName}.`,
    metadata: { booking }
  });

  return res.json({ booking });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const payload = req.validated.body;
  const before = await findBooking(id);

  if (!before || isDeletedBooking(before)) {
    return res.status(404).json({ message: "Booking not found." });
  }

  const lead = await findLead(payload.leadId);

  if (payload.leadId && !lead) {
    return res.status(404).json({ message: "Linked inquiry was not found." });
  }

  const employees = await findEmployees(payload.assignedEmployeeIds);

  if (employees.length !== payload.assignedEmployeeIds.length) {
    return res.status(404).json({ message: "One or more assigned cleaners could not be found." });
  }

  let booking = await updateBookingRecord(id, normalizeBookingUpdates(payload, lead, employees));
  const teamNotification = await attemptTeamNotification(booking, "updated");
  booking = await persistCommunicationLog(
    booking,
    buildCommunicationLog("internal", "booking_updated_notification", teamNotification)
  );

  await recordAuditEvent(req, {
    action: "booking.updated",
    resource: "booking",
    resourceId: booking._id,
    summary: `Booking updated for ${booking.clientName}.`,
    metadata: {
      before: {
        clientName: before.clientName,
        email: before.email,
        phone: before.phone,
        service: before.service,
        address: before.address,
        scheduledFor: before.scheduledFor,
        durationMinutes: before.durationMinutes,
        communicationPreference: before.communicationPreference,
        assignedEmployees: before.assignedEmployees,
        accessInstructions: before.accessInstructions,
        parkingNotes: before.parkingNotes,
        notes: before.notes
      },
      after: {
        clientName: booking.clientName,
        email: booking.email,
        phone: booking.phone,
        service: booking.service,
        address: booking.address,
        scheduledFor: booking.scheduledFor,
        durationMinutes: booking.durationMinutes,
        communicationPreference: booking.communicationPreference,
        assignedEmployees: booking.assignedEmployees,
        accessInstructions: booking.accessInstructions,
        parkingNotes: booking.parkingNotes,
        notes: booking.notes
      },
      teamNotification
    }
  });

  return res.json({ booking, teamNotification });
});

export const sendBookingEmailConfirmation = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  let booking = await findBooking(id);

  if (!booking || isDeletedBooking(booking)) {
    return res.status(404).json({ message: "Booking not found." });
  }

  const clientCommunication = await attemptClientCommunication(() => sendBookingConfirmation(booking));
  booking = await persistCommunicationLog(
    booking,
    buildCommunicationLog("email", "booking_confirmation", clientCommunication)
  );

  await recordAuditEvent(req, {
    action: "booking.email_confirmation_sent",
    resource: "booking",
    resourceId: booking._id,
    summary: `Email confirmation requested for ${booking.clientName}.`,
    metadata: {
      clientCommunication
    }
  });

  return res.json({ booking, clientCommunication });
});

export const markBookingPhoneConfirmed = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const detail = req.validated.body.detail || "Phone confirmation completed by manager.";
  const before = await findBooking(id);

  if (!before || isDeletedBooking(before)) {
    return res.status(404).json({ message: "Booking not found." });
  }

  let booking = await updateBookingRecord(id, { status: "confirmed" });
  const clientCommunication = {
    sent: false,
    status: "completed",
    reason: detail
  };
  booking = await persistCommunicationLog(
    booking,
    buildCommunicationLog("phone", "phone_confirmation", clientCommunication)
  );

  await recordAuditEvent(req, {
    action: "booking.phone_confirmed",
    resource: "booking",
    resourceId: booking._id,
    summary: `Phone confirmation recorded for ${booking.clientName}.`,
    metadata: {
      before: { status: before.status },
      after: { status: booking.status },
      clientCommunication
    }
  });

  return res.json({ booking, clientCommunication });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status, sendClientUpdate } = req.validated.body;
  const before = useFileDatabase() ? await fileStore.findBookingById(id) : await Booking.findById(id).lean();

  if (!before || isDeletedBooking(before)) {
    return res.status(404).json({ message: "Booking not found." });
  }

  let booking = useFileDatabase()
    ? await fileStore.updateBooking(id, { status })
    : await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
        .populate("lead", "status service name email phone company message")
        .populate("assignedEmployees", "name email phone role status")
        .populate("createdBy", "name email");

  let clientCommunication = { sent: false, reason: "Client update not requested" };

  if (sendClientUpdate && booking.communicationPreference === "email") {
    clientCommunication = await attemptClientCommunication(() => sendBookingStatusUpdate(booking, before.status));
    booking = await persistCommunicationLog(booking, buildCommunicationLog("email", "booking_status_update", clientCommunication));
  } else if (sendClientUpdate && booking.communicationPreference === "sms") {
    clientCommunication = await attemptClientCommunication(() => sendBookingSmsStatusUpdate(booking, before.status));
    booking = await persistCommunicationLog(booking, buildCommunicationLog("sms", "booking_status_update", clientCommunication));
  } else if (sendClientUpdate && booking.communicationPreference === "phone") {
    clientCommunication = { sent: false, reason: "Phone call selected for manual follow-up" };
    booking = await persistCommunicationLog(
      booking,
      buildCommunicationLog(booking.communicationPreference, "booking_status_update", clientCommunication)
    );
  }

  await recordAuditEvent(req, {
    action: "booking.status_updated",
    resource: "booking",
    resourceId: booking._id,
    summary: `Booking status changed from ${before.status} to ${booking.status}.`,
    metadata: {
      before: { status: before.status },
      after: { status: booking.status },
      clientCommunication
    }
  });

  return res.json({ booking, clientCommunication });
});
