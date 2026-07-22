import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Lead from "../models/Lead.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { sendLeadNotification } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
    email: z.string().trim().email("Please provide a valid email.").toLowerCase(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    company: z.string().trim().max(120).optional().or(z.literal("")),
    service: z.string().trim().max(120).optional().or(z.literal("")),
    message: z.string().trim().min(10, "Message must be at least 10 characters.").max(2500)
  })
});

export const updateLeadStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(["new", "contacted", "closed"])
  })
});

export const leadIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1)
  })
});

export const createLead = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const lead = useFileDatabase()
    ? await fileStore.createLead(payload)
    : await Lead.create({
        ...payload,
        service: payload.service || "General inquiry"
      });

  const email = await sendLeadNotification(lead);

  await recordAuditEvent(req, {
    action: "inquiry.created",
    resource: "lead",
    resourceId: lead._id,
    summary: `New inquiry from ${lead.name} for ${lead.service}.`,
    metadata: {
      lead: {
        name: lead.name,
        email: lead.email,
        service: lead.service,
        status: lead.status
      },
      emailNotification: email
    }
  });

  return res.status(201).json({ lead, email });
});

export const listLeads = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const [leads, deletedLeads] = await Promise.all([fileStore.listLeads(), fileStore.listDeletedLeads()]);
    return res.json({ leads, deletedLeads });
  }

  const [leads, deletedLeads] = await Promise.all([
    Lead.find({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean(),
    Lead.find({ deletedAt: { $exists: true, $ne: null } })
      .sort({ deletedAt: -1 })
      .limit(100)
      .populate("deletedBy", "name email")
      .lean()
  ]);

  return res.json({ leads, deletedLeads });
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  const activeFilter = { _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
  const before = useFileDatabase() ? await fileStore.findLeadById(id) : await Lead.findOne(activeFilter).lean();
  const lead = useFileDatabase()
    ? await fileStore.updateLeadStatus(id, status)
    : await Lead.findOneAndUpdate(activeFilter, { status }, { new: true, runValidators: true });

  if (!lead) {
    return res.status(404).json({ message: "Lead not found." });
  }

  await recordAuditEvent(req, {
    action: "inquiry.status_updated",
    resource: "lead",
    resourceId: lead._id,
    summary: `Inquiry status changed from ${before?.status || "unknown"} to ${lead.status}.`,
    metadata: {
      before: { status: before?.status },
      after: { status: lead.status }
    }
  });

  return res.json({ lead });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const lead = useFileDatabase()
    ? await fileStore.softDeleteLead(id, req.user?._id || null)
    : await Lead.findOneAndUpdate(
        { _id: id, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
        { $set: { deletedAt: new Date(), deletedBy: req.user?._id || null } },
        { new: true, runValidators: true }
      ).populate("deletedBy", "name email");

  if (!lead) {
    return res.status(404).json({ message: "Inquiry not found." });
  }

  await recordAuditEvent(req, {
    action: "inquiry.deleted",
    resource: "lead",
    resourceId: lead._id,
    summary: `Inquiry moved to recently deleted for ${lead.name}.`,
    metadata: { name: lead.name, email: lead.email, service: lead.service }
  });

  return res.json({ lead });
});

export const restoreLead = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const lead = useFileDatabase()
    ? await fileStore.restoreLead(id)
    : await Lead.findOneAndUpdate(
        { _id: id, deletedAt: { $exists: true, $ne: null } },
        { $set: { deletedAt: null, deletedBy: null } },
        { new: true, runValidators: true }
      );

  if (!lead) {
    return res.status(404).json({ message: "Deleted inquiry not found." });
  }

  await recordAuditEvent(req, {
    action: "inquiry.restored",
    resource: "lead",
    resourceId: lead._id,
    summary: `Inquiry restored for ${lead.name}.`,
    metadata: { name: lead.name, email: lead.email, service: lead.service }
  });

  return res.json({ lead });
});

export const permanentlyDeleteLead = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const lead = useFileDatabase()
    ? await fileStore.permanentlyDeleteLead(id)
    : await Lead.findOneAndDelete({ _id: id, deletedAt: { $exists: true, $ne: null } });

  if (!lead) {
    return res.status(404).json({ message: "Deleted inquiry not found." });
  }

  await recordAuditEvent(req, {
    action: "inquiry.permanently_deleted",
    resource: "lead",
    resourceId: lead._id,
    summary: `Inquiry permanently deleted for ${lead.name}.`,
    metadata: { name: lead.name, email: lead.email, service: lead.service }
  });

  return res.json({ message: "Inquiry permanently deleted." });
});
