import express from "express";
import SinkingFund from "../models/SinkingFund.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// LOAD (ADMIN ONLY)
router.get("/get", protect, authorize(['admin']), async (req, res) => {
  try {
    const data = await SinkingFund.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error loading sinking fund" });
  }
});

// SAVE (ADMIN ONLY)
router.post("/save", protect, authorize(['admin']), async (req, res) => {
  try {
    await SinkingFund.deleteMany({});
    await SinkingFund.insertMany(req.body.table);
    res.json({ message: "Sinking fund saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving sinking fund" });
  }
});

export default router;
