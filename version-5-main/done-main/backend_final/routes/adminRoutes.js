import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getMembers,
  updateUser,
  deleteUser,
  getAdminSummary,
  createUser,
  updateUserPassword
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard Summary
router.get("/summary", protect, authorize(['admin', 'manager']), getAdminSummary);

// All Users List
router.get("/members",  getMembers);

// Create New User
router.post("/create-user", protect, authorize(['admin', 'manager']), createUser);

// Update User
router.put("/update-user/:id", protect, authorize(['admin', 'manager']), updateUser);

// Update User Password
router.put("/update-password/:id", protect, authorize(['admin', 'manager']), updateUserPassword);

// Delete User
router.delete("/delete-user/:id", protect, authorize(['admin', 'manager']), deleteUser);

export default router;
