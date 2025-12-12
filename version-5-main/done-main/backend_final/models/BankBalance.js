import mongoose from "mongoose";

// Fix Hot Reload double model bug
if (mongoose.models.BankBalance) {
  mongoose.deleteModel("BankBalance");
}

const BankBalanceSchema = new mongoose.Schema(
  {
    // Bank account ending digits (e.g., "3306")
    accountEnding: {
      type: String,
      required: true,
    },

    // Current balance amount
    balance: {
      type: Number,
      required: true,
    },

    // Currency (e.g., "INR")
    currency: {
      type: String,
      default: "INR",
    },

    // Date when balance was fetched from bank
    balanceDate: {
      type: Date,
      required: true,
    },

    // Raw narration/email content (for reference)
    narration: {
      type: String,
    },

    // Source (e.g., "HDFC", "ICICI")
    bank: {
      type: String,
      default: "HDFC",
    },

    // Message ID from Gmail (to avoid duplicates)
    messageId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Index to find latest balance
BankBalanceSchema.index({ balanceDate: -1 });
BankBalanceSchema.index({ messageId: 1 });

export default mongoose.model("BankBalance", BankBalanceSchema);
