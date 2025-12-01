import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Line } from "react-chartjs-2";
import { FaSync, FaFileExcel } from "react-icons/fa";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function TotalCollection2024() {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [expenseData, setExpenseData] = useState({});
  const [finalData, setFinalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const months = [
    "Apr-2024",
    "May-2024",
    "Jun-2024",
    "Jul-2024",
    "Aug-2024",
    "Sep-2024",
    "Oct-2024",
    "Nov-2024",
    "Dec-2024",
  ];

  const monthMap = {
    "Apr-2024": "APRIL",
    "May-2024": "MAY",
    "Jun-2024": "JUNE",
    "Jul-2024": "JULY",
    "Aug-2024": "AUGUST",
    "Sep-2024": "SEPTEMBER",
    "Oct-2024": "OCTOBER",
    "Nov-2024": "NOVEMBER",
    "Dec-2024": "DECEMBER",
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const maint = await API.get("/maintenance/get");
      const expense = await API.get("/expense/get");

      setMaintenanceList(maint.data);
      setExpenseData(expense.data[0]);

      calculateTotals(maint.data, expense.data[0]);
    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  function parseAmount(value) {
    if (!value) return 0;
    
    // Remove any commas and convert to number
    const cleaned = String(value).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function calculateTotals(maintList, expDoc) {
    const results = [];

    months.forEach((month) => {
      const expenseKey = monthMap[month];

      let monthlyTotal = 0;

      maintList.forEach((row) => {
        const val = row.months?.[month];
        // Only add if value exists and is numeric
        if (val) {
          monthlyTotal += parseAmount(val);
        }
      });

      const expenseTotal = Number(expDoc?.[expenseKey]?.total || 0);
      const balance = monthlyTotal - expenseTotal;

      results.push({
        month,
        maintenance: monthlyTotal,
        expense: expenseTotal,
        balance,
      });
    });

    setFinalData(results);
  }

  function handleExport() {
    const csvContent = [
      ["Month", "Maintenance Total", "Expense Total", "Balance"],
      ...finalData.map(row => [row.month, row.maintenance, row.expense, row.balance])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "collection_2024.csv";
    a.click();
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading Total Collection 2024...</h2>
      </div>
    );
  }

  const filteredData = finalData.filter(row => 
    row.month.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMaintenance = finalData.reduce((sum, row) => sum + row.maintenance, 0);
  const totalExpense = finalData.reduce((sum, row) => sum + row.expense, 0);
  const totalBalance = finalData.reduce((sum, row) => sum + row.balance, 0);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Maintenance",
        data: finalData.map((m) => m.maintenance),
        borderColor: "#0f6d57",
        backgroundColor: "rgba(15, 109, 87, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Expense",
        data: finalData.map((m) => m.expense),
        borderColor: "#ff6b6b",
        backgroundColor: "rgba(255, 107, 107, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Balance",
        data: finalData.map((m) => m.balance),
        borderColor: "#4299e1",
        backgroundColor: "rgba(66, 153, 225, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="collection-container">
      <style>{`
        .collection-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8f0f5 0%, #f5fafb 100%);
          padding: 24px;
          font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .collection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 20px;
          animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-content h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a3a3a;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .header-subtitle {
          font-size: 14px;
          color: #7a8a99;
          margin: 0;
        }

        .header-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-box {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 252, 255, 0.95) 100%);
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.3s ease;
          min-width: 150px;
        }

        .stat-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-label {
          font-size: 12px;
          color: #7a8a99;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #0f6d57 0%, #148a6a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chart-section {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 252, 255, 0.95) 100%);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 28px;
          margin-bottom: 32px;
          animation: popIn 0.6s ease-out 0.1s backwards;
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a3a3a;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }

        .chart-container {
          height: 350px;
          position: relative;
        }

        .search-section {
          margin-bottom: 24px;
          animation: slideDown 0.6s ease-out;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #d0d8e0;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          color: #1a3a3a;
          font-family: "Poppins", sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .search-input::placeholder {
          color: #a0aeb8;
        }

        .search-input:focus {
          outline: none;
          border-color: #0f6d57;
          box-shadow: 0 6px 20px rgba(15, 109, 87, 0.15);
          background: rgba(255, 255, 255, 1);
        }

        .controls {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 12px;
          font-family: "Poppins", sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .btn-refresh {
          background: linear-gradient(135deg, #7cc7b9 0%, #a9e6d8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(127, 199, 185, 0.25);
          border: 1px solid rgba(127, 199, 185, 0.3);
        }

        .btn-refresh:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(127, 199, 185, 0.35);
        }

        .btn-export {
          background: linear-gradient(135deg, #4299e1 0%, #90cdff 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.25);
          border: 1px solid rgba(66, 153, 225, 0.3);
        }

        .btn-export:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(66, 153, 225, 0.35);
        }

        .table-section {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 252, 255, 0.95) 100%);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          overflow: hidden;
          animation: popIn 0.6s ease-out 0.2s backwards;
        }

        .table-scroll {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 70vh;
        }

        .collection-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .collection-table thead {
          background: linear-gradient(135deg, #f0f5f8 0%, #e8f2f6 100%);
          border-bottom: 2px solid rgba(15, 109, 87, 0.1);
          position: sticky;
          top: 0;
        }

        .collection-table thead th {
          padding: 12px 16px;
          text-align: left;
          color: #1a3a3a;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(15, 109, 87, 0.06);
        }

        .collection-table thead th:last-child {
          border-right: none;
        }

        .collection-table tbody tr {
          border-bottom: 1px solid rgba(15, 109, 87, 0.06);
          transition: all 0.2s ease;
          animation: rowFade 0.4s ease-out;
        }

        @keyframes rowFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .collection-table tbody tr:hover {
          background: linear-gradient(135deg, rgba(15, 109, 87, 0.04) 0%, rgba(127, 199, 185, 0.04) 100%);
          box-shadow: inset 0 0 0 1px rgba(15, 109, 87, 0.08);
        }

        .collection-table tbody tr.totals-row {
          background: linear-gradient(135deg, #d4e6f7 0%, #d4e8ff 100%);
          font-weight: 600;
          color: #0f6d57;
          border-top: 2px solid rgba(15, 109, 87, 0.2);
        }

        .collection-table td {
          padding: 12px 16px;
          color: #1a3a3a;
          border-right: 1px solid rgba(15, 109, 87, 0.06);
        }

        .collection-table td:last-child {
          border-right: none;
        }

        .col-month {
          font-weight: 600;
          color: #0f6d57;
          width: 25%;
        }

        .col-maintenance {
          text-align: right;
          width: 25%;
          color: #0f6d57;
          font-weight: 500;
        }

        .col-expense {
          text-align: right;
          width: 25%;
          color: #ff6b6b;
          font-weight: 500;
        }

        .col-balance {
          text-align: right;
          width: 25%;
          font-weight: 600;
        }

        .col-balance.positive {
          color: #51cf66;
        }

        .col-balance.negative {
          color: #ff6b6b;
        }

        @media (max-width: 768px) {
          .collection-header {
            flex-direction: column;
          }

          .header-stats {
            width: 100%;
            justify-content: flex-start;
          }

          .stat-box {
            flex: 1;
            min-width: 120px;
          }

          .controls {
            justify-content: center;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="collection-header">
        <div className="header-content">
          <h1>Total Collection 2024</h1>
          <p className="header-subtitle">Monthly maintenance and expense analysis</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-label">Total Maintenance</span>
            <span className="stat-value">₹{totalMaintenance.toLocaleString()}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Expense</span>
            <span className="stat-value">₹{totalExpense.toLocaleString()}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Balance</span>
            <span className="stat-value">₹{totalBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="chart-section">
        <div className="chart-title">Collection Trend Analysis</div>
        <div className="chart-container">
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  font: { family: 'Poppins', size: 12 },
                  padding: 15,
                  usePointStyle: true,
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { font: { family: 'Poppins', size: 11 } }
              },
              x: {
                ticks: { font: { family: 'Poppins', size: 11 } }
              }
            }
          }} />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="search-section">
        <div className="controls">
          <button className="btn btn-refresh" onClick={loadData}>
            <FaSync /> Refresh Data
          </button>
          <button className="btn btn-export" onClick={handleExport}>
            <FaFileExcel /> Export CSV
          </button>
        </div>
        <input
          type="text"
          placeholder="🔍 Search by month..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* TABLE */}
      <div className="table-section">
        <div className="table-scroll">
          <table className="collection-table">
            <thead>
              <tr>
                <th className="col-month">Month</th>
                <th className="col-maintenance">Maintenance Total</th>
                <th className="col-expense">Expense Total</th>
                <th className="col-balance">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.month}>
                  <td className="col-month">{row.month}</td>
                  <td className="col-maintenance">₹{row.maintenance.toLocaleString()}</td>
                  <td className="col-expense">₹{row.expense.toLocaleString()}</td>
                  <td className={`col-balance ${row.balance >= 0 ? 'positive' : 'negative'}`}>
                    ₹{row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="totals-row">
                <td className="col-month">TOTAL</td>
                <td className="col-maintenance">₹{totalMaintenance.toLocaleString()}</td>
                <td className="col-expense">₹{totalExpense.toLocaleString()}</td>
                <td className={`col-balance ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
                  ₹{totalBalance.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
