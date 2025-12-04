import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./MonthlyCollectionPage.css";

export default function MonthlyCollectionPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  // Member List (from Maintenance collection)
  const [members, setMembers] = useState([]);

  // Training Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [trainOwnerName, setTrainOwnerName] = useState("");
  const [trainPayerName, setTrainPayerName] = useState("");
  const [trainOffice, setTrainOffice] = useState("");
  const [trainRelationship, setTrainRelationship] = useState("self");
  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------
  // LOAD MEMBER LIST
  // -------------------------------------------------------
  const loadMembers = async () => {
    try {
      const res = await API.get("/bank/members");
      setMembers(res.data.data || []);
    } catch (err) {
      console.error("Error loading members:", err);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // -------------------------------------------------------
  // LOAD BANK TRANSACTIONS (CREDITS ONLY)
  // -------------------------------------------------------
  const load = async () => {
    try {
      const res = await API.get(`/bank?month=${month}&year=${year}`);
      const list = res.data.data || [];

      // Filter ONLY CREDITS (money received)
      const credits = list.filter((t) => t.type === "credit");

      // Calculate total
      const totalAmount = credits.reduce((sum, t) => sum + (t.amount || 0), 0);

      setData(credits);
      setTotal(totalAmount);
    } catch (err) {
      console.error("Error loading data:", err);
      setData([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  // -------------------------------------------------------
  // TRAINING FUNCTIONS
  // -------------------------------------------------------
  const openTrainModal = (txn) => {
    setSelectedTxn(txn);
    setTrainOwnerName(txn.name || "");
    setTrainPayerName(txn.payerName || txn.name || "");
    setTrainOffice(txn.flat || "");
    setTrainRelationship(txn.relationship || "self");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTxn(null);
    setTrainOwnerName("");
    setTrainPayerName("");
    setTrainOffice("");
    setTrainRelationship("self");
  };

  // When office is selected from dropdown, auto-fill owner name
  const handleOfficeSelect = (unitNum) => {
    setTrainOffice(unitNum);
    const member = members.find(m => m.unit === unitNum);
    if (member) {
      setTrainOwnerName(member.owner);
    }
  };

  const handleTrain = async () => {
    if (!trainOffice || !trainOwnerName) {
      alert("Please select office and owner name");
      return;
    }

    setSaving(true);
    try {
      // Extract key from narration (capital letters name) - this is the payer name
      const narration = selectedTxn.narration || "";
      const capsMatch = narration.match(/[A-Z][A-Z ]{4,}/);
      const key = capsMatch ? capsMatch[0].trim() : trainPayerName;

      await API.post("/bank/train", {
        key: key,
        officeNumber: trainOffice,
        ownerName: trainOwnerName,
        payerName: trainPayerName || key,
        relationship: trainRelationship,
        officeType: "office"
      });

      // Also update this specific transaction
      await API.put(`/bank/transaction/${selectedTxn._id}`, {
        name: trainOwnerName,
        payerName: trainPayerName || key,
        relationship: trainRelationship,
        flat: trainOffice
      });

      alert("✅ Training saved successfully!");
      closeModal();
      load(); // Reload data
    } catch (err) {
      alert("❌ Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="mc-container">
      <h1 className="mc-title">Monthly Maintenance Collection</h1>

      <div className="mc-filter">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {[
            "January","February","March","April","May","June",
            "July","August","September","October","November","December",
          ].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Total Collection Card */}
      <div className="mc-total-card">
        <h3>Total Collection</h3>
        <p>₹{total.toLocaleString()}</p>
        <span>{data.length} transactions</span>
      </div>

      <div className="mc-table-box">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Owner Name</th>
              <th>Paid By</th>
              <th>Office/Shop</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">No transactions found</td>
              </tr>
            ) : (
              data.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.name || "Unknown"}</td>
                  <td>
                    {t.payerName && t.payerName !== t.name ? (
                      <span className="payer-info">
                        {t.payerName}
                        {t.relationship && t.relationship !== "self" && (
                          <span className="relationship-badge">({t.relationship})</span>
                        )}
                      </span>
                    ) : (
                      <span className="self-paid">Self</span>
                    )}
                  </td>
                  <td>{t.flat || "-"}</td>
                  <td>₹{t.amount?.toLocaleString()}</td>
                  <td>
                    <button 
                      className="mc-train-btn"
                      onClick={() => openTrainModal(t)}
                      title="Edit/Train this mapping"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Training Modal */}
      {showModal && (
        <div className="mc-modal-overlay" onClick={closeModal}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Train Mapping</h2>
            
            <div className="mc-modal-info">
              <p><strong>Narration:</strong></p>
              <p className="mc-narration">{selectedTxn?.narration}</p>
            </div>

            <div className="mc-modal-form">
              <label>
                Select Office/Shop:
                <select 
                  value={trainOffice} 
                  onChange={(e) => handleOfficeSelect(e.target.value)}
                >
                  <option value="">-- Select Office/Shop --</option>
                  {members.map((m) => (
                    <option key={m.unit} value={m.unit}>
                      {m.type === "shop" ? "Shop" : "Office"} {m.unit} - {m.owner}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Owner Name (from member list):
                <input 
                  type="text" 
                  value={trainOwnerName} 
                  onChange={(e) => setTrainOwnerName(e.target.value)}
                  placeholder="Auto-filled when you select office"
                  readOnly
                />
              </label>

              <label>
                Paid By (Who made the payment):
                <input 
                  type="text" 
                  value={trainPayerName} 
                  onChange={(e) => setTrainPayerName(e.target.value)}
                  placeholder="e.g. Rachna Darak"
                />
              </label>

              <label>
                Relationship to Owner:
                <select 
                  value={trainRelationship} 
                  onChange={(e) => setTrainRelationship(e.target.value)}
                >
                  <option value="self">Self (Owner)</option>
                  <option value="wife">Wife</option>
                  <option value="husband">Husband</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="relative">Relative</option>
                  <option value="employee">Employee</option>
                  <option value="tenant">Tenant</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="mc-modal-actions">
              <button className="mc-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="mc-btn-save" onClick={handleTrain} disabled={saving}>
                {saving ? "Saving..." : "Save & Train"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
