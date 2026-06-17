import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
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
      trim: true,
      maxlength: 40
    },
    company: {
      type: String,
      trim: true,
      maxlength: 120
    },
    service: {
      type: String,
      trim: true,
      default: "General inquiry",
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2500
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true
    },
    source: {
      type: String,
      default: "website",
      trim: true
    }
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

export default mongoose.model("Lead", leadSchema);
