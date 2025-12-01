# Admin Bank Dashboard - Setup Guide

## 📁 File Structure Created

```
frontend/src/
├── pages/
│   └── AdminBankDashboard.jsx       ✅ Main dashboard page
│
├── components/
│   ├── AdminHeader.jsx               ✅ HDFC-style header
│   ├── ThemeToggle.jsx               ✅ Light/Dark mode toggle
│   ├── BankSummaryCard.jsx           ✅ Summary cards (Credit/Debit/Balance)
│   ├── BankFilterBar.jsx             ✅ Search + filters
│   ├── BankTransactionTable.jsx      ✅ Main transactions table
│   ├── ExportButtons.jsx             ✅ CSV/JSON export
│   └── NewTransactionAlert.jsx       ✅ Real-time notification
│
├── routes/
│   └── ProtectedAdminRoute.jsx       ✅ Admin-only access wrapper
│
├── utils/
│   ├── formatCurrency.js             ✅ Currency formatting
│   └── dateHelpers.js                ✅ Date utilities
│
└── styles/
    └── (Uses TailwindCSS - no separate CSS needed)
```

## 🚀 Integration Steps

### Step 1: Install Dependencies
```bash
npm install axios react-icons recharts
```

### Step 2: Add Route to App.js
```jsx
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import AdminBankDashboard from "./pages/AdminBankDashboard";

// Inside your Routes:
<Route
  path="/admin/bank"
  element={
    <ProtectedAdminRoute user={user}>
      <AdminBankDashboard user={user} onLogout={handleLogout} />
    </ProtectedAdminRoute>
  }
/>
```

### Step 3: Ensure Backend Routes Available
```
GET /api/bank/today    → For summary
GET /api/bank/month    → For monthly stats
GET /api/bank/list     → For all transactions
```

## 🎨 Features Implemented

✅ HDFC NetBanking UI Design  
✅ Admin-only access (role-based)  
✅ Real-time transaction updates (30-second refresh)  
✅ New transaction notifications  
✅ Advanced filtering (search, date range, type)  
✅ Export to CSV & JSON  
✅ Light/Dark theme toggle  
✅ Responsive design (mobile-friendly)  
✅ Summary cards with icons  
✅ Professional styling with TailwindCSS  

## 📊 API Integration

All components use `/api/bank/` endpoints:
- `BankSummaryCard` uses data from `/api/bank/month`
- `BankTransactionTable` uses data from `/api/bank/list`
- Export functions work with all transaction data
- New transaction alerts fetch from `/api/bank/list`

## 🔐 Access Control

Only users with `role === "admin"` can access:
- `/admin/bank` - Redirects to login if not admin

## 🎯 Customization

### Change Theme Colors
Edit `BankSummaryCard.jsx` - modify the `colors` object:
```jsx
const colors = {
  credit: "bg-gradient-to-br from-green-50 to-green-100",
  // ... etc
};
```

### Adjust Refresh Rate
In `AdminBankDashboard.jsx`, line 48:
```jsx
const interval = setInterval(fetchData, 30000); // Change 30000 to milliseconds
```

### Modify Table Columns
Edit `BankTransactionTable.jsx` to add/remove columns

## ✨ Testing

1. Login as admin user
2. Navigate to `/admin/bank`
3. Should see:
   - 4 summary cards (Credit, Debit, Net, Count)
   - Filter bar with search
   - Export buttons
   - Transaction table
4. Test filters and search
5. Test export (CSV/JSON)

## 📝 Notes

- Components use React hooks (useState, useEffect)
- Axios configured for localhost:5000 backend
- All styling done with TailwindCSS (no external CSS)
- Responsive grid: 1 col on mobile, 4 cols on desktop
- Auto-refresh every 30 seconds
- Real-time notifications for new transactions
