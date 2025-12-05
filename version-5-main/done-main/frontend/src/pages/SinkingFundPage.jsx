import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaSearch, FaSave, FaSync, FaCheckCircle, FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import "./SinkingFundPage.css";

export default function SinkingFundPage() {
  const [table, setTable] = useState([]);
  const [filteredTable, setFilteredTable] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("owner");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editData, setEditData] = useState({ paid: "", pending: "" });
  const [zoomLevel, setZoomLevel] = useState(100);

  // Zoom controls
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const resetZoom = () => setZoomLevel(100);

  // ---------------------
  // LOAD DATA FROM BACKEND
  // ---------------------
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/sinkingfund/get");

      console.log("Loaded data:", res.data);

      if (Array.isArray(res.data)) {
        setTable(res.data);
        setFilteredTable(res.data);
      } else {
        setTable([]);
        setFilteredTable([]);
      }
      setMsg("");
    } catch (err) {
      console.error("Load error:", err);
      setMsg("Error loading sinking fund data");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------
  // SAVE DATA
  // ---------------------
  const saveData = async () => {
    try {
      setSaving(true);
      const res = await API.post("/sinkingfund/save", { table });

      console.log("Save response:", res.data);

      setMsg("✓ Saved successfully");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setMsg("✗ Save failed");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Search and filter
  useEffect(() => {
    let filtered = table.filter((row) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (row.unit || "").toString().toLowerCase().includes(searchLower) ||
        (row.owner || "").toLowerCase().includes(searchLower) ||
        (row.paid || "").toString().toLowerCase().includes(searchLower) ||
        (row.pending || "").toString().toLowerCase().includes(searchLower)
      );
    });

    // Sort
    if (sortBy === "owner") {
      filtered.sort((a, b) => (a.owner || "").localeCompare(b.owner || ""));
    } else if (sortBy === "unit") {
      filtered.sort((a, b) => (a.unit || "").toString().localeCompare(b.unit || ""));
    } else if (sortBy === "pending") {
      filtered.sort((a, b) => (b.pending || 0) - (a.pending || 0));
    }

    setFilteredTable(filtered);
  }, [searchTerm, sortBy, table]);

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals
  const totalPaid = table.reduce((sum, row) => sum + (parseFloat(row.paid) || 0), 0);
  const totalPending = table.reduce((sum, row) => sum + (parseFloat(row.pending) || 0), 0);

  // Start editing a row
  const startEdit = (idx, row) => {
    setEditingIdx(idx);
    setEditData({ paid: row.paid || "", pending: row.pending || "" });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditData({ paid: "", pending: "" });
  };

  // Save edit for a single row
  const saveEdit = (idx) => {
    const updatedTable = [...table];
    const rowIndex = table.findIndex((r) => r.unit === filteredTable[idx].unit);
    if (rowIndex !== -1) {
      updatedTable[rowIndex] = {
        ...updatedTable[rowIndex],
        paid: parseFloat(editData.paid) || 0,
        pending: parseFloat(editData.pending) || 0
      };
      setTable(updatedTable);
      setMsg("✓ Row updated (click Save All to persist)");
      setTimeout(() => setMsg(""), 3000);
    }
    setEditingIdx(null);
    setEditData({ paid: "", pending: "" });
  };

  return (
    <div className="sinking-fund-container">
      {/* HEADER */}
      <div className="sinking-header">
        <div className="header-content">
          <h1 className="header-title">Sinking Fund</h1>
          <p className="header-subtitle">Manage society sinking fund collections and payments</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Paid</span>
            <span className="stat-value paid">₹{totalPaid.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Pending</span>
            <span className="stat-value pending">₹{totalPending.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="sinking-controls">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by unit, owner, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="owner">Sort by Owner</option>
          <option value="unit">Sort by Unit</option>
          <option value="pending">Sort by Pending Amount</option>
        </select>

        <div className="action-buttons-top">
          <button
            className="btn btn-refresh"
            onClick={loadData}
            disabled={loading}
            title="Refresh data"
          >
            <FaSync style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button
            className="btn btn-save-main"
            onClick={saveData}
            disabled={saving || table.length === 0}
            title="Save all changes"
          >
            <FaSave />
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {msg && (
        <div className={`message-banner ${msg.includes("✓") ? "success" : "error"}`}>
          {msg}
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="sinking-table-wrapper">
        {/* Zoom Controls */}
        <div className="table-controls">
          <div className="scroll-hint">← Scroll to see all columns →</div>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">−</button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button className="zoom-btn" onClick={zoomIn} title="Zoom In">+</button>
            <button className="zoom-btn reset" onClick={resetZoom} title="Reset">↺</button>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">
            <p>Loading sinking fund data...</p>
          </div>
        ) : filteredTable.length === 0 ? (
          <div className="empty-state">
            <p>No data found</p>
            <span>Try adjusting your search criteria</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="sinking-table" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
              <thead>
                <tr>
                  <th className="index-col">#</th>
                  <th className="unit-col">Unit</th>
                  <th className="owner-col">Owner</th>
                  <th className="paid-col">Paid Amount</th>
                  <th className="pending-col">Pending</th>
                  <th className="status-col">Status</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTable.map((row, idx) => {
                  const pendingAmount = parseFloat(row.pending) || 0;
                  const isPaid = pendingAmount === 0;
                  const isEditing = editingIdx === idx;

                  return (
                    <tr key={idx} className={isPaid ? "paid-status" : "pending-status"}>
                      <td className="index-col">{idx + 1}</td>
                      <td className="unit-col">
                        <span className="unit-badge">{row.unit}</span>
                      </td>
                      <td className="owner-col">{row.owner}</td>
                      <td className="paid-col">
                        {isEditing ? (
                          <input
                            type="number"
                            className="edit-input"
                            value={editData.paid}
                            onChange={(e) => setEditData({ ...editData, paid: e.target.value })}
                          />
                        ) : (
                          <span className="amount-badge paid-badge">
                            ₹{(parseFloat(row.paid) || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="pending-col">
                        {isEditing ? (
                          <input
                            type="number"
                            className="edit-input"
                            value={editData.pending}
                            onChange={(e) => setEditData({ ...editData, pending: e.target.value })}
                          />
                        ) : (
                          <span className={`amount-badge ${isPaid ? "paid" : "pending"}`}>
                            ₹{pendingAmount.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="status-col">
                        {isPaid ? (
                          <span className="status-badge status-paid">
                            <FaCheckCircle /> Paid
                          </span>
                        ) : (
                          <span className="status-badge status-pending">Pending</span>
                        )}
                      </td>
                      <td className="actions-col">
                        {isEditing ? (
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-save"
                              onClick={() => saveEdit(idx)}
                              title="Save changes"
                            >
                              <FaCheck />
                            </button>
                            <button
                              className="btn-icon btn-cancel"
                              onClick={cancelEdit}
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => startEdit(idx, row)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="sinking-footer">
        <p>Showing {filteredTable.length} of {table.length} records</p>
      </div>
    </div>
  );
}
