// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import {
  FaBars,
  FaTimes,
  FaSearch,
  FaUsers,
  FaWallet,
  FaTools,
  FaBell,
  FaTint,
  FaHome,
  FaExchangeAlt,
  FaChartBar,
  FaCog,
  FaStar,
  FaFileUpload,
  FaVideo, // Added for CCTV Request
} from "react-icons/fa";

import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const role = (user?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "1";

  const [adminSummary, setAdminSummary] = useState(null);
  const [maintenanceSummary, setMaintenanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long" }).toUpperCase());
  const [yearlyMaintenance, setYearlyMaintenance] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [totalCollectionBalance, setTotalCollectionBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const adminPromise = isAdmin
          ? API.get("/admin/summary")
          : Promise.resolve({ data: {} });

        const maintenancePromise = API.get("/maintenance/summary");
        const [a, m] = await Promise.all([adminPromise, maintenancePromise]);

        if (!active) return;

        setAdminSummary(a.data);
        setMaintenanceSummary(m.data);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  // Load ALL dashboard financial data
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const maintResponse = await API.get("/maintenance/get");
        const expenseResponse = await API.get("/expense/get");

        let yearlyMaintTotal = 0;
        let monthlyExpTotal = 0;
        let totalMaint = 0;
        let totalExp = 0;

        const parseAmount = (value) => {
            if (!value) return 0;
            const cleaned = String(value).replace(/,/g, '').trim();
            const n = Number(cleaned);
            return isNaN(n) ? 0 : n;
        }

        // Calculate total maintenance (all time) and yearly maintenance
        if (maintResponse.data && Array.isArray(maintResponse.data)) {
          maintResponse.data.forEach((row) => {
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

        // Calculate total expense (all time) and monthly expense
        if (expenseResponse.data && expenseResponse.data[0]) {
          const expenseDoc = expenseResponse.data[0];
          Object.keys(expenseDoc).forEach(key => {
            if (key !== '_id' && key !== '__v' && expenseDoc[key] && expenseDoc[key].total) {
              totalExp += parseAmount(expenseDoc[key].total);
            }
          });
        
          // Monthly expense for selected month (NOTE: expense data is only for 2024 right now)
          const expenseMonthKey = selectedMonth.toUpperCase();
          if (selectedYear === '2024' && expenseDoc[expenseMonthKey] && expenseDoc[expenseMonthKey].total) {
            monthlyExpTotal = parseAmount(expenseDoc[expenseMonthKey].total);
          }
        }

        setTotalCollectionBalance(totalMaint - totalExp);
        setYearlyMaintenance(yearlyMaintTotal);
        setMonthlyExpense(monthlyExpTotal);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedYear, selectedMonth, user]);

  const handleNav = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="dash-root">
        <p className="dash-msg">Please login to view dashboard.</p>
      </div>
    );
  }

  const flatNumber = user?.FlatNumber ?? user?.flatNumber ?? "—";
  const totalBalance = maintenanceSummary?.totalBills ?? 25657; // This seems to be a static fallback
  const transactions = maintenanceSummary?.pendingBills ?? 546;
  const entertainment = maintenanceSummary?.paidBills ?? 245;

  const menuItems = [
    { icon: FaHome, label: "Dashboard", path: "/dashboard", active: true },
    { icon: FaFileUpload, label: "Documents", path: "/documents" }, // Moved here for all users
    { icon: FaVideo, label: "CCTV Request", path: "/cctv-request" }, // Added for CCTV Request
    ...(isAdmin
      ? [
          { icon: FaUsers, label: "Members", path: "/members" },
          { icon: FaWallet, label: "Sinking Fund", path: "/sinking-fund" },
          { icon: FaTools, label: "Maintenance", path: "/maintenance-collection" },
          { icon: FaExchangeAlt, label: "Collection", path: "/collection/2024" },
          { icon: FaChartBar, label: "Expenses", path: "/expense-2024" },
          { icon: FaVideo, label: "Admin CCTV Requests", path: "/admin/cctv-requests" }, // Admin CCTV Requests
        ]
      : []),
  ];

  const transactions_history = [
    { icon: "💊", label: "Maintenance Bill", time: "1 min ago", amount: "-₹546" },
    { icon: "💸", label: "Fund Transfer", time: "2 hours ago", amount: "-₹1005" },
    { icon: "🎬", label: "Sinking Fund", time: "13 Jun 2024", amount: "-₹26,505" },
    { icon: "🏪", label: "Expense", time: "13 Jun 2024", amount: "-₹345" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="air-pay-dashboard">
      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="brand-name">Icon Tower</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => handleNav(item.path)}
            >
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <FaTimes /> Logout
          </button>
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}


        {/* CONTENT AREA */}
        <div className="content">





        </div>
      </div>
  );
}
