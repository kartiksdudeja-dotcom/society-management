import React, { useEffect, useState, useMemo } from "react";
import API from "../services/api";

export default function BalanceCard({ user }) {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long" }).toUpperCase());
  const [yearlyMaintenance, setYearlyMaintenance] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [totalCollectionBalance, setTotalCollectionBalance] = useState(0);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  
  // Current month's bank data
  const [currentMonthCollection, setCurrentMonthCollection] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);

  // Load data once on mount
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [maintResponse, expenseResponse, bankResponse, monthlyExpResponse] = await Promise.all([
          API.get("/maintenance/get"),
          API.get("/expense/get"),
          API.get(`/bank?month=${currentMonth}&year=${currentYear}`),
          API.get(`/monthly-expense/summary?month=${currentMonth}&year=${currentYear}`)
        ]);

        setMaintenanceData(maintResponse.data);
        setExpenseData(expenseResponse.data);
        
        // Calculate current month collection from bank (credits)
        const bankData = bankResponse.data.data || [];
        const credits = bankData.filter(t => t.type === "credit");
        const creditTotal = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
        setCurrentMonthCollection(creditTotal);
        
        // Current month expenses
        setCurrentMonthExpenses(monthlyExpResponse.data.total || 0);
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading balance data:", err);
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Recalculate when year/month changes (no API calls needed)
  useMemo(() => {
    if (!maintenanceData || !expenseData) return;

    const parseAmount = (value) => {
      if (!value) return 0;
      const cleaned = String(value).replace(/,/g, '').trim();
      const n = Number(cleaned);
      return isNaN(n) ? 0 : n;
    };

    let yearlyMaintTotal = 0;
    let monthlyExpTotal = 0;
    let totalMaint = 0;
    let totalExp = 0;

    // Calculate maintenance
    if (Array.isArray(maintenanceData)) {
      maintenanceData.forEach((row) => {
        const months = row.months || {};
        Object.entries(months).forEach(([month, amount]) => {
          const parsedAmount = parseAmount(amount);
          totalMaint += parsedAmount;
          if (month.includes(selectedYear)) {
            yearlyMaintTotal += parsedAmount;
          }
        });
      });
    }

    // Calculate expenses
    if (Array.isArray(expenseData) && expenseData[0]) {
      const expenseDoc = expenseData[0];
      Object.keys(expenseDoc).forEach(key => {
        if (key !== '_id' && key !== '__v' && expenseDoc[key] && expenseDoc[key].total) {
          totalExp += parseAmount(expenseDoc[key].total);
        }
      });
    
      const expenseMonthKey = selectedMonth.toUpperCase();
      if (selectedYear === '2024' && expenseDoc[expenseMonthKey] && expenseDoc[expenseMonthKey].total) {
        monthlyExpTotal = parseAmount(expenseDoc[expenseMonthKey].total);
      }
    }

    setTotalCollectionBalance(totalMaint - totalExp);
    setYearlyMaintenance(yearlyMaintTotal);
    setMonthlyExpense(monthlyExpTotal);
  }, [selectedYear, selectedMonth, maintenanceData, expenseData]);

  if (loading) {
    return (
      <div className="balance-card loading-skeleton">
        <div className="balance-header">
          <div className="skeleton-bar" style={{ width: '120px', height: '16px' }}></div>
          <button className="more-btn">⋮</button>
        </div>
        <div className="balance-amount">
          <div className="skeleton-bar" style={{ width: '180px', height: '36px' }}></div>
        </div>
        <div className="balance-selectors">
          <div className="skeleton-bar" style={{ width: '100%', height: '40px', marginBottom: '12px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card">
      <div className="balance-header">
        <span className="balance-label">Balance details</span>
        <button className="more-btn">⋮</button>
      </div>
      <div className="balance-amount">₹{totalCollectionBalance.toLocaleString()}</div>
      
      <div className="balance-selectors">
        <div className="selector-group">
          <label className="selector-label">Year:</label>
          <select 
            className="selector-input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString()).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label className="selector-label">Month:</label>
          <select 
            className="selector-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="JANUARY">January</option>
            <option value="FEBRUARY">February</option>
            <option value="MARCH">March</option>
            <option value="APRIL">April</option>
            <option value="MAY">May</option>
            <option value="JUNE">June</option>
            <option value="JULY">July</option>
            <option value="AUGUST">August</option>
            <option value="SEPTEMBER">September</option>
            <option value="OCTOBER">October</option>
            <option value="NOVEMBER">November</option>
            <option value="DECEMBER">December</option>
          </select>
        </div>
      </div>

      <div className="balance-details-grid">
        <div className="detail-item">
          <span className="detail-label">Yearly Maintenance ({selectedYear})</span>
          <span className="detail-value">₹{yearlyMaintenance.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Monthly Expense ({selectedMonth})</span>
          <span className="detail-value">₹{monthlyExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* Current Month Summary from Bank */}
      <div className="current-month-summary">
        <h4>This Month ({new Date().toLocaleString('default', { month: 'short' })} {new Date().getFullYear()})</h4>
        <div className="summary-row">
          <div className="summary-item collection">
            <span className="summary-label">Collection</span>
            <span className="summary-value">₹{currentMonthCollection.toLocaleString()}</span>
          </div>
          <div className="summary-item expense">
            <span className="summary-label">Expenses</span>
            <span className="summary-value">₹{currentMonthExpenses.toLocaleString()}</span>
          </div>
          <div className="summary-item net">
            <span className="summary-label">Net</span>
            <span className="summary-value">₹{(currentMonthCollection - currentMonthExpenses).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
