import React from "react";
import "./IconCard.css";

export default function IconCard({ icon: Icon, title, value, subtitle, onClick, className }) {
  return (
    <div className={`icon-card ${className || ""}`} onClick={onClick}>
      <div className="icon-card-icon">
        <Icon />
      </div>
      <div className="icon-card-content">
        <p className="icon-card-subtitle">{subtitle}</p>
        <h3 className="icon-card-title">{title}</h3>
        {value && <p className="icon-card-value">{value}</p>}
      </div>
      {onClick && <span className="icon-card-arrow">→</span>}
    </div>
  );
}
