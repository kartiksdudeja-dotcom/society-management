import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getMembers,
  updateUser,
  deleteUser,
  getAdminSummary
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard Summary
router.get("/summary", protect, authorize(['admin']), getAdminSummary);

// All Users List
router.get("/members",  getMembers);

// Update User
router.put("/update-user/:id", protect, authorize(['admin']), updateUser);

// Delete User
router.delete("/delete-user/:id", protect, authorize(['admin']), deleteUser);

export default router;
