import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  note: String
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ["problem", "maintenance", "general", "complaint", "other"],
    default: "problem"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  createdByUnit: {
    type: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  completionNote: {
    type: String
  },
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ category: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
