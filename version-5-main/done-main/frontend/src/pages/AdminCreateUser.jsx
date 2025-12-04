import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function AdminCreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
        flatNumber,
        role,
      });

      setMsg("User created successfully!");

      setTimeout(() => navigate("/app/members"), 1200);
    } catch (err) {
      setMsg(err.response?.data?.message || "Error creating user");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "500px",
        margin: "0 auto",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Create New User</h2>

      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="example@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Flat Number</label>
        <input
          type="text"
          placeholder="101, A203..."
          value={flatNumber}
          onChange={(e) => setFlatNumber(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="text"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={inputStyle}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "12px",
            background: "#7cc7b9",
            border: "none",
            borderRadius: "8px",
            color: "#000",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Create User
        </button>

        {msg && (
          <p style={{ marginTop: "15px", color: "yellow" }}>{msg}</p>
        )}
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  marginBottom: "15px",
};
