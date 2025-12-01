import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import * as XLSX from "xlsx";
import "./MonthStatement.css";

/**
 * MonthStatement Component
 * Displays monthly aggregated transactions with per-payer breakdown
 * Features: Month selection, type filtering, per-payer table, transaction expand, search, download
 */
const MonthStatement = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState("all"); // "all", "credit", "debit"
  const [sortBy, setSortBy] = useState("amount"); // "amount", "count", "date"
  const [searchQuery, setSearchQuery] = useState("");

  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [expandedPayerId, setExpandedPayerId] = useState(null);
  const [payerTransactions, setPayerTransactions] = useState(null);
  const [loadingPayerTxns, setLoadingPayerTxns] = useState(false);

  const [availableMonths, setAvailableMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);

  // ============================================
  // FETCH AVAILABLE MONTHS
  // ============================================
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoadingMonths(true);
        const res = await fetch("/api/bank/available-months-with-counts");
        const data = await res.json();
        if (data.success) {
          setAvailableMonths(data.months);
        }
      } catch (err) {
        console.error("Error fetching months:", err);
      } finally {
        setLoadingMonths(false);
      }
    };

    fetchMonths();
  }, []);

  // ============================================
  // FETCH MONTHLY STATEMENT
  // ============================================
  const fetchMonthlyStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStatement(null);
      setPayerTransactions(null);

      const queryParams = new URLSearchParams();
      if (typeFilter !== "all") queryParams.append("type", typeFilter);
      queryParams.append("sortBy", sortBy);

      const res = await fetch(
        `/api/bank/month/${selectedYear}/${selectedMonth}/aggregation?${queryParams}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch statement: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.success) {
        setStatement(data);
      } else {
        setError(data.message || "Failed to fetch statement");
      }
    } catch (err) {
      console.error("Error fetching monthly statement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, typeFilter, sortBy]);

  // Fetch statement on date or filter change
  useEffect(() => {
    fetchMonthlyStatement();
  }, [fetchMonthlyStatement]);

  // ============================================
  // FETCH PAYER TRANSACTIONS
  // ============================================
  const fetchPayerTransactions = useCallback(async (payerId) => {
    try {
      setLoadingPayerTxns(true);
      const encodedPayerId = encodeURIComponent(payerId);

      const res = await fetch(
        `/api/bank/month/${selectedYear}/${selectedMonth}/payer/${encodedPayerId}`
      );

      const data = await res.json();

      if (data.success) {
        setPayerTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching payer transactions:", err);
    } finally {
      setLoadingPayerTxns(false);
    }
  }, [selectedYear, selectedMonth]);

  // ============================================
  // HANDLE PAYER ROW EXPANSION
  // ============================================
  const handleExpandPayer = (payerId) => {
    if (expandedPayerId === payerId) {
      setExpandedPayerId(null);
      setPayerTransactions(null);
    } else {
      setExpandedPayerId(payerId);
      fetchPayerTransactions(payerId);
    }
  };

  // ============================================
  // FILTER PAYERS BY SEARCH QUERY
  // ============================================
  const filteredPayers = useMemo(() => {
    if (!statement?.perPayer) return [];

    return statement.perPayer.filter((payer) =>
      payer.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payer.vpa && payer.vpa.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [statement?.perPayer, searchQuery]);

  // ============================================
  // DOWNLOAD EXCEL
  // ============================================
  const handleDownloadExcel = async () => {
    try {
      const res = await fetch(
        `/api/bank/month/${selectedYear}/${selectedMonth}/export-excel`
      );

      if (!res.ok) {
        throw new Error("Failed to export statement");
      }

      const data = await res.json();

      if (data.success && data.data) {
        // Create worksheet from data
        const ws = XLSX.utils.json_to_sheet(data.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Statement");

        // Set column widths
        const colWidths = [25, 20, 15, 15, 15, 15, 12];
        ws["!cols"] = colWidths.map((w) => ({ wch: w }));

        // Generate file name
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        );
        const fileName = `Monthly_Statement_${monthName.replace(" ", "_")}.xlsx`;

        // Download
        XLSX.writeFile(wb, fileName);
      }
    } catch (err) {
      console.error("Error downloading Excel:", err);
      alert("Failed to download statement");
    }
  };

  // ============================================
  // RENDER TRANSACTION ROW
  // ============================================
  const TransactionRow = ({ index, style }) => {
    if (!payerTransactions?.transactions[index]) {
      return null;
    }

    const txn = payerTransactions.transactions[index];
    const isCredit = txn.type === "credit";

    return (
      <div style={style} className="transaction-row">
        <div className="txn-date">
          {new Date(txn.date).toLocaleDateString("en-IN")}
        </div>
        <div className="txn-description">{txn.description}</div>
        <div className={`txn-amount ${isCredit ? "credit" : "debit"}`}>
          {isCredit ? "+" : "-"}₹{txn.amount.toFixed(2)}
        </div>
        <div className="txn-reference">{txn.referenceNumber || "-"}</div>
      </div>
    );
  };

  // ============================================
  // RENDER PAYER ROW
  // ============================================
  const renderPayerRow = (payer) => {
    const isExpanded = expandedPayerId === payer.payerId;
    const isLoading = isExpanded && loadingPayerTxns;

    return (
      <div key={payer.payerId} className="payer-row">
        {/* Payer Header */}
        <div
          className={`payer-header ${isExpanded ? "expanded" : ""}`}
          onClick={() => handleExpandPayer(payer.payerId)}
        >
          <div className="payer-info">
            <button className="expand-btn">
              <span className={`arrow ${isExpanded ? "down" : "right"}`}>
                ▶
              </span>
            </button>
            <div className="payer-name">{payer.payerName}</div>
            {payer.vpa && <div className="payer-vpa">{payer.vpa}</div>}
          </div>

          <div className="payer-totals">
            <div className="total-item">
              <span className="label">Credit:</span>
              <span className="value credit">₹{payer.totalCredit.toFixed(2)}</span>
            </div>
            <div className="total-item">
              <span className="label">Debit:</span>
              <span className="value debit">₹{payer.totalDebit.toFixed(2)}</span>
            </div>
            <div className="total-item">
              <span className="label">Count:</span>
              <span className="value">{payer.transactionCount}</span>
            </div>
          </div>
        </div>

        {/* Transactions List (Expanded) */}
        {isExpanded && (
          <div className="payer-transactions">
            {isLoading ? (
              <div className="loading-message">Loading transactions...</div>
            ) : payerTransactions?.transactions?.length > 0 ? (
              <div className="transactions-container">
                <div className="transactions-header">
                  <div className="txn-date">Date</div>
                  <div className="txn-description">Description</div>
                  <div className="txn-amount">Amount</div>
                  <div className="txn-reference">Reference</div>
                </div>

                <List
                  height={Math.min(payerTransactions.transactions.length * 40, 300)}
                  itemCount={payerTransactions.transactions.length}
                  itemSize={40}
                  width="100%"
                >
                  {TransactionRow}
                </List>
              </div>
            ) : (
              <div className="loading-message">No transactions</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="month-statement-container">
      {/* Header */}
      <div className="statement-header">
        <h1>Monthly Statement</h1>
        <p>Aggregated transactions by payer with unit mapping</p>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        {/* Month Selection */}
        <div className="month-selector">
          <label htmlFor="month-select">Month:</label>
          <select
            id="month-select"
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              setSelectedYear(year);
              setSelectedMonth(month);
            }}
          >
            {loadingMonths && <option>Loading months...</option>}
            {!loadingMonths &&
              availableMonths.map((m) => (
                <option
                  key={`${m.year}-${m.month}`}
                  value={`${m.year}-${m.month}`}
                >
                  {m.year}-
                  {String(m.month).padStart(2, "0")} ({m.count})
                </option>
              ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="filter-group">
          <label>Type:</label>
          <div className="filter-buttons">
            {["all", "credit", "debit"].map((type) => (
              <button
                key={type}
                className={`filter-btn ${typeFilter === type ? "active" : ""}`}
                onClick={() => setTypeFilter(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="sort-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="amount">Amount (Highest)</option>
            <option value="count">Transaction Count</option>
            <option value="date">Latest Date</option>
          </select>
        </div>

        {/* Download Button */}
        <button className="btn-download" onClick={handleDownloadExcel}>
          📥 Download Excel
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading && <div className="loading-message">Loading statement...</div>}

      {/* Main Content */}
      {!loading && statement && (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-label">Total Credit</div>
              <div className="card-value credit">
                ₹{statement.monthTotals.totalCredit.toFixed(2)}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-label">Total Debit</div>
              <div className="card-value debit">
                ₹{statement.monthTotals.totalDebit.toFixed(2)}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-label">Net Amount</div>
              <div
                className={`card-value ${
                  statement.monthTotals.netAmount >= 0 ? "credit" : "debit"
                }`}
              >
                ₹{statement.monthTotals.netAmount.toFixed(2)}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-label">Transactions</div>
              <div className="card-value">{statement.monthTotals.transactionCount}</div>
            </div>
          </div>

          {/* Search Box */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search by payer name or VPA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Per-Payer Table */}
          <div className="payers-section">
            <h2>
              Per-Payer Summary ({filteredPayers.length} {filteredPayers.length === 1 ? "payer" : "payers"})
            </h2>

            {filteredPayers.length > 0 ? (
              <div className="payers-list">
                {filteredPayers.map((payer) => renderPayerRow(payer))}
              </div>
            ) : (
              <div className="no-results">No payers found matching your search</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthStatement;
