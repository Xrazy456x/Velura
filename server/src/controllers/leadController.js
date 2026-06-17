import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Lead from "../models/Lead.js";
import Message from "../models/Message.js";
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

export const createLead = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const lead = useFileDatabase()
    ? await fileStore.createLead(payload)
    : await Lead.create({
        ...payload,
        service: payload.service || "General inquiry"
      });

  const messagePayload = {
    lead: lead._id,
    name: lead.name,
    email: lead.email,
    subject: lead.service,
    body: lead.message
  };
  const message = useFileDatabase() ? await fileStore.createMessage(messagePayload) : await Message.create(messagePayload);

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

  return res.status(201).json({ lead, message, email });
});

export const listLeads = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const leads = await fileStore.listLeads();
    return res.json({ leads });
  }

  const leads = await Lead.find().sort({ createdAt: -1 });
  return res.json({ leads });
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;
  const before = useFileDatabase() ? await fileStore.findLeadById(id) : await Lead.findById(id).lean();
  const lead = useFileDatabase()
    ? await fileStore.updateLeadStatus(id, status)
    : await Lead.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

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
