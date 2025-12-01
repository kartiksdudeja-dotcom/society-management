import express from "express";
import Expense from "../models/Expense.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL EXPENSE (ADMIN ONLY)
router.get("/get", protect, authorize(['admin']), async (req, res) => {
  try {
    const list = await Expense.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error loading expense" });
  }
});

// SAVE (overwrite whole year)
router.post("/save", protect, authorize(['admin']), async (req, res) => {
  try {
    await Expense.deleteMany({});
    await Expense.insertMany(req.body.data);
    res.json({ message: "Expenses saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving expense" });
  }
});

export default router;
