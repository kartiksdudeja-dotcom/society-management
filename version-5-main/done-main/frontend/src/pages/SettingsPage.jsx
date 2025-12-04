import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FaCamera, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import "./SettingsPage.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    flatNumber: "",
    address: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  useEffect(() => {
    if (!user) {
      navigate("/about");
      return;
    }

    // Load profile pic from localStorage if exists
    const storedProfilePic = localStorage.getItem("profilePic");
    if (storedProfilePic) {
      setPreviewPic(storedProfilePic);
    }

    async function fetchProfile() {
      try {
        const res = await API.get("/auth/profile");
        setFormData({
          name: res.data.name || "",
          email: res.data.email || "",
          phoneNumber: res.data.phoneNumber || "",
          flatNumber: res.data.flatNumber || "",
          address: res.data.address || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("flatNumber", formData.flatNumber);
      formDataToSend.append("address", formData.address);
      
      if (profilePic) {
        formDataToSend.append("profilePic", profilePic);
      }

      const res = await API.put("/auth/profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessageType("success");
      setMessage("Profile updated successfully!");
      
      // Update localStorage
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Save profile pic to localStorage
      if (previewPic) {
        localStorage.setItem("profilePic", previewPic);
      }
      
      setUser(updatedUser);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: updatedUser }));
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings & Profile</h1>
          <p>Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Profile Picture Section */}
          <div className="profile-pic-section">
            <div className="pic-preview">
              {previewPic ? (
                <img src={previewPic} alt="Profile Preview" />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${formData.name}&background=0f6d57&color=fff&size=200`}
                  alt="Profile"
                />
              )}
              <label className="pic-upload-label">
                <FaCamera className="camera-icon" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <p className="pic-hint">Click camera to upload profile picture</p>
          </div>

          {/* Form Fields */}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="flatNumber">Flat Number</label>
              <input
                id="flatNumber"
                type="text"
                name="flatNumber"
                value={formData.flatNumber}
                onChange={handleChange}
                placeholder="Enter your flat number"
                disabled={loading}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                rows="4"
                disabled={loading}
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`message-box message-${messageType}`}>
              <span className="message-icon">
                {messageType === "error" ? (
                  <FaExclamationCircle />
                ) : (
                  <FaCheckCircle />
                )}
              </span>
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
