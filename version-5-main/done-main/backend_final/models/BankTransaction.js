import mongoose from "mongoose";

// Fix Hot Reload double model bug
if (mongoose.models.BankTransaction) {
  mongoose.deleteModel("BankTransaction");
}

const BankTransactionSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      index: true,
      unique: true,
      sparse: true, // allows null without duplicate error
    },

    reference_no: { type: String },
    narration: { type: String },

    date: { type: Date },

    amount: { type: Number },

    type: {
      type: String,
      enum: ["credit", "debit"],
    },

    closingBalance: { type: Number },
  },
  { timestamps: true, strict: true }
);

// Ensure unique sparse index exists
BankTransactionSchema.index({ messageId: 1 }, { unique: true, sparse: true });

console.log("🔥 Loaded BankTransaction Model:", import.meta.url);

export default mongoose.model("BankTransaction", BankTransactionSchema);
