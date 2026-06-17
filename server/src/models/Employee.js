import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    role: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Cleaner"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    },
    skills: {
      type: [String],
      default: []
    },
    availabilityNotes: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

employeeSchema.index({ name: 1 });

export default mongoose.model("Employee", employeeSchema);
