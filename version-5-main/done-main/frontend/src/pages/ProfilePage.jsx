import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    flatNumber: "",
    phoneNumber: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser && storedUser._id) {
          const response = await API.get(`/auth/profile`);
          const fetchedUser = response.data.data;
          setUser(fetchedUser);
          setFormData({
            name: fetchedUser.name || "",
            email: fetchedUser.email || "",
            flatNumber: fetchedUser.flatNumber || "",
            phoneNumber: fetchedUser.phoneNumber || "",
          });
        } else {
          navigate("/about"); // Redirect if no user in local storage
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setMessage("Error fetching profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser && storedUser._id) {
        await API.put(`/auth/profile`, formData);
        setMessage("Profile updated successfully!");
        // Update local storage user data if necessary
        localStorage.setItem("user", JSON.stringify({ ...storedUser, name: formData.name }));
      } else {
        setMessage("User not logged in.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile. Please try again.");
    }
  };

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (!user) {
    return <div className="profile-page">Please login to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      {message && <p className="profile-message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="flatNumber">Flat Number:</label>
          <input
            type="text"
            id="flatNumber"
            name="flatNumber"
            value={formData.flatNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="submit-btn">Update Profile</button>
      </form>
      <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
    </div>
  );
}
