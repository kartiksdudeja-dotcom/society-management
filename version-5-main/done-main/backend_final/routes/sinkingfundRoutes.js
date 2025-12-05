import express from "express";
import SinkingFund from "../models/SinkingFund.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// LOAD (ADMIN/MANAGER)
router.get("/get", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const data = await SinkingFund.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error loading sinking fund" });
  }
});

// SAVE (ADMIN/MANAGER)
router.post("/save", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    await SinkingFund.deleteMany({});
    await SinkingFund.insertMany(req.body.table);
    res.json({ message: "Sinking fund saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving sinking fund" });
  }
});

// UPDATE SINGLE RECORD (ADMIN/MANAGER)
router.put("/update/:id", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, pending } = req.body;
    
    const updated = await SinkingFund.findByIdAndUpdate(
      id,
      { paid, pending },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    res.json({ message: "Record updated successfully", data: updated });
  } catch (err) {
    console.error("Error updating sinking fund record:", err);
    res.status(500).json({ message: "Error updating record" });
  }
});

export default router;
