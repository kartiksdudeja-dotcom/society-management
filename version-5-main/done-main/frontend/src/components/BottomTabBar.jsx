import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaExclamationCircle,
  FaUser,
} from "react-icons/fa";
import "./BottomTabBar.css";

export default function BottomTabBar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: FaHome, label: "Home", path: "/dashboard" },
    { icon: FaWallet, label: "Balance", path: "/bank" },
    { icon: FaExclamationCircle, label: "Issues", path: "/complaints" },
    { icon: FaUser, label: "Profile", path: "/settings" },
  ];

  return (
    <div className="bottom-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`tab-item ${location.pathname === tab.path ? "active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <tab.icon className="tab-icon" />
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
