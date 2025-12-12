import React from "react";
import "./TableCard.css";

export default function TableCard({ data, columns, title }) {
  if (!data || data.length === 0) {
    return <div className="table-card-empty">No data available</div>;
  }

  return (
    <div className="table-card-wrapper">
      <div className="table-card-title">{title}</div>
      <div className="table-card">
        {/* Desktop Table View */}
        <table className="table-card-desktop">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`table-header-${col.key}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key} className={`table-cell-${col.key}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="table-card-mobile">
          {data.map((row, idx) => (
            <div key={idx} className="table-card-item">
              {columns.map((col) => (
                <div key={col.key} className="table-card-field">
                  <span className="table-card-label">{col.label}</span>
                  <span className="table-card-value">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
