import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BalanceCard from "../components/BalanceCard";
import {
  FaUsers,
  FaWallet,
  FaTools,
  FaExchangeAlt,
  FaChartBar,
  FaFileUpload,
  FaVideo,
  FaCreditCard,
  FaClipboard,
  FaCog,
  FaCheckSquare,
  FaRegCreditCard,
} from "react-icons/fa";
import "./DashboardPage.css";

export default function DashboardPage() {
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

  const [maintenanceSummary, setMaintenanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Listen for custom profile update event
    const handleProfileUpdate = (e) => {
      setUser(e.detail);
    };

    // Listen for localStorage changes
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (updatedUser) {
        setUser(updatedUser);
      }
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleStorageChange);

    async function loadData() {
      try {
        const response = await API.get("/maintenance/summary");
        setMaintenanceSummary(response.data);
      } catch (err) {
        console.error("Error loading maintenance summary:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, navigate]);

  const dashboardCards = [
    {
      id: 1,
      icon: FaFileUpload,
      title: "Documents",
      description: "Manage and view society documents",
      path: "/documents",
      color: "card-blue",
    },
    {
      id: 2,
      icon: FaVideo,
      title: "CCTV Request",
      description: "Request access to CCTV cameras",
      path: "/cctv-request",
      color: "card-green",
    },
    {
      id: 9,
      icon: FaCog,
      title: "Settings",
      description: "Manage your profile and preferences",
      path: "/settings",
      color: "card-indigo",
    },
    {
      id: 10,
      icon: FaCheckSquare,
      title: "Tasks",
      description: "Organize and track your tasks",
      path: "/tasks",
      color: "card-cyan",
    },
    ...(isAdmin
      ? [
          {
            id: 3,
            icon: FaUsers,
            title: "Members",
            description: "Manage society members",
            path: "/members",
            color: "card-pink",
          },
          {
            id: 4,
            icon: FaTools,
            title: "Maintenance",
            description: "View maintenance collection",
            path: "/maintenance-collection",
            color: "card-purple",
          },
          {
            id: 5,
            icon: FaWallet,
            title: "Sinking Fund",
            description: "Manage sinking fund",
            path: "/sinking-fund",
            color: "card-orange",
          },
          {
            id: 6,
            icon: FaExchangeAlt,
            title: "Collection",
            description: "View collection 2024",
            path: "/collection/2024",
            color: "card-teal",
          },
          {
            id: 7,
            icon: FaChartBar,
            title: "Expenses",
            description: "Manage expenses 2024",
            path: "/expense-2024",
            color: "card-yellow",
          },
          {
            id: 8,
            icon: FaVideo,
            title: "Admin CCTV",
            description: "Manage CCTV requests",
            path: "/admin/cctv-requests",
            color: "card-red",
          },
         {
  id: 11,
  icon: FaRegCreditCard,
  title: "Bank Transactions",
  description: "View HDFC bank statements & transactions",
 path: "/bank-transactions",   // ← FIXED PATH
        color: "card-blue",
},  {
  
  id: 12,
        icon: FaChartBar,
        title: "Monthly Collection",
        description: "Maintenance collected this month",
        path: "/monthly-collection",
        color: "card-green",
          },
      ]
    : []),
];
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Manage your society from here</p>
      </div>

      <BalanceCard user={user} />
      
      <div className="dashboard-cards-grid">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`dashboard-card ${card.color}`}
              onClick={() => navigate(card.path)}
            >
              <div className="card-icon">
                <Icon />
              </div>
              <div className="card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
