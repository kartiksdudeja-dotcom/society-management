import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { FaDownload, FaSave, FaSync, FaFileExcel, FaBars, FaTimes, FaCheckCircle } from "react-icons/fa";
import API from "../services/api";
import "./MaintenanceCollectionFull.css";

// Use API service for proper URL

function OverlayMenu({ open, onClose, onOpenTable, onLoadSaved, onSaveServer, onExportCSV }) {
  return (
    <div className={`overlay ${open ? "open" : ""}`} role="dialog" aria-hidden={!open}>
      <div className="overlay-content">
        <div className="overlay-header">
          <h2>Maintenance Options</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <nav className="overlay-nav">
          <div className="nav-section">
            <h3>Maintenance Data</h3>
            <button className="nav-button" onClick={() => { onLoadSaved(); onClose(); }}>
              <FaSync /> Load Saved DB
            </button>
            <button className="nav-button" onClick={() => { onSaveServer(); onClose(); }}>
              <FaSave /> Save to DB
            </button>
            <button className="nav-button" onClick={() => { onExportCSV(); onClose(); }}>
              <FaFileExcel /> Export CSV
            </button>
          </div>

          <div className="nav-section">
            <h3>Utilities</h3>
            <button className="nav-button" onClick={() => window.location.reload()}>
              <FaSync /> Reload Page
            </button>
          </div>
        </nav>
      </div>

      <div className="overlay-backdrop" onClick={onClose}></div>
    </div>
  );
}

