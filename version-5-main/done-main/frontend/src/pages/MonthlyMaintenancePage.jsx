import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./MonthlyCollectionPage.css";

export default function MonthlyCollectionPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState([]);
  const [members, setMembers] = useState([]);

  // -------------------------------------------------------
  // 1️⃣ LOAD MEMBERS (ONLY ONCE)
  // -------------------------------------------------------
  useEffect(() => {
    const loadMembers = async () => {
      const res = await API.get("/admin/members");
      setMembers(res.data || []);
    };
    loadMembers();
  }, []);

  // -------------------------------------------------------
  // 2️⃣ MATCHING LOGIC
  // -------------------------------------------------------
  function matchUser(narration) {
    if (!narration) return { name: "Unknown", flat: "--" };

    const text = narration.toLowerCase();

    // 1) Match by Flat Number
    const flatMatch = members.find(
      (m) =>
        m.FlatNumber &&
        text.includes(m.FlatNumber.toString().toLowerCase())
    );
    if (flatMatch) {
      return { name: flatMatch.name, flat: flatMatch.FlatNumber };
    }

    // 2) Match by S.NO (Shop / Office)
    const snoMatch = members.find(
      (m) =>
        m.s_no &&
        text.includes(m.s_no.toString().toLowerCase())
    );
    if (snoMatch) {
      return { name: snoMatch.name, flat: snoMatch.s_no };
    }

    // 3) Match by Partial Name (Example: HARSHAL, PRIYANKA)
    const nameMatch = members.find((m) =>
      m.name?.toLowerCase().split(" ").some((w) => text.includes(w))
    );
    if (nameMatch) {
      return { name: nameMatch.name, flat: nameMatch.FlatNumber || "--" };
    }

    // NO MATCH → return defaults
    return { name: "Unknown", flat: "--" };
  }

  // -------------------------------------------------------
  // 3️⃣ LOAD BANK TRANSACTIONS
  // -------------------------------------------------------
  const load = async () => {
    const res = await API.get(`/bank?month=${month}&year=${year}`);
    const list = res.data.data || [];

    const enhanced = list.map((t) => {
      const matched = matchUser(t.narration);
      return {
        ...t,
        matchedName: matched.name,
        matchedFlat: matched.flat,
      };
    });

    setData(enhanced);
  };

  useEffect(() => {
    load();
  }, [month, year, members]);

  // -------------------------------------------------------
  // 4️⃣ UI
  // -------------------------------------------------------
  return (
    <div className="mc-container">
      <h1 className="mc-title">Monthly Maintenance Collection</h1>

      <div className="mc-filter">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {[
            "January","February","March","April","May","June",
            "July","August","September","October","November","December",
          ].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      <div className="mc-table-box">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Flat/Office/Shop</th>
              <th>Amount</th>
              <th>Narration</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">No transactions found</td>
              </tr>
            ) : (
              data.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.matchedName}</td>
                  <td>{t.matchedFlat}</td>
                  <td>₹{t.amount}</td>
                  <td>{t.narration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
