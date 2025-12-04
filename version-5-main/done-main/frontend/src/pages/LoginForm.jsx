import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import loginImg from "../assets/society.jpg";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaArrowRight, FaExclamationCircle, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import "./LoginForm.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "error" or "success"
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      setMsgType("success");
      setMsg("Login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 1500);
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.message || err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{background: 'linear-gradient(135deg, #0f6d57 0%, #087d5e 100%)'}}>
      <div className="login-container">
        <div className="login-left">
          <img src={loginImg} alt="Icon Tower Society" />
        </div>

        <div className="login-right">
          <div className="login-header">
            <button 
              type="button"
              className="back-to-about"
              onClick={() => navigate("/about")}
              title="Go back to About Us"
            >
              <FaArrowLeft /> Back
            </button>
            <h1>Icon Tower Society</h1>
            <p className="login-subtitle">Secure management dashboard for our community</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span 
                className="eye-icon" 
                onClick={() => setShowPass(!showPass)}
                role="button"
                tabIndex="0"
              >
                {showPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Logging In...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight />
                </>
              )}
            </button>

            {msg && (
              <div className={`message-box message-${msgType}`}>
                <span className="message-icon">
                  {msgType === "error" ? <FaExclamationCircle /> : <FaCheckCircle />}
                </span>
                <span>{msg}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
