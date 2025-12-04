import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaArrowLeft,
  FaImage,
  FaEdit,
  FaTimes,
  FaHistory,
  FaExclamationTriangle,
  FaFilter,
  FaSync,
  FaClipboardList,
  FaBullhorn,
  FaCircle,
  FaTable,
  FaThList,
  FaTimesCircle,
  FaQuestionCircle
} from "react-icons/fa";
import API from "../services/api";
import "./AdminTasksPage.css";

export default function TasksPage() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = (storedUser?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "1";
  const navigate = useNavigate();

  // Tab state: "problems" or "mytasks"
  const [activeTab, setActiveTab] = useState("problems");
  // View mode: "cards" or "table"
  const [viewMode, setViewMode] = useState("cards");

  // Problem Broadcast states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, completed: 0, total: 0 });

  // Personal Task List states
  const [myTasks, setMyTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminTasks") || "[]");
    } catch {
      return [];
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  // Modal states
  const [editModal, setEditModal] = useState({ open: false, task: null });
  const [historyModal, setHistoryModal] = useState({ open: false, task: null });
  const [imageModal, setImageModal] = useState({ open: false, url: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, taskId: null });

  // Enhanced Edit form with solved/not solved and reason
  const [editForm, setEditForm] = useState({
    status: "completed",
    isSolved: true,
    reason: "",
    note: "",
    completedAt: ""
  });

  const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (activeTab === "problems") {
      fetchTasks();
    }
  }, [filter, activeTab]);

  // Save personal tasks to localStorage
  useEffect(() => {
    localStorage.setItem("adminTasks", JSON.stringify(myTasks));
  }, [myTasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/tasks/all?status=${filter}`);
      setTasks(response.data.tasks);
      setCounts(response.data.counts);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Quick complete - directly mark as completed
  const handleQuickComplete = async (task) => {
    try {
      const now = new Date();
      await API.put(`/tasks/status/${task._id}`, {
        status: "completed",
        note: "✅ Problem Solved",
        completedAt: now.toISOString()
      });
      fetchTasks();
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Failed to complete task");
    }
  };

  // Open edit modal with task details
  const openEditModal = (task) => {
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditForm({
      status: task.status,
      isSolved: task.status === "completed",
      reason: task.completionNote || "",
      note: "",
      completedAt: task.completedAt ? new Date(new Date(task.completedAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : localISO
    });
    setEditModal({ open: true, task });
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!editModal.task) return;
    try {
      let note = editForm.note;
      if (editForm.status === "completed") {
        note = editForm.isSolved 
          ? `✅ Problem Solved${editForm.note ? ': ' + editForm.note : ''}`
          : `❌ Not Solved - Reason: ${editForm.reason}`;
      }
      
      await API.put(`/tasks/status/${editModal.task._id}`, {
        status: editForm.status,
        note: note,
        completedAt: editForm.completedAt
      });
      setEditModal({ open: false, task: null });
      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.taskId) return;
    try {
      await API.delete(`/tasks/${deleteConfirm.taskId}`);
      setDeleteConfirm({ open: false, taskId: null });
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
    }
  };

  // Personal Task Functions
  const addMyTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const now = new Date();
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      description: newTaskDesc,
      completed: false,
      createdAt: now.toLocaleString(),
      completedAt: null
    };
    setMyTasks([newTask, ...myTasks]);
    setNewTaskTitle("");
    setNewTaskDesc("");
  };

  const toggleMyTask = (id) => {
    const now = new Date().toLocaleString();
    setMyTasks(
      myTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? now : null
            }
          : task
      )
    );
  };

  const deleteMyTask = (id) => {
    setMyTasks(myTasks.filter((task) => task.id !== id));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
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

  // Check if task was solved or not based on completion note
  const isSolved = (task) => {
    if (task.status !== "completed") return null;
    if (task.completionNote?.includes("Not Solved") || task.completionNote?.includes("❌")) return false;
    return true;
  };

  const filteredMyTasks = myTasks.filter((task) => {
    if (taskFilter === "active") return !task.completed;
    if (taskFilter === "completed") return task.completed;
    return true;
  });

  const myTaskCounts = {
    total: myTasks.length,
    active: myTasks.filter((t) => !t.completed).length,
    completed: myTasks.filter((t) => t.completed).length
  };

  if (!isAdmin) {
    return (
      <div className="tasks-page">
        <div className="tasks-container">
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <h2>Admin Only Area</h2>
            <p>Task management is only available to administrators.</p>
            <button className="back-btn" onClick={() => navigate("/app/my-complaints")}>
              View My Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-container">
        {/* Header with Tabs */}
        <div className="tasks-header">
          <div className="tasks-header-content">
            <h1>{activeTab === "problems" ? "Problem Broadcast" : "My Task List"}</h1>
            <p>{activeTab === "problems" ? "Manage all reported problems" : "Your personal tasks and to-dos"}</p>
          </div>
          <div className="header-actions">
            {activeTab === "problems" && (
              <button className="refresh-btn" onClick={fetchTasks}>
                <FaSync /> Refresh
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === "problems" ? "active" : ""}`}
            onClick={() => setActiveTab("problems")}
          >
            <FaBullhorn /> Problem Broadcast
            {counts.pending > 0 && <span className="tab-badge">{counts.pending}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === "mytasks" ? "active" : ""}`}
            onClick={() => setActiveTab("mytasks")}
          >
            <FaClipboardList /> My Tasks
            {myTaskCounts.active > 0 && <span className="tab-badge">{myTaskCounts.active}</span>}
          </button>
        </div>

        {/* PROBLEM BROADCAST TAB */}
        {activeTab === "problems" && (
          <>
            {/* Stats Cards */}
            <div className="tasks-stats">
              <div className="stat-box total">
                <span className="stat-number">{counts.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-box pending">
                <span className="stat-number">{counts.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-box in-progress">
                <span className="stat-number">{counts.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-box completed">
                <span className="stat-number">{counts.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>

            {/* Filter & View Toggle */}
            <div className="filter-row">
              <div className="task-filters">
                {[
                  { key: "all", label: "All", count: counts.total },
                  { key: "pending", label: "Pending", count: counts.pending },
                  { key: "in-progress", label: "In Progress", count: counts.inProgress },
                  { key: "completed", label: "Completed", count: counts.completed }
                ].map((f) => (
                  <button
                    key={f.key}
                    className={`filter-btn ${filter === f.key ? "active" : ""}`}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="Card View"
                >
                  <FaThList />
                </button>
                <button
                  className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table View"
                >
                  <FaTable />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-message">{error}</div>}

            {/* Loading */}
            {loading ? (
              <div className="loading-container">
                <FaSpinner className="loading-spinner" />
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <FaExclamationTriangle className="empty-icon" />
                <p>
                  {filter === "all"
                    ? "No problems reported yet"
                    : `No ${filter} tasks`}
                </p>
              </div>
            ) : viewMode === "table" ? (
              /* TABLE VIEW */
              <div className="tasks-table-container">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Problem</th>
                      <th>Reported By</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Solved?</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className={task.status}>
                        <td className="table-img-cell">
                          {task.imageUrl ? (
                            <img
                              src={`${baseURL}${task.imageUrl}`}
                              alt=""
                              className="table-thumbnail"
                              onClick={() => setImageModal({ open: true, url: `${baseURL}${task.imageUrl}` })}
                            />
                          ) : (
                            <span className="no-image">-</span>
                          )}
                        </td>
                        <td>
                          <div className="table-problem">
                            <strong>{task.title}</strong>
                            {task.description && <p>{task.description}</p>}
                            <span className={`priority-badge small ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="table-reporter">
                            {task.createdByName}
                            {task.createdByUnit && <small>({task.createdByUnit})</small>}
                          </div>
                        </td>
                        <td className="table-date">{formatShortDate(task.createdAt)}</td>
                        <td>
                          <div className={`status-pill small ${task.status}`}>
                            {getStatusIcon(task.status)}
                            <span>{task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                          </div>
                        </td>
                        <td className="table-solved">
                          {task.status === "completed" ? (
                            isSolved(task) ? (
                              <span className="solved-yes"><FaCheckCircle /> Yes</span>
                            ) : (
                              <span className="solved-no"><FaTimesCircle /> No</span>
                            )
                          ) : (
                            <span className="solved-pending"><FaQuestionCircle /> -</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            {task.status !== "completed" && (
                              <button
                                className="action-btn quick-complete small"
                                onClick={() => handleQuickComplete(task)}
                                title="Mark Solved"
                              >
                                <FaCheckCircle />
                              </button>
                            )}
                            <button
                              className="action-btn edit small"
                              onClick={() => openEditModal(task)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete small"
                              onClick={() => setDeleteConfirm({ open: true, taskId: task._id })}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CARD VIEW */
              <div className="tasks-list">
                {tasks.map((task) => (
                  <div key={task._id} className={`task-item ${task.status}`}>
                    {/* Image thumbnail */}
                    {task.imageUrl && (
                      <div
                        className="task-thumbnail"
                        onClick={() => setImageModal({ open: true, url: `${baseURL}${task.imageUrl}` })}
                      >
                        <img src={`${baseURL}${task.imageUrl}`} alt="" />
                        <div className="thumbnail-overlay">
                          <FaImage />
                        </div>
                      </div>
                    )}

                    <div className="task-content">
                      <div className="task-top">
                        <h3 className="task-title">{task.title}</h3>
                        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}

                      <div className="task-meta">
                        <span className="meta-item category">{task.category}</span>
                        <span className="meta-item">
                          <strong>By:</strong> {task.createdByName}
                          {task.createdByUnit && ` (${task.createdByUnit})`}
                        </span>
                        <span className="meta-item">
                          <FaClock /> {formatDate(task.createdAt)}
                        </span>
                      </div>

                      <div className="task-status-row">
                        <div className={`status-pill ${task.status}`}>
                          {getStatusIcon(task.status)}
                          <span>
                            {task.status === "in-progress"
                              ? "In Progress"
                              : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </div>
                        {task.status === "completed" && (
                          <span className={`solved-badge ${isSolved(task) ? "yes" : "no"}`}>
                            {isSolved(task) ? "✅ Solved" : "❌ Not Solved"}
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="completed-at">
                            {formatDate(task.completedAt)}
                          </span>
                        )}
                      </div>
                      
                      {task.completionNote && (
                        <div className="completion-note-display">
                          <strong>Note:</strong> {task.completionNote}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="task-actions">
                      {task.status !== "completed" && (
                        <button
                          className="action-btn quick-complete"
                          onClick={() => handleQuickComplete(task)}
                          title="Mark Solved"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      <button
                        className="action-btn edit"
                        onClick={() => openEditModal(task)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn history"
                        onClick={() => setHistoryModal({ open: true, task })}
                        title="View History"
                      >
                        <FaHistory />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteConfirm({ open: true, taskId: task._id })}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MY TASKS TAB */}
        {activeTab === "mytasks" && (
          <>
            {/* Add Task Form */}
            <div className="add-task-card">
              <form onSubmit={addMyTask} className="add-task-form">
                <div className="form-row-inline">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="task-input"
                    required
                  />
                  <button type="submit" className="add-task-btn">
                    <FaPlus /> Add
                  </button>
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="task-textarea"
                  rows="2"
                />
              </form>
            </div>

            {/* My Task Stats */}
            <div className="my-task-stats">
              <span className="stat-item">
                <strong>{myTaskCounts.total}</strong> Total
              </span>
              <span className="stat-item active">
                <strong>{myTaskCounts.active}</strong> Active
              </span>
              <span className="stat-item completed">
                <strong>{myTaskCounts.completed}</strong> Completed
              </span>
            </div>

            {/* Filter */}
            <div className="task-filters">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "completed", label: "Completed" }
              ].map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn ${taskFilter === f.key ? "active" : ""}`}
                  onClick={() => setTaskFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* My Tasks List */}
            <div className="my-tasks-list">
              {filteredMyTasks.length === 0 ? (
                <div className="empty-state">
                  <FaClipboardList className="empty-icon" />
                  <p>No tasks yet. Add one above!</p>
                </div>
              ) : (
                filteredMyTasks.map((task) => (
                  <div key={task.id} className={`my-task-item ${task.completed ? "completed" : ""}`}>
                    <button
                      className="task-checkbox"
                      onClick={() => toggleMyTask(task.id)}
                    >
                      {task.completed ? <FaCheckCircle /> : <FaCircle />}
                    </button>
                    <div className="my-task-content">
                      <h4 className="my-task-title">{task.title}</h4>
                      {task.description && <p className="my-task-desc">{task.description}</p>}
                      <div className="my-task-dates">
                        <span>Created: {task.createdAt}</span>
                        {task.completedAt && <span className="done-date">✓ Done: {task.completedAt}</span>}
                      </div>
                    </div>
                    <button
                      className="my-task-delete"
                      onClick={() => deleteMyTask(task.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Task Modal */}
      {editModal.open && editModal.task && (
        <div className="modal-overlay" onClick={() => setEditModal({ open: false, task: null })}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Task Status</h3>
              <button className="modal-close" onClick={() => setEditModal({ open: false, task: null })}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="task-preview">
                <h4>{editModal.task.title}</h4>
                <p>Reported by: {editModal.task.createdByName}</p>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {editForm.status === "completed" && (
                <>
                  <div className="form-group">
                    <label>Was the problem solved?</label>
                    <div className="solved-options">
                      <button
                        type="button"
                        className={`solved-option ${editForm.isSolved ? "active yes" : ""}`}
                        onClick={() => setEditForm({ ...editForm, isSolved: true, reason: "" })}
                      >
                        <FaCheckCircle /> Yes, Solved
                      </button>
                      <button
                        type="button"
                        className={`solved-option ${!editForm.isSolved ? "active no" : ""}`}
                        onClick={() => setEditForm({ ...editForm, isSolved: false })}
                      >
                        <FaTimesCircle /> No, Not Solved
                      </button>
                    </div>
                  </div>

                  {!editForm.isSolved && (
                    <div className="form-group">
                      <label>Reason why not solved *</label>
                      <textarea
                        value={editForm.reason}
                        onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                        placeholder="Explain why the problem could not be solved..."
                        rows="3"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.completedAt}
                  onChange={(e) => setEditForm({ ...editForm, completedAt: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Additional Note (Optional)</label>
                <textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows="2"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditModal({ open: false, task: null })}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleEditSubmit}
                disabled={editForm.status === "completed" && !editForm.isSolved && !editForm.reason.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && historyModal.task && (
        <div className="modal-overlay" onClick={() => setHistoryModal({ open: false, task: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Status History</h3>
              <button className="modal-close" onClick={() => setHistoryModal({ open: false, task: null })}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <h4 className="history-title">{historyModal.task.title}</h4>
              <ul className="history-list">
                {(historyModal.task.statusHistory || []).slice().reverse().map((h, idx) => (
                  <li key={idx} className="history-item">
                    <div className={`history-status ${h.status}`}>
                      {h.status === "in-progress" ? "In Progress" : h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                    </div>
                    <div className="history-date">{formatDate(h.updatedAt)}</div>
                    {h.note && <div className="history-note">{h.note}</div>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.open && (
        <div className="modal-overlay image-modal" onClick={() => setImageModal({ open: false, url: "" })}>
          <div className="image-modal-content">
            <button className="image-modal-close" onClick={() => setImageModal({ open: false, url: "" })}>
              <FaTimes />
            </button>
            <img src={imageModal.url} alt="Problem" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, taskId: null })}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteConfirm({ open: false, taskId: null })}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
