import React, { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import ICONTOWERQR from "../assets/ICONTOWERQR.jpg";

export default function BalanceCard({ user }) {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long" }).toUpperCase());
  const [yearlyMaintenance, setYearlyMaintenance] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [totalCollectionBalance, setTotalCollectionBalance] = useState(0);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  
  // Current month's bank data
  const [currentMonthCollection, setCurrentMonthCollection] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);

  // Member payment status from Monthly Collection (Bank)
  const [currentMonthPaid, setCurrentMonthPaid] = useState(false);
  const [currentMonthAmount, setCurrentMonthAmount] = useState(0);
  const [memberUnitType, setMemberUnitType] = useState("office");
  const [monthlyDues, setMonthlyDues] = useState(2000);
  const [paymentSource, setPaymentSource] = useState(""); // "bank" or "verified"

  // Payment proof upload states
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    paymentMode: "NEFT",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  // Check if user is admin or manager
  const role = (user?.role || "user").toString().trim().toLowerCase();
  const isAdminOrManager = role === "admin" || role === "manager" || role === "1";
  
  // Get flat number from email (e.g., 104@icontower.com -> 104)
  function getFlatFromEmail(email) {
    if (!email) return null;
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : null;
  }
  
  // Check if admin is also a member (has a flat number in email)
  const flatNumber = getFlatFromEmail(user?.email);
  const isAdminWithFlat = isAdminOrManager && flatNumber && user?.email !== 'admin@icontower.com';

  // Determine unit type and monthly dues
  function getUnitTypeAndDues(flatNum) {
    const num = parseInt(flatNum);
    if (num >= 1 && num <= 9) {
      return { type: "shop", dues: 1500 };
    }
    return { type: "office", dues: 2000 };
  }

  // Submit payment proof
  const handleProofSubmit = async () => {
    if (!proofFile) {
      alert("Please select a payment proof image");
      return;
    }

    setProofLoading(true);
    try {
      const formData = new FormData();
      formData.append("proofImage", proofFile);
      formData.append("flat", flatNumber || user?.email?.split("@")[0]);
      formData.append("ownerName", user?.name || "");
      formData.append("amount", monthlyDues);
      formData.append("monthYear", `${selectedMonth}-${selectedYear}`);
      formData.append("paymentDetails", JSON.stringify(paymentDetails));

      const response = await API.post("/payment-verifications/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Payment proof submitted successfully! Manager will review it soon.");
      setShowProofUpload(false);
      setProofFile(null);
      setPaymentDetails({
        transactionId: "",
        paymentMode: "NEFT",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error submitting proof:", error);
      alert("❌ " + (error.response?.data?.error || "Failed to submit payment proof"));
    } finally {
      setProofLoading(false);
    }
  };

  // Load data once on mount
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const userFlat = getFlatFromEmail(user?.email);

        // Get unit type and dues for this user
        if (userFlat) {
          const { type, dues } = getUnitTypeAndDues(userFlat);
          setMemberUnitType(type);
          setMonthlyDues(dues);
        }

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

          // If admin also has a flat, check if they paid this month in Monthly Collection
          if (isAdminWithFlat && flatNumber) {
            const memberPayment = credits.find(t => {
              const txnFlat = String(t.flat || "").replace(/\D/g, '');
              return txnFlat === flatNumber;
            });
            
            if (memberPayment) {
              setCurrentMonthPaid(true);
              setCurrentMonthAmount(memberPayment.amount || 0);
            } else {
              setCurrentMonthPaid(false);
              setCurrentMonthAmount(0);
            }
          }
        } else {
          // For regular members, check Monthly Collection (bank) for their payment
          const bankResponse = await API.get(`/bank?month=${currentMonth}&year=${currentYear}`);
          const bankData = bankResponse.data.data || [];
          const credits = bankData.filter(t => t.type === "credit");
          
          // Check if this member's flat appears in this month's payments
          const memberPayment = credits.find(t => {
            const txnFlat = String(t.flat || "").replace(/\D/g, '');
            return txnFlat === userFlat;
          });
          
          if (memberPayment) {
            setCurrentMonthPaid(true);
            setCurrentMonthAmount(memberPayment.amount || 0);
            setPaymentSource("bank");
          } else {
            // Check if user has approved payment verification for this month
            const monthYearStr = `${currentMonthName.substring(0, 3)}-${currentYear}`;
            const verificationResponse = await API.get(`/payment-verifications?status=approved&flat=${userFlat}`);
            const verifications = verificationResponse.data.data || [];
            const approvedPayment = verifications.find(v => v.monthYear === monthYearStr);
            
            if (approvedPayment) {
              setCurrentMonthPaid(true);
              setCurrentMonthAmount(approvedPayment.amount || 0);
              setPaymentSource("verified");
            } else {
              setCurrentMonthPaid(false);
              setCurrentMonthAmount(0);
              setPaymentSource("");
            }
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

  // Recalculate when year/month changes (for admin view)
  useMemo(() => {
    if (!isAdminOrManager || !maintenanceData) return;
    
    // Calculate yearly maintenance total
    const yearData = maintenanceData.filter(record => {
      const months = record.months || {};
      return Object.keys(months).some(key => key.includes(selectedYear));
    });
    
    let yearTotal = 0;
    yearData.forEach(record => {
      const months = record.months || {};
      Object.entries(months).forEach(([key, value]) => {
        if (key.includes(selectedYear)) {
          yearTotal += parseFloat(String(value || '').replace(/,/g, '')) || 0;
        }
      });
    });
    setYearlyMaintenance(yearTotal);
    
    // Calculate monthly expense for selected month
    if (expenseData) {
      const monthIndex = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                         'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].indexOf(selectedMonth);
      const monthData = expenseData.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === monthIndex && expDate.getFullYear().toString() === selectedYear;
      });
      const monthTotal = monthData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      setMonthlyExpense(monthTotal);
    }
    
    // Calculate total collection balance
    let totalBalance = 0;
    maintenanceData.forEach(record => {
      const months = record.months || {};
      Object.values(months).forEach(value => {
        totalBalance += parseFloat(String(value || '').replace(/,/g, '')) || 0;
      });
    });
    setTotalCollectionBalance(totalBalance);
    
  }, [maintenanceData, expenseData, selectedYear, selectedMonth, isAdminOrManager]);

  if (loading) {
    return (
      <div className="balance-card loading">
        <div className="loading-spinner"></div>
        <span>Loading...</span>
      </div>
    );
  }

  // Member View - Check Monthly Collection (Bank) for paid status
  if (!isAdminOrManager) {
    const now = new Date();
    const currentMonthName = now.toLocaleString('default', { month: 'long' });
    
    return (
      <div className="balance-card member-view">
        <div className="balance-header">
          <span className="balance-label">Your Maintenance Status</span>
          <span className="flat-badge">Unit {flatNumber || "N/A"}</span>
        </div>
        
        {/* Current Month Status Banner */}
        <div className={`status-banner ${currentMonthPaid ? 'paid' : 'pending'}`}>
          {currentMonthPaid ? (
            <>
              <span className="status-icon">✓</span>
              <span className="status-text">{currentMonthName} Paid - ₹{currentMonthAmount.toLocaleString()}</span>
            </>
          ) : (
            <>
              <span className="status-icon">⚠️</span>
              <span className="status-text">{currentMonthName} Pending - ₹{monthlyDues.toLocaleString()} Due</span>
            </>
          )}
        </div>

        {/* Monthly Rate Info */}
        <div className="monthly-rate-info">
          <span>Monthly Maintenance:</span>
          <strong>₹{monthlyDues.toLocaleString()}/month</strong>
          <span className="rate-type">({memberUnitType === "shop" ? "Shop Rate" : "Office Rate"})</span>
        </div>
        
        {/* Payment Summary */}
        <div className="member-summary">
          <div className={`member-stat ${currentMonthPaid ? 'paid' : 'pending'}`}>
            <span className="stat-icon">{currentMonthPaid ? '✓' : '⏳'}</span>
            <div className="stat-content">
              <span className="stat-label">{currentMonthName} Status</span>
              <span className="stat-value">{currentMonthPaid ? 'PAID' : 'PENDING'}</span>
            </div>
          </div>
        </div>

        {currentMonthPaid && (
          <div className="all-clear-badge">
            <span>🎉 {currentMonthName} maintenance cleared! Thank you!</span>
            {paymentSource === "verified" && (
              <span className="payment-badge verified">✓ Verified by Manager</span>
            )}
            {paymentSource === "bank" && (
              <span className="payment-badge bank">✓ Bank Confirmed</span>
            )}
          </div>
        )}

        {!currentMonthPaid && (
          <div className="pending-months-alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Please pay your dues:</strong>
              <span>₹{monthlyDues.toLocaleString()} for {currentMonthName}</span>
            </div>
          </div>
        )}

        {/* Payment Proof Upload Option */}
        {!currentMonthPaid && (
          <div className="payment-proof-section">
            <button 
              className="proof-upload-btn"
              onClick={() => setShowProofUpload(!showProofUpload)}
            >
              {showProofUpload ? '✕ Hide Upload' : '📸 Upload Payment Proof'}
            </button>

            {showProofUpload && (
              <div className="proof-upload-modal">
                <h4>Upload Payment Screenshot</h4>
                <p className="proof-info">Already paid? Upload your payment screenshot and manager will verify & approve it.</p>
                
                <div className="form-group">
                  <label>Payment Screenshot *</label>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="file-input"
                  />
                  {proofFile && <span className="file-name">✓ {proofFile.name}</span>}
                </div>

                <div className="form-group">
                  <label>Transaction ID (optional)</label>
                  <input 
                    type="text"
                    placeholder="UTR/Transaction ID from receipt"
                    value={paymentDetails.transactionId}
                    onChange={(e) => setPaymentDetails({...paymentDetails, transactionId: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select
                    value={paymentDetails.paymentMode}
                    onChange={(e) => setPaymentDetails({...paymentDetails, paymentMode: e.target.value})}
                  >
                    <option>NEFT</option>
                    <option>UPI</option>
                    <option>IMPS</option>
                    <option>Cheque</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
                  <input 
                    type="date"
                    value={paymentDetails.paymentDate}
                    onChange={(e) => setPaymentDetails({...paymentDetails, paymentDate: e.target.value})}
                  />
                </div>

                <button 
                  className="submit-proof-btn"
                  onClick={handleProofSubmit}
                  disabled={proofLoading || !proofFile}
                >
                  {proofLoading ? '⏳ Uploading...' : '✓ Submit for Verification'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* QR Code Section */}
        <div className="qr-section">
          <button 
            className="qr-toggle-btn"
            onClick={() => setShowQR(!showQR)}
          >
            {showQR ? '✕ Hide QR' : '📱 Pay via UPI - Show QR'}
          </button>
          
          {showQR && (
            <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
              <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                <button className="qr-close-btn" onClick={() => setShowQR(false)}>✕</button>
                <h3>Scan to Pay Maintenance</h3>
                <div className="qr-container animated">
                  <img src={ICONTOWERQR} alt="Icon Tower Payment QR" className="qr-image" />
                </div>
                <p className="qr-hint">Icon Tower Society Bank Account</p>
                <p className="qr-amount">Amount: ₹{monthlyDues.toLocaleString()}</p>
                
                {/* UPI Deep Link - Opens payment app directly on mobile */}
                <a 
                  href={`upi://pay?pa=icontower@icici&pn=Icon%20Tower%20Society&am=${monthlyDues}&cu=INR&tn=Maintenance%20${flatNumber}`}
                  className="upi-pay-btn"
                >
                  📲 Tap to Pay ₹{monthlyDues.toLocaleString()}
                </a>
                <p className="upi-note">Works on mobile with GPay, PhonePe, Paytm</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin/Manager view - show full society data
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  
  return (
    <div className="balance-card">
      <div className="balance-header">
        <span className="balance-label">Society Balance</span>
        {isAdminWithFlat && <span className="flat-badge-small">Your Unit: {flatNumber}</span>}
        <button className="more-btn">⋮</button>
      </div>
      <div className="balance-amount">₹{totalCollectionBalance.toLocaleString()}</div>
      
      {/* Show personal maintenance status for admins who are also members */}
      {isAdminWithFlat && (
        <div className="admin-personal-status">
          <div className={`personal-stat ${currentMonthPaid ? 'paid' : 'pending'}`}>
            <span className="stat-label">Your {currentMonthName}</span>
            <span className="stat-value">
              {currentMonthPaid ? `✓ Paid ₹${currentMonthAmount.toLocaleString()}` : `⚠️ Pending ₹${monthlyDues.toLocaleString()}`}
            </span>
          </div>
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

      {/* QR Code Section for Admin */}
      <div className="qr-section">
        <button 
          className="qr-toggle-btn"
          onClick={() => setShowQR(!showQR)}
        >
          {showQR ? '✕ Hide QR' : '📱 Show Payment QR'}
        </button>
        
        {showQR && (
          <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
              <button className="qr-close-btn" onClick={() => setShowQR(false)}>✕</button>
              <h3>Society Payment QR</h3>
              <div className="qr-container animated">
                <img src={ICONTOWERQR} alt="Icon Tower Payment QR" className="qr-image" />
              </div>
              <p className="qr-hint">Icon Tower Society Bank Account</p>
              <a 
                href="upi://pay?pa=icontowersociety@okaxis&pn=Icon%20Tower%20Society&cu=INR"
                className="upi-pay-btn"
              >
                💳 Pay Now via UPI
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
