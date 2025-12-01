import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaCircle, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./TasksPage.css";

export default function TasksPage() {
  // derive current user and admin status from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const role = (storedUser?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "1";
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userTasks") || "[]");
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, completed
  const navigate = useNavigate();

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("userTasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const now = new Date();
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      description: newTaskDescription,
      completed: false,
      createdAt: now.toLocaleString(),
      lastUpdated: now.toLocaleString(),
      statusHistory: [
        { status: "active", updatedAt: now.toLocaleString() }
      ],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setNewTaskDescription("");
  };

  const toggleTask = (id) => {
    const now = new Date().toLocaleString();
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              lastUpdated: now,
              statusHistory: [
                ...(task.statusHistory || []),
                { status: !task.completed ? "completed" : "active", updatedAt: now },
              ],
            }
          : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // status update: used by admin to set exact status + datetime
  const [editingTask, setEditingTask] = useState(null);
  const [editStatus, setEditStatus] = useState("completed");
  const [editDatetime, setEditDatetime] = useState("");

  const openEditStatus = (task) => {
    setEditingTask(task.id);
    setEditStatus(task.completed ? "completed" : "active");
    // set default datetime to now as local ISO
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    setEditDatetime(localISO);
  };

  const saveEditStatus = (taskId) => {
    if (!editDatetime) return;
    // format displayable string
    const display = new Date(editDatetime).toLocaleString();
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: editStatus === "completed",
              lastUpdated: display,
              statusHistory: [...(t.statusHistory || []), { status: editStatus, updatedAt: display }],
            }
          : t
      )
    );
    setEditingTask(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  // expand history toggles (show/hide per task)
  const [historyOpen, setHistoryOpen] = useState({});

  const toggleHistory = (id) => {
    setHistoryOpen((s) => ({ ...s, [id]: !s[id] }));
  };

  if (!isAdmin) {
    return (
      <div className="tasks-page">
        <div className="tasks-container">
          <div className="empty-state">
            <h2 style={{marginTop:0}}>Tasks — Admin Only</h2>
            <p>This task management feature is only visible to admins. You do not have permission to view or edit tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-container">
        {/* Header */}
        <div className="tasks-header">
          <div className="tasks-header-content">
            <h1>My Tasks</h1>
            <p>Organize and track your daily tasks</p>
          </div>
          <div className="tasks-stats">
            <div className="stat-box">
              <span className="stat-number">{completedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{totalCount}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Add Task Form */}
        <div className="add-task-card">
          <form onSubmit={addTask} className="add-task-form">
            <div className="form-group">
              <label htmlFor="taskTitle">Task Title</label>
              <input
                id="taskTitle"
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="task-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="taskDescription">Description (Optional)</label>
              <textarea
                id="taskDescription"
                placeholder="Add details about your task..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="task-textarea"
                rows="3"
              />
            </div>

            <button type="submit" className="add-task-btn">
              <FaPlus /> Add Task
            </button>
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="task-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({totalCount})
          </button>
          <button
            className={`filter-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active ({totalCount - completedCount})
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Tasks List */}
        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>{filter === "all" ? "No tasks yet" : `No ${filter} tasks`}</p>
              <p className="empty-hint">
                {filter === "all" ? "Create a new task to get started!" : ""}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
                <button
                  className="task-checkbox"
                  onClick={() => toggleTask(task.id)}
                  title={task.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {task.completed ? <FaCheckCircle /> : <FaCircle />}
                </button>

                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div style={{marginTop:6}}>
                    <span style={{padding:'4px 10px',borderRadius:20, fontSize:12, fontWeight:700, color: task.completed ? '#0b6623' : '#103d2b', background: task.completed ? '#dff6e6' : '#dff4ef'}}> 
                      {task.completed ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <div style={{display: 'flex', gap:10, alignItems:'center', marginTop:6}}>
                    <span className="task-date">Created: {task.createdAt}</span>
                    {task.lastUpdated && <span className="task-date">Updated: {task.lastUpdated}</span>}
                  </div>
                  {/* status history toggle */}
                  <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                    <button className="filter-btn" onClick={() => toggleHistory(task.id)} style={{padding:'6px 10px'}}>History</button>
                    <button className="filter-btn" onClick={() => openEditStatus(task)} style={{padding:'6px 10px'}}>Update status</button>
                  </div>
                  {historyOpen[task.id] && (
                    <div style={{marginTop:8, padding:10, background:'#f6f7fb', borderRadius:8, fontSize:13}}>
                      <strong>Status history</strong>
                      <ul style={{margin:8, paddingLeft:18}}>
                        {(task.statusHistory||[]).slice().reverse().map((s, idx) => (
                          <li key={idx}>{s.status} — {s.updatedAt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {editingTask === task.id ? (
                    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                      <div style={{display:'flex', gap:8, alignItems:'center'}}>
                        <select value={editStatus} onChange={(e)=>setEditStatus(e.target.value)} style={{padding:8,borderRadius:8}}>
                          <option value="completed">Completed</option>
                          <option value="active">Active</option>
                        </select>
                        <input type="datetime-local" value={editDatetime} onChange={(e)=>setEditDatetime(e.target.value)} style={{padding:8,borderRadius:8}} />
                      </div>
                      <div style={{display:'flex', gap:8}}>
                        <button className="add-task-btn" onClick={()=>saveEditStatus(task.id)} style={{padding:'8px 10px'}}>Save</button>
                        <button className="filter-btn" onClick={cancelEdit} style={{padding:'8px 10px'}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="task-delete"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        <FaTrash />
                      </button>
                    </>
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
