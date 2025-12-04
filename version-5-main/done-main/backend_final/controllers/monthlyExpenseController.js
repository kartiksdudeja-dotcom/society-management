import MonthlyExpense from "../models/MonthlyExpense.js";
import BankTransaction from "../models/BankTransaction.js";

// Get month-year string from date
function getMonthYear(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(date);
  return `${months[d.getMonth()]}-${d.getFullYear()}`;
}

// Extract expense name from bank narration
function extractExpenseName(narration) {
  if (!narration) return "Unknown Expense";
  
  // Try to extract name after VPA
  const capsMatch = narration.match(/[A-Z][A-Z ]{3,}/g);
  if (capsMatch && capsMatch.length > 0) {
    // Get the longest capital words match (usually the payee name)
    const names = capsMatch.sort((a, b) => b.length - a.length);
    return names[0].trim();
  }
  
  return "Bank Expense";
}

// Get monthly expenses
export const getMonthlyExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ ok: false, message: "Month & year required" });
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthYear = `${months[month - 1]}-${year}`;

    // Get expenses from MonthlyExpense collection
    let expenses = await MonthlyExpense.find({ monthYear }).sort({ date: -1 });

    // If no expenses found, sync from bank debits
    if (expenses.length === 0) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);

      // Get all debit transactions from bank
      const debits = await BankTransaction.find({
        type: "debit",
        date: { $gte: monthStart, $lte: monthEnd }
      });

      // Create expense records for each debit
      for (const debit of debits) {
        const existing = await MonthlyExpense.findOne({ bankTransactionId: debit._id });
        if (!existing) {
          await MonthlyExpense.create({
            bankTransactionId: debit._id,
            date: debit.date,
            monthYear: monthYear,
            originalNarration: debit.narration,
            name: extractExpenseName(debit.narration),
            amount: debit.amount,
            vpa: debit.vpa,
            payeeName: debit.name,
            referenceNo: debit.reference_no,
            source: "bank",
          });
        }
      }

      // Fetch again after sync
      expenses = await MonthlyExpense.find({ monthYear }).sort({ date: -1 });
    }

    // Calculate total
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.json({ ok: true, data: expenses, total, monthYear });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Update expense (edit name, category, etc.)
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, notes, amount } = req.body;

    const expense = await MonthlyExpense.findByIdAndUpdate(
      id,
      { $set: { name, category, notes, amount } },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, data: expense });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Add manual expense
export const addExpense = async (req, res) => {
  try {
    const { date, name, amount, category, notes } = req.body;

    if (!date || !name || !amount) {
      return res.status(400).json({ ok: false, message: "Date, name, and amount required" });
    }

    const expenseDate = new Date(date);
    const monthYear = getMonthYear(expenseDate);

    const expense = await MonthlyExpense.create({
      date: expenseDate,
      monthYear,
      name,
      amount,
      category: category || "other",
      notes,
      source: "manual",
    });

    return res.json({ ok: true, data: expense });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await MonthlyExpense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ ok: false, message: "Expense not found" });
    }

    return res.json({ ok: true, message: "Expense deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Sync expenses from bank debits
export const syncFromBank = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ ok: false, message: "Month & year required" });
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthYear = `${months[month - 1]}-${year}`;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Get all debit transactions from bank
    const debits = await BankTransaction.find({
      type: "debit",
      date: { $gte: monthStart, $lte: monthEnd }
    });

    let synced = 0;
    for (const debit of debits) {
      const existing = await MonthlyExpense.findOne({ bankTransactionId: debit._id });
      if (!existing) {
        await MonthlyExpense.create({
          bankTransactionId: debit._id,
          date: debit.date,
          monthYear: monthYear,
          originalNarration: debit.narration,
          name: extractExpenseName(debit.narration),
          amount: debit.amount,
          vpa: debit.vpa,
          payeeName: debit.name,
          referenceNo: debit.reference_no,
          source: "bank",
        });
        synced++;
      }
    }

    return res.json({ ok: true, message: `Synced ${synced} new expenses from bank` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Get expense summary for dashboard
export const getExpenseSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ ok: false, message: "Month & year required" });
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthYear = `${months[month - 1]}-${year}`;

    // First sync from bank
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const debits = await BankTransaction.find({
      type: "debit",
      date: { $gte: monthStart, $lte: monthEnd }
    });

    for (const debit of debits) {
      const existing = await MonthlyExpense.findOne({ bankTransactionId: debit._id });
      if (!existing) {
        await MonthlyExpense.create({
          bankTransactionId: debit._id,
          date: debit.date,
          monthYear: monthYear,
          originalNarration: debit.narration,
          name: extractExpenseName(debit.narration),
          amount: debit.amount,
          vpa: debit.vpa,
          payeeName: debit.name,
          referenceNo: debit.reference_no,
          source: "bank",
        });
      }
    }

    // Get expenses
    const expenses = await MonthlyExpense.find({ monthYear }).sort({ date: -1 });
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.json({
      ok: true,
      monthYear,
      total,
      count: expenses.length,
      expenses: expenses.slice(0, 5) // Top 5 for dashboard
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
