import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import './AdminCCTVRequestsPage.css';

export default function AdminCCTVRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get('/cctv/admin/all');
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching CCTV requests:', error);
      setMessage('Error fetching requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      let response;
      if (action === 'approve') {
        response = await API.put(`/cctv/admin/approve/${id}`);
      } else if (action === 'reject') {
        response = await API.put(`/cctv/admin/reject/${id}`);
      }
      if (response.data.success) {
        setMessage(`Request ${action}d successfully.`);
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setMessage(`Error ${action}ing request.`);
    }
  };

  if (loading) {
    return <div className="admin-cctv-page">Loading requests...</div>;
  }

  return (
    <div className="admin-cctv-page">
      <h1>Admin CCTV Requests</h1>
      {message && <p className="admin-cctv-message">{message}</p>}
      {requests.length === 0 ? (
        <p>No CCTV requests found.</p>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-item">
              <p><strong>User:</strong> {request.userId ? `${request.userId.name} (${request.userId.flatNumber})` : 'N/A'}</p>
              <p><strong>Remark:</strong> {request.remark}</p>
              <p><strong>Status:</strong> <span className={`status-${request.status}`}>{request.status}</span></p>
              <p><strong>Requested On:</strong> {new Date(request.requestDate).toLocaleString()}</p>
              {request.approvalDate && <p><strong>Approved On:</strong> {new Date(request.approvalDate).toLocaleString()}</p>}
              {request.viewStartTime && <p><strong>View Start:</strong> {new Date(request.viewStartTime).toLocaleString()}</p>}
              {request.viewEndTime && <p><strong>View End:</strong> {new Date(request.viewEndTime).toLocaleString()}</p>}
              
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="action-btn approve-btn"
                    onClick={() => handleAction(request._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button 
                    className="action-btn reject-btn"
                    onClick={() => handleAction(request._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
    </div>
  );
}
