import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import "./AboutSocietyPage.css";

export default function AboutSocietyPage() {
  const navigate = useNavigate();

  // Office bearers data
  const officeBearers = [
    {
      id: 1,
      name: "Virender Aggarwal",
      title: "Chairman",
      image: `https://ui-avatars.com/api/?name=Virender+Aggarwal&background=0f6d57&color=fff&size=200`,
      description: "Leading the society with vision and dedication"
    },
    {
      id: 2,
      name: "Mukesh Dudeja",
      title: "Treasurer",
      image: `https://ui-avatars.com/api/?name=Mukesh+Dudeja&background=087d5e&color=fff&size=200`,
      description: "Managing financial operations"
    },
    {
      id: 3,
      name: "Achyut Napahde",
      title: "Secretary",
      image: `https://ui-avatars.com/api/?name=Achyut+Napahde&background=1a3a3a&color=fff&size=200`,
      description: "Coordinating society activities"
    },
    {
      id: 4,
      name: "Kartik Dudeja",
      title: "Society Manager",
      image: `https://ui-avatars.com/api/?name=Kartik+Dudeja&background=0f6d57&color=fff&size=200`,
      description: "Managing day-to-day society activity"
    }
  ];

  return (
    <div className="about-society-wrapper">
      {/* Navigation Bar */}
      <div className="about-nav-bar">
        <div className="about-nav-left">
          
            
        
          <h2 className="about-society-name">Icon Tower Society</h2>
        </div>
        <div className="about-nav-right">
          <button 
            className="about-login-btn"
            onClick={() => navigate("/login")}
          >
            <span>Login</span>
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-text">
            <h1>Welcome to Icon Tower</h1>
            <p>A Premier Commercial Community</p>
            <div className="about-hero-description">
              <p>
                Icon Tower is a modern commerical society dedicated to providing exceptional living standards, 
                community engagement, and transparent management. We foster a culture of cooperation, trust, 
                and mutual growth among all our residents.
              </p>
            </div>
          </div>
          <div className="about-hero-image">
            <div className="about-hero-image-placeholder">
              <img 
                src={require("../assets/society.jpg")} 
                alt="Icon Tower Society"
                className="about-society-photo"
              />
            </div>
          </div>
        </div>
      </section>
      {/* hero CTA removed - replaced by cleaner hero look */}

      {/* Society Info Section */}
      <section className="about-info-section">
        <div className="about-info-container">
          <h2>About Our Society</h2>
          <div className="about-info-grid">
            <div className="about-info-card">
              <div className="about-info-number">53</div>
              <div className="about-info-label">Office</div>
            </div>
            <div className="about-info-card">
              <div className="about-info-number">09</div>
              <div className="about-info-label">Shops</div>
            </div>
            <div className="about-info-card">
              <div className="about-info-number">24/7</div>
              <div className="about-info-label">Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="about-amenities-section">
        <div className="about-amenities-container">
          <h2>Our Amenities</h2>
          <p className="about-amenities-subtitle">World-class facilities for our community</p>
          <div className="about-amenities-grid">
            <div className="about-amenities-card">
              <div className="amenity-icon">🏢</div>
              <h3>Lift</h3>
              <p>Modern elevators for easy access</p>
            </div>
            <div className="about-amenities-card">
              <div className="amenity-icon">🅿️</div>
              <h3>Basement Parking</h3>
              <p>Secure car and bike parking</p>
            </div>
            <div className="about-amenities-card">
              <div className="amenity-icon">🚗</div>
              <h3>Entrance Parking</h3>
              <p>Convenient car and bike parking</p>
            </div>
            <div className="about-amenities-card">
              <div className="amenity-icon">🔐</div>
              <h3>24/7 Security</h3>
              <p>Round-the-clock surveillance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Bearers Section */}
      <section className="about-office-bearers">
        <div className="about-office-container">
          <h2>Our Leadership</h2>
          <p className="about-office-subtitle">Meet the dedicated team managing our society</p>
          
          <div className="about-bearers-grid">
            {officeBearers.map((bearer) => (
              <div key={bearer.id} className="about-bearer-card">
                <div className="about-bearer-image-wrapper">
                  <img 
                    src={bearer.image} 
                    alt={bearer.name}
                    className="about-bearer-image"
                  />
                  <div className="about-bearer-title-badge">{bearer.title}</div>
                </div>
                <div className="about-bearer-info">
                  <h3>{bearer.name}</h3>
                  <p className="about-bearer-description">{bearer.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-contact-section">
        <div className="about-contact-container">
          <h2>Get in Touch</h2>
          <p className="about-contact-subtitle">We're here to help and answer any questions you might have</p>
          
          <div className="about-contact-grid">
            <div className="about-contact-card">
              <div className="about-contact-icon">
                <FaPhone />
              </div>
              <h3>Phone</h3>
              <p>+91 7678620823</p>
                <p className="about-contact-small">Society Manager</p>
            </div>

            <div className="about-contact-card">
              <div className="about-contact-icon">
                <FaEnvelope />
              </div>
              <h3>Email</h3>
              <p><a href="mailto:icontower.businesshub@gmail.com">icontower.businesshub@gmail.com</a></p>
              <p className="about-contact-small">Response within 24 hours</p>
            </div>

            <div className="about-contact-card">
              <div className="about-contact-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Office Location</h3>
              <p><a href="https://maps.app.goo.gl/VAbZi4KnTJvoZwUXA" target="_blank" rel="noreferrer">Bhumkar Nagar, Wakad, Pimpri-Chinchwad, Maharashtra 411057</a></p>
              <p className="about-contact-small">Open in Maps · Icon Tower, Pune</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <div className="about-cta-container">
          <h2>Ready to Access Your Account?</h2>
          <p>Login to the resident portal to manage your society activities</p>
          <button 
            className="about-cta-button"
            onClick={() => navigate("/login")}
          >
            Go to Login
            <FaArrowRight />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-content">
          <p>&copy; 2025 Icon Tower Society. All rights reserved.</p>
          <p>Transparent • Secure • Community-Focused</p>
        </div>
      </footer>
    </div>
  );
}
