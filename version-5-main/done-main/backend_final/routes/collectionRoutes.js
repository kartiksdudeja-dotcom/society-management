import express from "express";
import Maintenance from "../models/Maintenance.js";
import Expense from "../models/Expense.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET monthly totals (Apr–Dec)
router.get("/2024", protect, authorize(['admin']), async (req, res) => {
  try {
    const maint = await Maintenance.find();

    const expenseDoc = await Expense.findOne();
    const expense = expenseDoc ? expenseDoc._doc : {};

    const months = [
      "APRIL", "MAY", "JUNE", "JULY", "AUGUST",
      "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    const result = months.map(month => {
      // Normalizing Maintenance Month formats
      const totalMaintenance = maint
        .filter(m => {
          const normalized = (m.month || "")
            .replace(/-2024/i, "")    // remove "-2024"
            .trim()
            .toUpperCase();

          // Convert APR → APRIL
          const mapShort = {
            "APR": "APRIL",
            "MAY": "MAY",
            "JUN": "JUNE",
            "JUL": "JULY",
            "AUG": "AUGUST",
            "SEP": "SEPTEMBER",
            "OCT": "OCTOBER",
            "NOV": "NOVEMBER",
            "DEC": "DECEMBER"
          };

          const finalMonth = mapShort[normalized] || normalized;

          return finalMonth === month;
        })
        .reduce((sum, m) => sum + Number(m.amount_paid || 0), 0);

      // Expense total (already in correct format)
      const totalExpense = expense[month]?.total || 0;

      return {
        month,
        maintenance: totalMaintenance,
        expense: totalExpense,
        profit: totalMaintenance - totalExpense
      };
    });

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error loading collection data" });
  }
});

export default router;
