import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
      maxlength: 120
    },
    resource: {
      type: String,
      required: true,
      index: true,
      maxlength: 80
    },
    resourceId: {
      type: String,
      index: true
    },
    summary: {
      type: String,
      required: true,
      maxlength: 300
    },
    actor: {
      id: String,
      name: String,
      email: String,
      role: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: String,
    userAgent: String,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

auditEventSchema.index({ createdAt: -1 });

export default mongoose.model("AuditEvent", auditEventSchema);
