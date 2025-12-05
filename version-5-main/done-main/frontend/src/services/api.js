import axios from "axios";

// Use environment variable for production, fallback to Render URL for production
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://society-management-k98t.onrender.com/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
