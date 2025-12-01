import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./BankTransactionsPage.css";

export default function BankTransactionsPage() {
  const [month, setMonth] = useState("2025-11");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  const months = [
    { label: "October 2025", value: "2025-10" },
    { label: "November 2025", value: "2025-11" },
    { label: "December 2025", value: "2025-12" },
    { label: "January 2026", value: "2026-01" },
  ];

  const [rangeInfo, setRangeInfo] = useState("");

async function loadData() {
  try {
    setLoading(true);
    const [year, m] = month.split("-");
    const res = await api.get(`/bank?month=${m}&year=${year}`);

    if (res.data.ok) {
      setData(res.data.data);

      const start = new Date(year, Number(m) - 1, 1);
      const end = new Date(year, Number(m), 0);

      setRangeInfo(
        `Showing ${res.data.data.length} transactions from 
        ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
      );
    } else {
      setData([]);
      setRangeInfo("No transactions found.");
    }
  } catch (err) {
    console.log("Bank load error:", err);
    setData([]);
    setRangeInfo("Error loading data");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    try {
      setLoading(true);
      const [year, m] = month.split("-");
      const res = await api.get(`/bank?month=${m}&year=${year}`);

      if (res.data.ok) {
        const list = res.data.data;
        setData(list);

        // Calculate totals
        let credit = 0;
        let debit = 0;

        list.forEach((item) => {
          if (item.type === "credit") credit += item.amount;
          if (item.type === "debit") debit += item.amount;
        });

        setTotalCredit(credit);
        setTotalDebit(debit);

      } else {
        setData([]);
      }
    } catch (err) {
      console.log("Bank load error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  async function manualSync() {
    try {
      setLoading(true);
      await api.get("/bank/sync");
      await loadData();
    } catch (err) {
      console.log("Sync error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bt-wrapper">

      {/* HEADER */}
      <div className="bt-header-box glass-card">
        <h2 className="bt-title">Bank Transactions</h2>

        <div className="bt-flex-row">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bt-select"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button className="bt-sync-btn" onClick={manualSync}>
            🔄 Sync Emails
          </button>
        </div>
      </div>

      {/* TOTAL SUMMARY */}
      <div className="summary-row">

        <div className="summary-card glass-card credit-card">
          <h3>Total Collected</h3>
          <p>₹{totalCredit.toLocaleString()}</p>
        </div>

        <div className="summary-card glass-card debit-card">
          <h3>Total Expense</h3>
          <p>₹{totalDebit.toLocaleString()}</p>
        </div>

        <div className="summary-card glass-card net-card">
          <h3>Net Balance</h3>
          <p>₹{(totalCredit - totalDebit).toLocaleString()}</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="bt-table-card glass-card">
        {loading && <div className="bt-loading">Loading...</div>}

        <div className="bt-scroll">
          <table className="bt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Narration</th>
                <th>Ref No.</th>
                <th>Withdrawal</th>
                <th>Deposit</th>
              </tr>
            </thead>

            <tbody>
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">No Data Found</td>
                </tr>
              )}

              {data.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.narration || "-"}</td>
                  <td>{t.reference_no || "-"}</td>

                  <td className="debit">
                    {t.type === "debit" ? `₹${t.amount}` : "-"}
                  </td>

                  <td className="credit">
                    {t.type === "credit" ? `₹${t.amount}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
