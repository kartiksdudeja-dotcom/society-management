import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './CCTVRequestPage.css';

export default function CCTVRequestPage() {
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await API.post('/cctv/request', { remark });
      setMessage('CCTV request sent successfully! Waiting for admin approval.');
      setRemark('');
    } catch (error) {
      setMessage('Error sending CCTV request. Please try again.');
      console.error('CCTV request error:', error);
    }
  };

  return (
    <div className="cctv-request-page">
      <h1>CCTV Request</h1>
      <p>Please provide a remark for why you need CCTV access. If approved, you will have 20 minutes of access.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="remark">Remark:</label>
          <textarea
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            required
            rows="5"
          ></textarea>
        </div>
        <button type="submit" className="submit-btn">Send Request</button>
      </form>
      {message && <p className="cctv-message">{message}</p>}
      <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
    </div>
  );
}
