import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getMaintenanceSummary,
  getUserMaintenance,
  getAllMaintenance,
  saveMaintenance,
  getMaintenance,
  getExcelFile,
  getMaintenanceDebug
} from "../controllers/maintenanceController.js";

const router = express.Router();


// MAINTENANCE ROUTES (Protected)

// Dashboard Summary (Admin Only)
router.get("/summary", protect, authorize(['admin']), getMaintenanceSummary);

// Logged-in user's own maintenance
router.get("/my", protect, getUserMaintenance);

// Admin: Get all member maintenance
router.get("/all", protect, authorize(['admin']), getAllMaintenance);

// Save whole table to MongoDB (Admin Only)
router.post("/save", protect, authorize(['admin']), saveMaintenance);

// Load table from MongoDB (Admin Only)
router.get("/get", protect, authorize(['admin']), getMaintenance);

// DEBUG endpoint - check what's in DB
router.get("/debug", getMaintenanceDebug);

// Serve Excel file (Admin Only)
router.get("/excel-file", protect, authorize(['admin']), getExcelFile);


export default router;
