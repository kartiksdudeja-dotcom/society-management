// ✅ EXAMPLE: How to integrate into your App.js

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import AdminBankDashboard from "./pages/AdminBankDashboard";

// Your existing pages/components
import LoginForm from "./pages/LoginForm";
import DashboardPage from "./pages/DashboardPage";
// ... other imports

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Error parsing user:", err);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} /> : <LoginForm onLogin={handleLogin} />}
        />

        {/* ✅ NEW: Admin Bank Dashboard Route */}
        <Route
          path="/admin/bank"
          element={
            <ProtectedAdminRoute user={user}>
              <AdminBankDashboard user={user} onLogout={handleLogout} />
            </ProtectedAdminRoute>
          }
        />

        {/* Add other routes here */}
        {/* ... */}

        {/* Fallback */}
        <Route path="/" element={user ? <DashboardPage user={user} /> : <LoginForm onLogin={handleLogin} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// ============================================================================
// 📝 EXPLANATION
// ============================================================================

/*
1. ProtectedAdminRoute wraps the AdminBankDashboard
   - Only renders if user.role === "admin"
   - Otherwise shows access denied message

2. AdminBankDashboard is the main component that:
   - Fetches data from /api/bank/list and /api/bank/month
   - Displays all the UI components (header, cards, table, etc.)
   - Handles filtering and export
   - Auto-refreshes every 30 seconds

3. Access the dashboard at:
   http://localhost:3000/admin/bank

4. User must be:
   - Logged in (token in localStorage)
   - Have role === "admin" in their user object

5. To test, make sure your backend returns:
   {
     "user": {
       "_id": "...",
       "email": "...",
       "role": "admin"  // ← This must be "admin"
     },
     "token": "..."
   }
*/
