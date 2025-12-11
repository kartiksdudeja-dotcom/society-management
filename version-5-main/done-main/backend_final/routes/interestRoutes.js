import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Interest from "../models/Interest.js";
import { getTotalInterest } from "../services/paymentProcessor.js";

const router = express.Router();

// Get all interest payments
router.get("/", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { year } = req.query;
    const yearStr = year || new Date().getFullYear().toString();
    
    const result = await getTotalInterest(yearStr);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Get interest error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get interest by flat
router.get("/flat/:flat", protect, async (req, res) => {
  try {
    const { flat } = req.params;
    const { year } = req.query;
    const yearStr = year || new Date().getFullYear().toString();
    
    const interests = await Interest.find({
      flat,
      monthYear: new RegExp(yearStr)
    }).sort({ date: -1 });
    
    const total = interests.reduce((sum, i) => sum + i.amount, 0);
    
    res.json({
      success: true,
      data: {
        total,
        count: interests.length,
        interests
      }
    });
  } catch (error) {
    console.error("Get flat interest error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
