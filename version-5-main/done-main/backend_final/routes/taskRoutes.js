import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getMyTasks,
  getTaskStats,
  upload,
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes - any logged in user can report problems
router.post("/create", upload.single("image"), createTask);
router.get("/my-tasks", getMyTasks);

// Get all tasks (accessible to all, but admins see all, users see their own)
router.get("/all", getAllTasks);
router.get("/stats", getTaskStats);
router.get("/:id", getTaskById);

// Admin only routes
router.put("/status/:id", updateTaskStatus);
router.put("/:id", upload.single("image"), updateTask);
router.delete("/:id", deleteTask);

export default router;
