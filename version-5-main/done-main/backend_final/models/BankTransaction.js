import mongoose from "mongoose";

// Fix Hot Reload double model bug
if (mongoose.models.BankTransaction) {
  mongoose.deleteModel("BankTransaction");
}

const BankTransactionSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      unique: true,
      sparse: true, // allows null without duplicate error
    },

    reference_no: { type: String },
    narration: { type: String },
    name: { type: String },      // Owner name from LearnedMapping
    payerName: { type: String }, // Person who paid (relative/wife etc)
    relationship: { type: String }, // Relationship to owner
    flat: { type: String },      // Unit/Office number from LearnedMapping
    vpa: { type: String },       // VPA/UPI ID extracted from email

    date: { type: Date },

    amount: { type: Number },

    type: {
      type: String,
      enum: ["credit", "debit"],
    },

    closingBalance: { type: Number },
  },
  { timestamps: true, strict: false }
);

// Ensure unique sparse index exists
BankTransactionSchema.index({ messageId: 1 }, { unique: true, sparse: true });

console.log("🔥 Loaded BankTransaction Model:", import.meta.url);

export default mongoose.model("BankTransaction", BankTransactionSchema);
