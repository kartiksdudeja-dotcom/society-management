import mongoose from "mongoose";

const adminTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "done"],
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
  completedAt: {
    type: Date,
    default: null
  },
  // Edit history
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    editedByName: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
adminTaskSchema.index({ status: 1, createdAt: -1 });

const AdminTask = mongoose.model("AdminTask", adminTaskSchema);

export default AdminTask;