function SmallInput({ value, onChange }) {
  return (
    <input
      className="small-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function MaintenanceCollectionFull() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [table, setTable] = useState([]); // always array
  const [months, setMonths] = useState([]); // always array
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // On mount, load DB data for the default selected year (2024)
    // This will auto-extract months from the data
    if (token) {
      loadSavedFromDB("2024");
    } else {
      setMessage("No token found. Please login.");
    }
  }, [token]);

  useEffect(() => {
    // When the user switches year, try to load saved DB data for that year
    // This will auto-extract months from the data for the selected year
    if (selectedYear && token) {
      loadSavedFromDB(selectedYear);
    }
  }, [selectedYear, token]);

  async function loadExcel(year = "2024") {
    if (!token) {
      setMessage("No token found. Please login.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Request excel file from backend - fallback file currently serves 2024
      // We include year param in case backend later supports year-specific excel files
      const resp = await API.get(`/maintenance/excel-file?year=${year}`, {
        responseType: 'arraybuffer'
      });

      const ab = resp.data;
      const wb = XLSX.read(ab, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

      if (!Array.isArray(json) || json.length < 2) {
        setMessage("Excel empty or invalid format.");
        setLoading(false);
        return;
      }

      const headerRow = json[0];
      const monthCols = [];

      for (let c = 2; c < headerRow.length; c++) {
        const cell = headerRow[c];
        if (cell) monthCols.push({ index: c, label: cell });
      }

      if (monthCols.length === 0) {
        const fallback = ["Apr-2024","May-2024","Jun-2024","Jul-2024","Aug-2024","Sep-2024","Oct-2024","Nov-2024","Dec-2024"];
        fallback.forEach((m, i) => monthCols.push({ index: 2 + i, label: m }));
      }

      const rows = json.slice(1).filter(r => {
        if (!Array.isArray(r) || r.length <= 1) return false;
        // Filter out placeholder/header rows
        const firstCell = r[0]?.toString().toLowerCase().trim() || "";
        const secondCell = r[1]?.toString().toLowerCase().trim() || "";
        if (firstCell === "office/sho" || firstCell === "office/shop" || 
            secondCell === "name of the owner" || secondCell === "name of the o") {
          return false;
        }
        return true;
      });

      const cleaned = rows.map(r => {
        const unit = r[0]?.toString().trim() || "";
        const owner = r[1]?.toString().trim() || "";

        const isOffice = /office/i.test(unit);
        const isShop = /shop/i.test(unit);
        const defaultAmt = isOffice ? 2000 : isShop ? 1500 : 0;

        const monthsObj = {};
        const pendingObj = {};

        monthCols.forEach(mc => {
          const cell = r[mc.index];
          monthsObj[mc.label] = cell ? cell.toString() : "";
          pendingObj[mc.label] = cell ? 0 : defaultAmt;
        });

        return {
          unit,
          owner,
          type: isOffice ? "office" : isShop ? "shop" : "other",
          months: monthsObj,
          pending: pendingObj,
          extra: ""
        };
      });

      setTable(cleaned || []);
      setMonths(monthCols.map(m => m.label) || []);

      window.maintenanceTable = cleaned;

      setMessage(`Excel loaded successfully for ${year}.`);
    } catch (err) {
      setMessage("Excel load error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateCell(rowIndex, month, value) {
    setTable(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex] };

      copy[rowIndex].months = { ...copy[rowIndex].months, [month]: value };
      copy[rowIndex].pending = {
        ...copy[rowIndex].pending,
        [month]: value === "" ? (copy[rowIndex].type === "office" ? 2000 : 1500) : 0,
      };

      window.maintenanceTable = copy;
      return copy;
    });
  }

  async function saveToServer() {
    try {
      if (!token) return setMessage("No token found — please login before saving.");

      setMessage("Saving...");
      // Save for selected year only to avoid replacing other-year data
      const resp = await API.post(`/maintenance/save?year=${selectedYear}`, { table });

      setMessage(resp.data.message || "Saved successfully.");
    } catch (err) {
      setMessage("Save error: " + (err.response?.data?.message || err.message));
    }
  }

  async function loadSavedFromDB(year = "2024") {
    try {
      if (!token) return setMessage("No token found. Please login.");

      setLoading(true);
      setMessage(`Loading saved DB for ${year}...`);
      // pass the year to backend which has year-aware filtering
      const resp = await API.get(`/maintenance/get?year=${year}`);

      const data = resp.data;
      const arr =
        Array.isArray(data)
          ? data
          : Array.isArray(data.table)
          ? data.table
          : [];

      setTable(arr);
      window.maintenanceTable = arr;

      // Extract months dynamically from the first record's months keys
      // This ensures we show the correct year's columns (2024, 2025, etc.)
      if (arr.length > 0 && arr[0].months) {
        const extractedMonths = Object.keys(arr[0].months || {});
        setMonths(extractedMonths);
      } else {
        setMonths([]);
      }

      if ((arr || []).length === 0) {
        setMessage(`No records found in DB for ${year}.`);
      } else {
        setMessage(`Loaded ${arr.length} records from DB for ${year}.`);
      }
    } catch (err) {
      setMessage("DB load error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!table.length) return setMessage("Nothing to export.");

    const header = ["Unit", "Owner", ...months, "Total Maintenance", "Extra", "Pending Total"].join(",");

    const rows = table.map(r => {
      const total = months.reduce((s, m) => s + (Number(r.months[m] || 0)), 0);
      const pending = Object.values(r.pending).reduce((s, p) => s + Number(p || 0), 0);

      return [
        r.unit,
        r.owner,
        ...months.map(m => r.months[m] || ""),
        total,
        r.extra || "",
        pending
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `maintenance_${selectedYear}.csv`;
    a.click();

    setMessage("CSV Exported");
  }

  // SAFETY CHECKS TO PREVENT CRASH
  if (!Array.isArray(months)) return <h2>Loading...</h2>;
  if (!Array.isArray(table)) return <h2>Loading...</h2>;

  const monthlyTotals = {};
  months.forEach((m) => {
    monthlyTotals[m] = table.reduce((sum, row) => {
      const raw = row.months?.[m];
      const val = raw === "" || raw === null || raw === undefined ? 0 : Number(String(raw).replace(/,/g, "")) || 0;
      return sum + val;
    }, 0);
  });

  const grandTotal = Object.values(monthlyTotals).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="maintenance-container">
      {/* HEADER */}
      <div className="maintenance-header">
        <div className="header-content">
          <h1 className="header-title">Maintenance Collection</h1>
          <p className="header-subtitle">Maintenance — Year {selectedYear} — Manage monthly maintenance payments</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-label">Grand Total</span>
            <span className="stat-value">₹{grandTotal.toLocaleString()}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Units</span>
            <span className="stat-value">{table.length}</span>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="maintenance-controls">
        {message && (
          <div className={`message-box ${message.includes("Saved") || message.includes("Loading") || message.includes("Exported") ? "success" : "info"}`}>
            <FaCheckCircle /> {message}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="year-toggle">
            <button
              className={`year-btn ${selectedYear === "2024" ? "active" : ""}`}
              onClick={() => setSelectedYear("2024")}
            >
              2024
            </button>
            <button
              className={`year-btn ${selectedYear === "2025" ? "active" : ""}`}
              onClick={() => setSelectedYear("2025")}
            >
              2025
            </button>
          </div>

          <div className="button-group">
            <button className="btn btn-load" onClick={() => loadSavedFromDB(selectedYear)} disabled={loading}>
              <FaSync /> Load Saved
            </button>
            <button className="btn btn-save" onClick={saveToServer} disabled={loading || table.length === 0}>
              <FaSave /> Save to DB
            </button>
            <button className="btn btn-export" onClick={exportCSV} disabled={loading || table.length === 0}>
              <FaFileExcel /> Export CSV
            </button>
            <button className="btn btn-menu" onClick={() => setOverlayOpen(true)}>
              <FaBars /> Options
            </button>
          </div>
        </div>
      </div>

      <OverlayMenu
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onOpenTable={() => {}}
        onLoadSaved={() => loadSavedFromDB(selectedYear)}
        onSaveServer={saveToServer}
        onExportCSV={exportCSV}
      />

      {/* MAIN CONTENT */}
      <main className="maintenance-main">
        {loading ? (
          <div className="loading-state">
            <p>Loading maintenance data...</p>
          </div>
        ) : table.length === 0 ? (
          <div className="empty-state">
            <p>No data loaded</p>
            <span>Click "Load Saved" to load maintenance records</span>
          </div>
        ) : (
          <>
            {/* SEARCH BAR */}
            <div className="maintenance-search">
              <input
                type="text"
                placeholder="🔍 Search by unit or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="maintenance-table-wrapper">
              <div className="scroll-indicator">← Scroll →</div>
              <div className="table-scroll">
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th className="col-unit">Unit</th>
                      <th className="col-owner">Owner</th>
                      {(months || []).map(m => (
                        <th key={m} className="col-month">{m}</th>
                      ))}
                      <th className="col-total">Total</th>
                      <th className="col-extra">Extra</th>
                      <th className="col-pending">Pending</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(table || [])
                      .filter(r => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          r.unit.toLowerCase().includes(search) ||
                          r.owner.toLowerCase().includes(search)
                        );
                      })
                      .map((r, i) => {
                        const totalMaintenance = months.reduce(
                          (sum, m) => sum + (Number(r.months[m] || 0)),
                          0
                        );

                        const pendingTotal = Object.values(r.pending || {}).reduce(
                          (s, p) => s + (Number(p) || 0),
                          0
                    );

                    return (
                      <tr key={i}>
                        <td className="col-unit">
                          <input
                            className="cell-input"
                            value={r.unit || ""}
                            onChange={e =>
                              setTable(prev => {
                                const c = [...prev];
                                c[i] = { ...c[i], unit: e.target.value };
                                return c;
                              })
                            }
                          />
                        </td>

                        <td className="col-owner">
                          <input
                            className="cell-input"
                            value={r.owner || ""}
                            onChange={e =>
                              setTable(prev => {
                                const c = [...prev];
                                c[i] = { ...c[i], owner: e.target.value };
                                return c;
                              })
                            }
                          />
                        </td>

                        {(months || []).map(m => (
                          <td key={m} className="col-month">
                            <SmallInput
                              value={r.months?.[m] || ""}
                              onChange={v => updateCell(i, m, v)}
                            />
                          </td>
                        ))}

                        <td className="col-total">
                          <span className="total-value">₹{totalMaintenance.toLocaleString()}</span>
                        </td>

                        <td className="col-extra">
                          <input
                            className="cell-input"
                            value={r.extra || ""}
                            onChange={e =>
                              setTable(prev => {
                                const c = [...prev];
                                c[i] = { ...c[i], extra: e.target.value };
                                return c;
                              })
                            }
                          />
                        </td>

                        <td className="col-pending">
                          <span className="pending-value">₹{pendingTotal.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* MONTHLY TOTALS */}
                  <tr className="totals-row monthly-totals">
                    <td colSpan={2} className="totals-label">MONTHLY TOTAL</td>
                    {(months || []).map((m) => (
                      <td key={m} className="total-cell">₹{monthlyTotals[m]?.toLocaleString()}</td>
                    ))}
                    <td className="grand-cell">₹{grandTotal.toLocaleString()}</td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* GRAND TOTAL */}
                  <tr className="totals-row grand-total">
                    <td colSpan={2 + (months?.length || 0)} className="totals-label">GRAND TOTAL (ALL MONTHS)</td>
                    <td className="grand-cell">₹{grandTotal.toLocaleString()}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  );
}
