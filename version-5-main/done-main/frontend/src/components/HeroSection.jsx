import React from "react";
import "./HeroSection.css";

export default function HeroSection({ title, subtitle, description, image, cta }) {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
          {description && <p className="hero-description">{description}</p>}
          {cta && (
            <button className="hero-cta-btn" onClick={cta.onClick}>
              {cta.label}
            </button>
          )}
        </div>
        {image && (
          <div className="hero-image">
            <img src={image} alt={title} />
          </div>
        )}
      </div>
    </section>
  );
}
