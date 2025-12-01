import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Expense2024.css";

export default function Expense2024Page() {
  const [monthsData, setMonthsData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpense();
  }, []);

  const loadExpense = async () => {
    try {
      const res = await API.get("/expense/get");

      if (!res.data.length) return;

      const doc = res.data[0]; // 1 document
      const months = Object.keys(doc).filter(
        (k) => k !== "_id" && k !== "__v"
      );

      setMonthsData(doc);
      setSelectedMonth(months[0]); // default: APRIL
    } catch (err) {
      console.error("Error loading expense:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <h2>Loading Expense Sheet 2024...</h2>;

  if (!selectedMonth)
    return <h2 style={{ color: "red" }}>No Expense Data Found in MongoDB</h2>;

  const monthInfo = monthsData[selectedMonth];

  return (
    <div className="expense-page">
      <h1>Expense Sheet - 2024</h1>

      {/* MONTH SELECT DROPDOWN */}
      <div className="month-select">
        <label>Select Month: </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {Object.keys(monthsData)
            .filter((k) => k !== "_id" && k !== "__v")
            .map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
        </select>
      </div>

      <h2>{selectedMonth}</h2>

      {/* TABLE WRAPPER */}
      <div className="expense-table-wrapper">
        <div className="table-container">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Date</th>
                <th>Name</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {monthInfo.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.sl_no}</td>
                  <td>{item.date}</td>
                  <td>{item.name}</td>
                  <td>{item.amount}</td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan="3">Total</td>
                <td>{monthInfo.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
