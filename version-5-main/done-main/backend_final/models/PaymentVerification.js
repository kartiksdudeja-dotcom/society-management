import mongoose from "mongoose";

// Fix Hot Reload double model bug
if (mongoose.models.PaymentVerification) {
  mongoose.deleteModel("PaymentVerification");
}

const PaymentVerificationSchema = new mongoose.Schema(
  {
    // User who submitted proof
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unit/Flat number
    flat: {
      type: String,
      required: true,
      index: true,
    },

    // Owner name
    ownerName: {
      type: String,
      required: true,
    },

    // Amount paid
    amount: {
      type: Number,
      required: true,
    },

    // Payment month (e.g., "Dec-2025")
    monthYear: {
      type: String,
      required: true,
      index: true,
    },

    // Payment proof image URL (Firebase Storage)
    proofImageUrl: {
      type: String,
      required: true,
    },

    // Payment details from screenshot (extracted by user)
    paymentDetails: {
      transactionId: String,
      paymentMode: String, // NEFT, UPI, etc.
      paymentDate: String,
      remarks: String,
    },

    // Status: pending, approved, rejected
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // Manager review info
    approvedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      email: String,
      approvedAt: Date,
    },

    // Rejection reason if rejected
    rejectionReason: String,

    // Associated bank transaction (if auto-matched)
    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankTransaction",
    },

    // Submission timestamp
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

console.log("🔥 Loaded PaymentVerification Model");

export default mongoose.model("PaymentVerification", PaymentVerificationSchema);
