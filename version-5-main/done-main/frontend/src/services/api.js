import axios from "axios";

// Hardcoded Render backend URL for production
const baseURL = "https://society-management-k98t.onrender.com/api";

console.log("API Base URL:", baseURL);

const API = axios.create({
  baseURL: baseURL,
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
