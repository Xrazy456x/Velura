import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

export default mongoose.model("Message", messageSchema);
