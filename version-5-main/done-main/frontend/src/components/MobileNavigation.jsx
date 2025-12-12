import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaWallet,
  FaBuilding,
  FaUsers,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaFileUpload,
  FaChartBar,
  FaTools,
} from "react-icons/fa";
import "./MobileNavigation.css";

export default function MobileNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const role = (user?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "manager" || role === "1";

  const menuItems = [
    { label: "Home", icon: FaHome, path: "/dashboard", roles: ["all"] },
    { label: "Balance", icon: FaWallet, path: "/dashboard", roles: ["all"] },
    { label: "Maintenance", icon: FaBuilding, path: "/maintenance", roles: ["all"] },
    { label: "Payments", icon: FaChartBar, path: "/bank", roles: ["all"] },
    { label: "My Complaints", icon: FaComments, path: "/complaints", roles: ["all"] },
    { label: "Documents", icon: FaFileUpload, path: "/documents", roles: ["all"] },
    ...(isAdmin ? [
      { label: "Members", icon: FaUsers, path: "/members", roles: ["admin"] },
      { label: "Tasks", icon: FaTools, path: "/tasks", roles: ["admin"] },
      { label: "CCTV", icon: FaVideo, path: "/cctv", roles: ["admin"] },
    ] : []),
    { label: "Settings", icon: FaCog, path: "/settings", roles: ["all"] },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h1 className="mobile-header-title">Icon Tower</h1>
        <div className="mobile-header-avatar">
          <img 
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}`}
            alt={user?.name}
          />
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-overlay" onClick={() => setIsOpen(false)} />
        <div className="drawer-content">
          {/* User Info */}
          <div className="drawer-user-info">
            <img 
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}`}
              alt={user?.name}
              className="drawer-avatar"
            />
            <div className="drawer-user-text">
              <h3>{user?.name || "User"}</h3>
              <p>{user?.email}</p>
              <span className={`role-badge ${isAdmin ? "admin" : "member"}`}>
                {isAdmin ? "Admin" : "Member"}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="drawer-menu">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`drawer-menu-item ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => handleNavigate(item.path)}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button className="drawer-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
