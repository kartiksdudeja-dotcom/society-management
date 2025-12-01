import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
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
