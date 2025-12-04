import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaArrowLeft, 
  FaClock, 
  FaCheckCircle, 
  FaSpinner,
  FaExclamationTriangle,
  FaImage
} from "react-icons/fa";
import API from "../services/api";
import "./MyComplaintsPage.css";

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const response = await API.get("/tasks/my-tasks");
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load your complaints");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="status-icon completed" />;
      case "in-progress":
        return <FaSpinner className="status-icon in-progress" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      default:
        return "Pending";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "priority-urgent";
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      default:
        return "priority-low";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="my-complaints-page">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading your complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-complaints-page">
      <div className="complaints-container">
        {/* Header */}
        <div className="complaints-header">
          <button className="back-btn" onClick={() => navigate("/app/dashboard")}>
            <FaArrowLeft /> Dashboard
          </button>
          <div className="header-content">
            <div>
              <h1>My Complaints</h1>
              <p>Track the status of your reported problems</p>
            </div>
            <button className="report-btn" onClick={() => navigate("/app/report-problem")}>
              <FaPlus /> Report New Problem
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card total">
            <span className="stat-number">{counts.all}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{counts.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-number">{counts["in-progress"]}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{counts.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {["all", "pending", "in-progress", "completed"].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="filter-count">{counts[status]}</span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <FaExclamationTriangle className="empty-icon" />
              <h3>No complaints found</h3>
              <p>
                {filter === "all"
                  ? "You haven't reported any problems yet."
                  : `No ${filter} complaints.`}
              </p>
              <button className="report-btn" onClick={() => navigate("/app/report-problem")}>
                <FaPlus /> Report a Problem
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className={`task-card ${task.status}`}>
                <div className="task-main">
                  {task.imageUrl && (
                    <div className="task-image">
                      <img src={`${baseURL}${task.imageUrl}`} alt={task.title} />
                    </div>
                  )}
                  <div className="task-content">
                    <div className="task-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <div className="task-meta">
                      <span className="task-category">{task.category}</span>
                      <span className="task-date">
                        <FaClock /> {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="task-status">
                  <div className={`status-badge ${task.status}`}>
                    {getStatusIcon(task.status)}
                    <span>{getStatusLabel(task.status)}</span>
                  </div>
                  {task.completedAt && (
                    <div className="completion-info">
                      <span className="completion-label">Resolved on:</span>
                      <span className="completion-date">{formatDate(task.completedAt)}</span>
                    </div>
                  )}
                  {task.completionNote && (
                    <div className="completion-note">
                      <span className="note-label">Resolution Note:</span>
                      <p>{task.completionNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
