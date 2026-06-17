import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Message from "../models/Message.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isRead: z.boolean()
  })
});

export const listMessages = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const messages = await fileStore.listMessages();
    return res.json({ messages });
  }

  const messages = await Message.find().sort({ createdAt: -1 }).populate("lead", "status service");
  return res.json({ messages });
});

export const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const before = useFileDatabase() ? await fileStore.findMessageById(id) : await Message.findById(id).lean();
  const message = useFileDatabase()
    ? await fileStore.updateMessage(id, { isRead: req.validated.body.isRead })
    : await Message.findByIdAndUpdate(
        id,
        { isRead: req.validated.body.isRead },
        { new: true, runValidators: true }
      ).populate("lead", "status service");

  if (!message) {
    return res.status(404).json({ message: "Message not found." });
  }

  await recordAuditEvent(req, {
    action: "message.read_status_updated",
    resource: "message",
    resourceId: message._id,
    summary: `Message marked as ${message.isRead ? "read" : "unread"}.`,
    metadata: {
      before: { isRead: before?.isRead },
      after: { isRead: message.isRead }
    }
  });

  return res.json({ message });
});
