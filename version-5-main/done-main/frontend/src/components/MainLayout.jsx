import React, { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import API from "../services/api";
import BalanceCard from "./BalanceCard";

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
  FaVideo,
  FaArrowLeft,
} from "react-icons/fa";

import "./Dashboard.css"; // Reusing dashboard CSS for general layout

export default function MainLayout() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const role = (user?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "1";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString("en-DE"));
  const [profilePic, setProfilePic] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Get profile picture from localStorage
    const storedProfile = localStorage.getItem("profilePic");
    if (storedProfile) {
      setProfilePic(storedProfile);
    }

    // Update date every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString("en-DE"));
    }, 60000);

    // Listen for profile updates
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (updatedUser) {
        setUser(updatedUser);
      }
      const updatedProfile = localStorage.getItem("profilePic");
      if (updatedProfile) {
        setProfilePic(updatedProfile);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearInterval(dateInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, navigate]);

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

  return (
    <div className="air-pay-dashboard">
      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="brand-name">Icon Tower</h1>
        </div>

        {/* Profile Circle */}
        <button 
          className="sidebar-profile-circle"
          onClick={() => handleNav("/settings")}
          title="Click to open profile"
        >
          <img
            src={profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=0f6d57&color=fff&size=100`}
            alt={user.name}
          />
          <div className="profile-initials">{user?.name?.charAt(0).toUpperCase()}</div>
        </button>

        <p className="sidebar-user-name">{user?.name || "User"}</p>
        <p className="sidebar-user-role">{isAdmin ? "Admin" : "Member"}</p>

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

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="top-bar-left">
            {location.pathname !== "/dashboard" && (
              <button className="back-btn" onClick={() => navigate(-1)} title="Go Back">
                <FaArrowLeft />
              </button>
            )}
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <FaBars />
            </button>
          </div>

          <div className="top-bar-right">
            <span className="date">{currentDate}</span>
            <button className="notification-btn">
              <FaBell />
            </button>
            <button className="user-profile-button" onClick={() => handleNav("/profile")}>
              <div className="user-profile">
                <img
                  src={profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
                  alt={user.name}
                  className="profile-pic"
                />
                <span className="user-name">{user.name}</span>
              </div>
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="content">
          <Outlet /> {/* This is where the routed components will render */}
        </div>
      </div>
    </div>
  );
}
