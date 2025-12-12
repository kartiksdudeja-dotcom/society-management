import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function BalanceDiagnostics() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setUser(userData);
    
    if (userData) {
      const role = (userData.role || "").toString().trim().toLowerCase();
      const admin = role === "admin" || role === "1";
      setIsAdmin(admin);
      console.log("👤 User:", userData);
      console.log("👑 Is Admin:", admin);
    }
  }, []);

  useEffect(() => {
    async function testApi() {
      try {
        setLoading(true);
        console.log("🔄 Calling /api/bank/balance...");
        const res = await API.get("/bank/balance");
        console.log("✅ API Response:", res.data);
        setApiResponse(res.data);
      } catch (err) {
        console.error("❌ API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user && isAdmin) {
      testApi();
    }
  }, [user, isAdmin]);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#f5f5f5" }}>
      <h1>🔍 Balance Card Diagnostics</h1>

      <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h3>👤 User Status</h3>
        {user ? (
          <>
            <p>✅ Logged in</p>
            <p>Name: {user.Name || user.name || "N/A"}</p>
            <p>Role: {user.role || "N/A"}</p>
            <p>Is Admin: <span style={{ color: isAdmin ? "green" : "red" }}>{isAdmin ? "YES ✅" : "NO ❌"}</span></p>
          </>
        ) : (
          <p>❌ Not logged in</p>
        )}
      </div>

      <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h3>🔌 API Status</h3>
        {loading && <p>⏳ Loading...</p>}
        {error && <p style={{ color: "red" }}>❌ Error: {error}</p>}
        {apiResponse && (
          <>
            <p>✅ API Response OK</p>
            <pre style={{ backgroundColor: "#fff", padding: "10px", overflowX: "auto" }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </>
        )}
      </div>

      <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h3>💡 Troubleshooting</h3>
        {!isAdmin && <p style={{ color: "red" }}>❌ You are NOT logged in as admin. Balance card only shows for admins.</p>}
        {isAdmin && !apiResponse && loading && <p style={{ color: "orange" }}>⏳ Loading balance data...</p>}
        {isAdmin && apiResponse && !apiResponse.data && <p style={{ color: "orange" }}>⚠️ No balance data in API response. Check if HDFC emails have been synced.</p>}
        {isAdmin && apiResponse && apiResponse.data && <p style={{ color: "green" }}>✅ Balance card should be displaying! Check dashboard.</p>}
      </div>

      <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h3>📋 Raw Data</h3>
        <pre style={{ backgroundColor: "#fff", padding: "10px", overflowX: "auto", maxHeight: "300px" }}>
          User: {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
