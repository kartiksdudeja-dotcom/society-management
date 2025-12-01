import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function PendingMaintenancePage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    const res = await API.get("/maintenance/get");
    const data = res.data;

    const pendingOnly = data.filter(r => {
      const pendingTotal = Object.values(r.pending || {})
        .reduce((a, b) => a + Number(b || 0), 0);
      return pendingTotal > 0;
    });

    setRows(pendingOnly);
  };

  return (
    <div className="page">
      <h2>Maintenance Pending</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Owner</th>
            <th>Total Pending</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => {
            const totalPending = Object.values(row.pending).reduce((a, b) => a + Number(b || 0), 0);
            return (
              <tr key={i}>
                <td>{row.unit}</td>
                <td>{row.owner}</td>
                <td style={{ color: "red" }}>{totalPending}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
