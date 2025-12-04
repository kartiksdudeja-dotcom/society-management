import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./MonthlyExpensePage.css";

export default function MonthlyExpensePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [monthYear, setMonthYear] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("other");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addCategory, setAddCategory] = useState("other");
  const [addNotes, setAddNotes] = useState("");

  const categories = [
    { value: "maintenance", label: "Maintenance" },
    { value: "repairs", label: "Repairs" },
    { value: "utilities", label: "Utilities" },
    { value: "salary", label: "Salary" },
    { value: "cleaning", label: "Cleaning" },
    { value: "security", label: "Security" },
    { value: "pest-control", label: "Pest Control" },
    { value: "gardening", label: "Gardening" },
    { value: "other", label: "Other" },
  ];

  // Load expenses
  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/monthly-expense?month=${month}&year=${year}`);
      setExpenses(res.data.data || []);
      setTotal(res.data.total || 0);
      setMonthYear(res.data.monthYear || "");
    } catch (err) {
      console.error("Error loading expenses:", err);
      setExpenses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  // Edit functions
  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setEditName(expense.name || "");
    setEditAmount(expense.amount || "");
    setEditCategory(expense.category || "other");
    setEditNotes(expense.notes || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
    setEditName("");
    setEditAmount("");
    setEditCategory("other");
    setEditNotes("");
  };

  const handleSave = async () => {
    if (!editName || !editAmount) {
      alert("Please enter name and amount");
      return;
    }

    setSaving(true);
    try {
      await API.put(`/monthly-expense/${selectedExpense._id}`, {
        name: editName,
        amount: parseFloat(editAmount),
        category: editCategory,
        notes: editNotes,
      });

      alert("✅ Expense updated successfully!");
      closeModal();
      load();
    } catch (err) {
      alert("❌ Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add functions
  const openAddModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setAddDate(today);
    setAddName("");
    setAddAmount("");
    setAddCategory("other");
    setAddNotes("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAdd = async () => {
    if (!addDate || !addName || !addAmount) {
      alert("Please enter date, name, and amount");
      return;
    }

    setSaving(true);
    try {
      await API.post("/monthly-expense/add", {
        date: addDate,
        name: addName,
        amount: parseFloat(addAmount),
        category: addCategory,
        notes: addNotes,
      });

      alert("✅ Expense added successfully!");
      closeAddModal();
      load();
    } catch (err) {
      alert("❌ Error adding: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete function
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await API.delete(`/monthly-expense/${id}`);
      alert("✅ Expense deleted!");
      load();
    } catch (err) {
      alert("❌ Error deleting: " + err.message);
    }
  };

  // Sync from bank
  const handleSync = async () => {
    setLoading(true);
    try {
      await API.post(`/monthly-expense/sync?month=${month}&year=${year}`);
      alert("✅ Synced from bank transactions!");
      load();
    } catch (err) {
      alert("❌ Error syncing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="me-container">
      <h1 className="me-title">Monthly Expenses</h1>

      <div className="me-filter">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
          ].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <button className="me-sync-btn" onClick={handleSync} disabled={loading}>
          🔄 Sync from Bank
        </button>

        <button className="me-add-btn" onClick={openAddModal}>
          ➕ Add Expense
        </button>
      </div>

      {/* Total Card */}
      <div className="me-total-card">
        <h3>Total Expenses - {monthYear}</h3>
        <p>₹{total.toLocaleString()}</p>
        <span>{expenses.length} expenses</span>
      </div>

      {/* Table */}
      <div className="me-table-box">
        <table className="me-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Name</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty">Loading...</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">No expenses found</td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>
                    <div className="expense-name">{e.name}</div>
                    {e.originalNarration && (
                      <div className="expense-narration">{e.originalNarration.substring(0, 80)}...</div>
                    )}
                  </td>
                  <td>
                    <span className={`category-badge ${e.category}`}>
                      {categories.find(c => c.value === e.category)?.label || e.category}
                    </span>
                  </td>
                  <td className="amount-cell">₹{e.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`source-badge ${e.source}`}>
                      {e.source === "bank" ? "🏦 Bank" : "✍️ Manual"}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="me-edit-btn"
                      onClick={() => openEditModal(e)}
                      title="Edit expense"
                    >
                      ✏️
                    </button>
                    <button 
                      className="me-delete-btn"
                      onClick={() => handleDelete(e._id)}
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="me-modal-overlay" onClick={closeModal}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Expense</h2>
            
            {selectedExpense?.originalNarration && (
              <div className="me-modal-info">
                <p><strong>Original Bank Narration:</strong></p>
                <p className="me-narration">{selectedExpense.originalNarration}</p>
              </div>
            )}

            <div className="me-modal-form">
              <label>
                Expense Name:
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Pest Control, Security, etc."
                />
              </label>

              <label>
                Amount (₹):
                <input 
                  type="number" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </label>

              <label>
                Category:
                <select 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes (optional):
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any additional notes"
                  rows={3}
                />
              </label>
            </div>

            <div className="me-modal-actions">
              <button className="me-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="me-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="me-modal-overlay" onClick={closeAddModal}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Manual Expense</h2>

            <div className="me-modal-form">
              <label>
                Date:
                <input 
                  type="date" 
                  value={addDate} 
                  onChange={(e) => setAddDate(e.target.value)}
                />
              </label>

              <label>
                Expense Name:
                <input 
                  type="text" 
                  value={addName} 
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Pest Control, Security, etc."
                />
              </label>

              <label>
                Amount (₹):
                <input 
                  type="number" 
                  value={addAmount} 
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </label>

              <label>
                Category:
                <select 
                  value={addCategory} 
                  onChange={(e) => setAddCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes (optional):
                <textarea 
                  value={addNotes} 
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Any additional notes"
                  rows={3}
                />
              </label>
            </div>

            <div className="me-modal-actions">
              <button className="me-btn-cancel" onClick={closeAddModal}>Cancel</button>
              <button className="me-btn-save" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
