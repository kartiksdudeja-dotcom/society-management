import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  APRIL: {
    items: [
      {
        sl_no: Number,
        date: String,
        name: String,
        amount: Number
      }
    ],
    total: Number
  }
});

export default mongoose.model("Expense", ExpenseSchema);
