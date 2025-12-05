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

// Dashboard Summary (Admin/Manager)
router.get("/summary", protect, authorize(['admin', 'manager']), getMaintenanceSummary);

// Logged-in user's own maintenance
router.get("/my", protect, getUserMaintenance);

// Admin/Manager: Get all member maintenance
router.get("/all", protect, authorize(['admin', 'manager']), getAllMaintenance);

// Save whole table to MongoDB (Admin/Manager)
router.post("/save", protect, authorize(['admin', 'manager']), saveMaintenance);

// Load table from MongoDB (Admin/Manager)
router.get("/get", protect, authorize(['admin', 'manager']), getMaintenance);

// DEBUG endpoint - check what's in DB
router.get("/debug", getMaintenanceDebug);

// Serve Excel file (Admin/Manager)
router.get("/excel-file", protect, authorize(['admin', 'manager']), getExcelFile);


export default router;
