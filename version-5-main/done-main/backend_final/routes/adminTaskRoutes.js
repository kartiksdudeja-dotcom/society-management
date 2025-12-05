import express from "express";
import AdminTask from "../models/AdminTask.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all admin tasks (Admin/Manager only)
router.get("/", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const tasks = await AdminTask.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching admin tasks:", err);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// CREATE new admin task
router.post("/", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const task = new AdminTask({
      title,
      description: description || "",
      status: "pending",
      createdBy: req.user._id,
      createdByName: req.user.name || req.user.email
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating admin task:", err);
    res.status(500).json({ message: "Error creating task" });
  }
});

// UPDATE admin task status
router.put("/:id", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description } = req.body;
    
    const task = await AdminTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Build changes string for history
    const changes = [];
    if (status && status !== task.status) {
      changes.push(`Status: ${task.status} → ${status}`);
    }
    if (title && title !== task.title) {
      changes.push(`Title updated`);
    }
    if (description !== undefined && description !== task.description) {
      changes.push(`Description updated`);
    }
    
    // Add to edit history
    if (changes.length > 0) {
      task.editHistory.push({
        editedBy: req.user._id,
        editedByName: req.user.name || req.user.email,
        editedAt: new Date(),
        changes: changes.join(", ")
      });
    }
    
    // Update fields
    if (status) task.status = status;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    
    if (status === "done") {
      task.completedAt = new Date();
    } else if (status === "pending" || status === "in-progress") {
      task.completedAt = null;
    }
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error("Error updating admin task:", err);
    res.status(500).json({ message: "Error updating task" });
  }
});

// DELETE admin task
router.delete("/:id", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await AdminTask.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting admin task:", err);
    res.status(500).json({ message: "Error deleting task" });
  }
});

// GET task history
router.get("/:id/history", protect, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const task = await AdminTask.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json(task.editHistory);
  } catch (err) {
    console.error("Error fetching task history:", err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
