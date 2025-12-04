import mongoose from "mongoose";

const MonthlyExpenseSchema = new mongoose.Schema(
  {
    // Link to bank transaction if from bank
    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankTransaction",
    },
    
    // Date of expense
    date: {
      type: Date,
      required: true,
    },
    
    // Month-Year for easy filtering (e.g., "Dec-2025")
    monthYear: {
      type: String,
      required: true,
    },
    
    // Original narration from bank (for reference)
    originalNarration: {
      type: String,
    },
    
    // Expense name (editable - e.g., "Pest Control")
    name: {
      type: String,
      required: true,
    },
    
    // Category (optional)
    category: {
      type: String,
      enum: ["maintenance", "repairs", "utilities", "salary", "cleaning", "security", "pest-control", "gardening", "other"],
      default: "other",
    },
    
    // Amount
    amount: {
      type: Number,
      required: true,
    },
    
    // VPA/payee info
    vpa: {
      type: String,
    },
    
    payeeName: {
      type: String,
    },
    
    // Reference number
    referenceNo: {
      type: String,
    },
    
    // Source: "bank" (auto from bank debit) or "manual" (manually added)
    source: {
      type: String,
      enum: ["bank", "manual"],
      default: "bank",
    },
    
    // Notes
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
MonthlyExpenseSchema.index({ monthYear: 1 });
MonthlyExpenseSchema.index({ date: -1 });
MonthlyExpenseSchema.index({ bankTransactionId: 1 });

export default mongoose.model("MonthlyExpense", MonthlyExpenseSchema);
