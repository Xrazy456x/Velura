import mongoose from "mongoose";

const invoiceLineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    vatRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    vatAmount: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 24,
      index: true
    },
    bookingReference: {
      type: String,
      trim: true,
      maxlength: 24
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "void"],
      default: "draft",
      index: true
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
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    billingAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    bookingDate: Date,
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    currency: {
      type: String,
      default: "GBP",
      uppercase: true,
      trim: true,
      maxlength: 3
    },
    lineItems: {
      type: [invoiceLineItemSchema],
      default: []
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    vatTotal: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentInstructions: {
      type: String,
      trim: true,
      maxlength: 1200
    },
    notes: {
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

invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ bookingReference: 1 });

export default mongoose.model("Invoice", invoiceSchema);
