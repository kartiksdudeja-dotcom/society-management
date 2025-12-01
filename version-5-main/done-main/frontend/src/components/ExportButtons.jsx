import React, { useState } from "react";
import { FiDownload } from "react-icons/fi";
import { formatCurrency } from "../utils/formatCurrency";

const ExportButtons = ({ transactions, monthYear }) => {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = ["Date", "Narration", "Reference", "Debit", "Credit", "Balance"];
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString("en-IN"),
        t.subject,
        t.messageId.substring(0, 8),
        t.type === "debit" ? t.amount : "",
        t.type === "credit" ? t.amount : "",
        t.balance || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${monthYear}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = () => {
    setExporting(true);
    try {
      const json = JSON.stringify(transactions, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${monthYear}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("JSON export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportToCSV}
        disabled={exporting || !transactions.length}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        <FiDownload size={18} />
        Export CSV
      </button>
      <button
        onClick={exportToJSON}
        disabled={exporting || !transactions.length}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        <FiDownload size={18} />
        Export JSON
      </button>
    </div>
  );
};

export default ExportButtons;
