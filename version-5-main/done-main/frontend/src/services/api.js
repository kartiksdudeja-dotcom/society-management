import axios from "axios";

// Use environment variable for production, fallback to localhost for development
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,   // ⭐ REQUIRED
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
