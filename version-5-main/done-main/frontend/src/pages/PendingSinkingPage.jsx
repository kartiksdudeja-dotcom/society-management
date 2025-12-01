import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function PendingSinkingFundPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    const res = await API.get("/sinkingfund/get");
    const data = res.data;

    const pendingOnly = data.filter(r => Number(r.pending) > 0);

    setRows(pendingOnly);
  };

  return (
    <div className="page">
      <h2>Sinking Fund Pending</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Owner</th>
            <th>Pending</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.unit}</td>
              <td>{row.owner}</td>
              <td style={{ color: "red" }}>{row.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
