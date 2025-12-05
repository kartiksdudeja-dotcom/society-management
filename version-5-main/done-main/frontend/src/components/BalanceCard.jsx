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

  // Member personal maintenance data
  const [memberPaid, setMemberPaid] = useState(0);
  const [memberPending, setMemberPending] = useState(0);
  const [memberMonthsPaid, setMemberMonthsPaid] = useState([]);
  const [memberMonthsPending, setMemberMonthsPending] = useState([]);

  // Check if user is admin or manager
  const role = (user?.role || "user").toString().trim().toLowerCase();
  const isAdminOrManager = role === "admin" || role === "manager" || role === "1";
  
  // Check if admin is also a member (has a flat number in email like 104@icontower.com)
  const flatNumber = getFlatFromEmail(user?.email);
  const isAdminWithFlat = isAdminOrManager && flatNumber && user?.email !== 'admin@icontower.com';

  // Get flat number from email (e.g., 104@icontower.com -> 104)
  function getFlatFromEmail(email) {
    if (!email) return null;
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : null;
  }

  // Load data once on mount
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // For admin/manager, load full data
        if (isAdminOrManager) {
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

          // If admin also has a flat, calculate their personal maintenance too
          if (isAdminWithFlat) {
            const allData = maintResponse.data || [];
            const memberRecord = allData.find(record => {
              const recordUnit = String(record.unit || "").replace(/\D/g, '');
              return recordUnit === flatNumber;
            });

            if (memberRecord) {
              const months = memberRecord.months || {};
              const pending = memberRecord.pending || {};
              
              let totalPaid = 0;
              let totalPending = 0;
              const paidMonths = [];
              const pendingMonths = [];

              Object.entries(months).forEach(([month, amount]) => {
                const amt = parseFloat(String(amount).replace(/,/g, '')) || 0;
                if (amt > 0) {
                  totalPaid += amt;
                  paidMonths.push(month);
                }
              });

              Object.entries(pending).forEach(([month, amount]) => {
                const amt = parseFloat(String(amount).replace(/,/g, '')) || 0;
                if (amt > 0) {
                  totalPending += amt;
                  pendingMonths.push(month);
                }
              });

              setMemberPaid(totalPaid);
              setMemberPending(totalPending);
              setMemberMonthsPaid(paidMonths);
              setMemberMonthsPending(pendingMonths);
            }
          }
        } else {
          // For regular members, load their personal maintenance data
          const maintResponse = await API.get(`/maintenance/get?year=${currentYear}`);
          const allData = maintResponse.data || [];
          
          // Find this member's record by flat number
          const userFlat = getFlatFromEmail(user?.email);
          const memberRecord = allData.find(record => {
            const recordUnit = String(record.unit || "").replace(/\D/g, '');
            return recordUnit === userFlat;
          });

          if (memberRecord) {
            const months = memberRecord.months || {};
            const pending = memberRecord.pending || {};
            
            let totalPaid = 0;
            let totalPending = 0;
            const paidMonths = [];
            const pendingMonths = [];

            Object.entries(months).forEach(([month, amount]) => {
              const amt = parseFloat(String(amount).replace(/,/g, '')) || 0;
              if (amt > 0) {
                totalPaid += amt;
                paidMonths.push(month);
              }
            });

            Object.entries(pending).forEach(([month, amount]) => {
              const amt = parseFloat(String(amount).replace(/,/g, '')) || 0;
              if (amt > 0) {
                totalPending += amt;
                pendingMonths.push(month);
              }
            });

            setMemberPaid(totalPaid);
            setMemberPending(totalPending);
            setMemberMonthsPaid(paidMonths);
            setMemberMonthsPending(pendingMonths);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading balance data:", err);
        setLoading(false);
      }
    }

    loadData();
  }, [user, isAdminOrManager, isAdminWithFlat, flatNumber]);

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

  // Member view - show their personal maintenance status
  if (!isAdminOrManager) {
    const flatNumber = getFlatFromEmail(user?.email);
    return (
      <div className="balance-card member-view">
        <div className="balance-header">
          <span className="balance-label">My Maintenance Status</span>
          <span className="flat-badge">Flat: {flatNumber || 'N/A'}</span>
        </div>
        
        <div className="member-summary">
          <div className="member-stat paid">
            <span className="stat-icon">✓</span>
            <div className="stat-content">
              <span className="stat-label">Total Paid</span>
              <span className="stat-value">₹{memberPaid.toLocaleString()}</span>
            </div>
          </div>
          <div className="member-stat pending">
            <span className="stat-icon">⏳</span>
            <div className="stat-content">
              <span className="stat-label">Pending</span>
              <span className="stat-value">₹{memberPending.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {memberMonthsPending.length > 0 && (
          <div className="pending-months-alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Pending Months:</strong>
              <span>{memberMonthsPending.slice(0, 3).join(', ')}{memberMonthsPending.length > 3 ? ` +${memberMonthsPending.length - 3} more` : ''}</span>
            </div>
          </div>
        )}

        {memberPending === 0 && memberPaid > 0 && (
          <div className="all-clear-badge">
            <span>🎉 All dues cleared!</span>
          </div>
        )}
      </div>
    );
  }

  // Admin/Manager view - show full society data
  return (
    <div className="balance-card">
      <div className="balance-header">
        <span className="balance-label">Balance details</span>
        {isAdminWithFlat && <span className="flat-badge-small">Flat: {flatNumber}</span>}
        <button className="more-btn">⋮</button>
      </div>
      <div className="balance-amount">₹{totalCollectionBalance.toLocaleString()}</div>
      
      {/* Show personal maintenance status for admins who are also members */}
      {isAdminWithFlat && (
        <div className="admin-personal-status">
          <div className="personal-stat paid">
            <span className="stat-label">My Paid</span>
            <span className="stat-value">₹{memberPaid.toLocaleString()}</span>
          </div>
          <div className="personal-stat pending">
            <span className="stat-label">My Pending</span>
            <span className="stat-value">₹{memberPending.toLocaleString()}</span>
          </div>
          {memberPending === 0 && memberPaid > 0 && (
            <div className="personal-stat clear">
              <span>✓ Dues Clear</span>
            </div>
          )}
        </div>
      )}
      
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
