import Task from "../models/Task.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/tasks");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "task-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Create a new task/problem
export const createTask = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const user = req.user;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Get image URL if uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/tasks/${req.file.filename}`;
    }

    const task = new Task({
      title,
      description: description || "",
      imageUrl,
      category: category || "problem",
      priority: priority || "medium",
      status: "pending",
      createdBy: user._id,
      createdByName: user.name,
      createdByUnit: user.unit || user.office || "",
      statusHistory: [
        {
          status: "pending",
          updatedAt: new Date(),
          updatedBy: user._id,
          note: "Task created",
        },
      ],
    });

    await task.save();

    res.status(201).json({
      message: "Problem reported successfully",
      task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
};

// Get all tasks (with filters)
export const getAllTasks = async (req, res) => {
  try {
    const { status, category, createdBy, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (status && status !== "all") {
      query.status = status;
    }
    if (category && category !== "all") {
      query.category = category;
    }
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name email unit office")
        .populate("completedBy", "name email")
        .lean(),
      Task.countDocuments(query),
    ]);

    // Get counts by status
    const [pendingCount, inProgressCount, completedCount] = await Promise.all([
      Task.countDocuments({ status: "pending" }),
      Task.countDocuments({ status: "in-progress" }),
      Task.countDocuments({ status: "completed" }),
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      counts: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        total: pendingCount + inProgressCount + completedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id)
      .populate("createdBy", "name email unit office")
      .populate("completedBy", "name email")
      .populate("statusHistory.updatedBy", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Error fetching task", error: error.message });
  }
};

// Update task status (Admin only)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, completedAt } = req.body;
    const user = req.user;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update status
    task.status = status;
    
    // Add to status history
    task.statusHistory.push({
      status,
      updatedAt: completedAt ? new Date(completedAt) : new Date(),
      updatedBy: user._id,
      note: note || `Status changed to ${status}`,
    });

    // If completed, set completion details
    if (status === "completed") {
      task.completedAt = completedAt ? new Date(completedAt) : new Date();
      task.completedBy = user._id;
      task.completionNote = note || "";
    } else {
      // If reopening, clear completion details
      task.completedAt = null;
      task.completedBy = null;
      task.completionNote = null;
    }

    await task.save();

    res.json({
      message: `Task marked as ${status}`,
      task,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Error updating task status", error: error.message });
  }
};

// Update task details
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority } = req.body;
    const user = req.user;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (category) task.category = category;
    if (priority) task.priority = priority;

    // Handle image update if new file uploaded
    if (req.file) {
      // Delete old image if exists
      if (task.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", task.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      task.imageUrl = `/uploads/tasks/${req.file.filename}`;
    }

    await task.save();

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};

// Delete task (Admin only)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Delete associated image if exists
    if (task.imageUrl) {
      const imagePath = path.join(__dirname, "..", task.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};

// Get my tasks (for regular users)
export const getMyTasks = async (req, res) => {
  try {
    const user = req.user;

    const tasks = await Task.find({ createdBy: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
};

// Get task statistics (Admin)
export const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          byCategory: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ],
          recentPending: [
            { $match: { status: "pending" } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { title: 1, createdAt: 1, createdByName: 1, priority: 1 } },
          ],
          avgResolutionTime: [
            { $match: { status: "completed", completedAt: { $exists: true } } },
            {
              $project: {
                resolutionTime: { $subtract: ["$completedAt", "$createdAt"] },
              },
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: "$resolutionTime" },
              },
            },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    console.error("Error fetching task stats:", error);
    res.status(500).json({ message: "Error fetching statistics", error: error.message });
  }
};
