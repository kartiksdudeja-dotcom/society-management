import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// PAGES
import LoginForm from "./pages/LoginForm";
import Register from "./pages/Register";
import MembersPage from "./pages/MembersPage";
import MaintenanceCollectionPage from "./pages/MaintenanceCollectionPage";
import SinkingFundPage from "./pages/SinkingFundPage";
import PendingMaintenancePage from "./pages/PendingMaintenancePage";
import PendingSinkingPage from "./pages/PendingSinkingPage";
import AdminCreateUser from "./pages/AdminCreateUser";
import TotalCollection2024Page from "./pages/TotalCollection2024";
import Expense2024Page from "./pages/Expense2024Page";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import CCTVRequestPage from "./pages/CCTVRequestPage";
import AdminCCTVRequestsPage from "./pages/AdminCCTVRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import AboutSocietyPage from "./pages/AboutSocietyPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import TasksPage from "./pages/TasksPage";
import BankTransactionsPage from "./pages/BankTransactionsPage";
import MonthlyMaintenancePage from "./pages/MonthlyMaintenancePage.jsx";

// COMPONENTS
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import MainLayout from "./components/MainLayout";

function App() {
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/about" element={<AboutSocietyPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/monthly-collection" element={<MonthlyMaintenancePage />} />

        {/* INSIDE MAIN LAYOUT */}
        <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>

          <Route index element={<Navigate to="dashboard" replace />} />

          {/* COMMON ROUTES */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="collection/2024" element={<TotalCollection2024Page />} />
          <Route path="pending/maintenance" element={<PendingMaintenancePage />} />
          <Route path="pending/sinkingfund" element={<PendingSinkingPage />} />
          <Route path="expense-2024" element={<Expense2024Page />} />
          <Route path="documents" element={<DocumentUploadPage />} />
          <Route path="sinking-fund" element={<SinkingFundPage />} />
          <Route path="maintenance-collection" element={<MaintenanceCollectionPage />} />
          <Route path="cctv-request" element={<CCTVRequestPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="tasks" element={<TasksPage />} />

          {/* BANK TRANSACTIONS */}
          <Route path="bank-transactions" element={<BankTransactionsPage />} />

          {/* ADMIN ROUTES */}
          <Route
            path="admin/create-user"
            element={
              <ProtectedAdminRoute user={user}>
                <AdminCreateUser />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="admin/cctv-requests"
            element={
              <ProtectedAdminRoute user={user}>
                <AdminCCTVRequestsPage />
              </ProtectedAdminRoute>
            }
          />

        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/about" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
