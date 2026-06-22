import mongoose from "mongoose";

const communicationLogSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["email", "sms", "phone", "internal"],
      default: "email"
    },
    type: {
      type: String,
      trim: true,
      maxlength: 80
    },
    status: {
      type: String,
      enum: ["sent", "skipped", "failed", "completed"],
      default: "skipped"
    },
    detail: {
      type: String,
      trim: true,
      maxlength: 300
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true
    },
    bookingNumber: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true,
      maxlength: 20
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      index: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      min: 30,
      max: 720,
      default: 120
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
      index: true
    },
    communicationPreference: {
      type: String,
      enum: ["email", "sms", "phone"],
      default: "email"
    },
    assignedEmployees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee"
        }
      ],
      default: []
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
    notes: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    communicationLog: {
      type: [communicationLogSchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, scheduledFor: 1 });
bookingSchema.index({ bookingNumber: 1, deletedAt: 1 });

export default mongoose.model("Booking", bookingSchema);
