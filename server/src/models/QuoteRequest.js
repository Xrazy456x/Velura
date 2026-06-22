import mongoose from "mongoose";

const quoteRequestSchema = new mongoose.Schema(
  {
    quoteReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      maxlength: 24
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300
    },
    preferredDate: {
      type: String,
      trim: true,
      maxlength: 40
    },
    preferredTime: {
      type: String,
      trim: true,
      maxlength: 40
    },
    accessInstructions: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    parkingNotes: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    quoteNotes: {
      type: String,
      trim: true,
      maxlength: 1600
    },
    status: {
      type: String,
      enum: ["new", "reviewing", "awaiting_photos", "quoted", "booked", "closed"],
      default: "new",
      index: true
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    communicationStatus: {
      type: String,
      enum: ["new", "in_progress", "waiting_client", "booked", "closed"],
      default: "new",
      index: true
    },
    lastClientContactedAt: {
      type: Date,
      default: null
    },
    lastClientContactedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lastClientContactType: {
      type: String,
      enum: ["email", "sms", "phone", "photo_request", "status_update", ""],
      default: ""
    },
    quoteInput: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    quoteResult: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    photoRequestSentAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

quoteRequestSchema.index({ createdAt: -1 });
quoteRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("QuoteRequest", quoteRequestSchema);
