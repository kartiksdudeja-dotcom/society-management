import express from "express";
import {
  getMonthlyExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
  syncFromBank,
  getExpenseSummary,
} from "../controllers/monthlyExpenseController.js";

const router = express.Router();

// GET /api/monthly-expense?month=12&year=2025
router.get("/", getMonthlyExpenses);

// GET /api/monthly-expense/summary?month=12&year=2025
router.get("/summary", getExpenseSummary);

// POST /api/monthly-expense/sync?month=12&year=2025
router.post("/sync", syncFromBank);

// POST /api/monthly-expense (add manual expense)
router.post("/add", addExpense);

// PUT /api/monthly-expense/:id (update expense)
router.put("/:id", updateExpense);

// DELETE /api/monthly-expense/:id
router.delete("/:id", deleteExpense);

export default router;
