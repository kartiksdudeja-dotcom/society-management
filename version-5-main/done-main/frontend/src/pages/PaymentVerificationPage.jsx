import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/PaymentVerificationPage.css";

export default function PaymentVerificationPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/payment-verifications?status=${filter}`);
      setVerifications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      alert("Failed to load payment verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Approve this payment? It will be added to the monthly collection.")) {
      try {
        setProcessingId(id);
        await API.post(`/payment-verifications/${id}/approve`);
        alert("✅ Payment approved and added to collection!");
        fetchVerifications();
      } catch (error) {
        alert("❌ " + (error.response?.data?.error || "Failed to approve"));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    if (window.confirm("Reject this payment?")) {
      try {
        setProcessingId(id);
        await API.post(`/payment-verifications/${id}/reject`, {
          rejectionReason: rejectReason,
        });
        alert("❌ Payment rejected!");
        setRejectReason("");
        fetchVerifications();
      } catch (error) {
        alert("Failed to reject payment");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "🔄 PENDING",
      approved: "✅ APPROVED",
      rejected: "❌ REJECTED",
    };
    return badges[status] || status;
  };

  return (
    <div className="payment-verification-page">
      <div className="page-header">
        <h1>💳 Payment Verification</h1>
        <p>Review and approve user-submitted payment proofs</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          🔄 Pending ({verifications.filter(v => v.status === "pending").length})
        </button>
        <button
          className={`tab-btn ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          ✅ Approved ({verifications.filter(v => v.status === "approved").length})
        </button>
        <button
          className={`tab-btn ${filter === "rejected" ? "active" : ""}`}
          onClick={() => setFilter("rejected")}
        >
          ❌ Rejected ({verifications.filter(v => v.status === "rejected").length})
        </button>
      </div>

      {/* Verifications List */}
      <div className="verifications-container">
        {loading ? (
          <div className="loading">Loading payment verifications...</div>
        ) : verifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>No {filter} verifications</p>
          </div>
        ) : (
          verifications.map((verification) => (
            <div
              key={verification._id}
              className={`verification-card status-${verification.status}`}
              onClick={() =>
                setExpandedId(expandedId === verification._id ? null : verification._id)
              }
            >
              <div className="card-header">
                <div className="card-info">
                  <span className="badge">{getStatusBadge(verification.status)}</span>
                  <div className="owner-info">
                    <strong>{verification.ownerName}</strong>
                    <span className="flat-label">Unit {verification.flat}</span>
                  </div>
                  <div className="amount-info">
                    <span className="amount">₹{verification.amount.toLocaleString()}</span>
                    <span className="month">{verification.monthYear}</span>
                  </div>
                </div>
                <span className="expand-icon">{expandedId === verification._id ? "▼" : "▶"}</span>
              </div>

              {expandedId === verification._id && (
                <div className="card-details">
                  {/* Payment Proof Image */}
                  <div className="proof-image-section">
                    <label>Payment Screenshot:</label>
                    <img
                      src={verification.proofImageUrl}
                      alt="Payment proof"
                      className="proof-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(verification.proofImageUrl, "_blank");
                      }}
                    />
                  </div>

                  {/* Payment Details */}
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Transaction ID:</label>
                      <span>{verification.paymentDetails?.transactionId || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Mode:</label>
                      <span>{verification.paymentDetails?.paymentMode || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Date:</label>
                      <span>{verification.paymentDetails?.paymentDate || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Submitted At:</label>
                      <span>{new Date(verification.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Approval Info */}
                  {verification.approvedBy && (
                    <div className="approval-info">
                      <label>
                        {verification.status === "approved" ? "✅ Approved by:" : "❌ Rejected by:"}
                      </label>
                      <p>
                        {verification.approvedBy.name} ({verification.approvedBy.email})
                        <br />
                        <small>
                          {new Date(verification.approvedBy.approvedAt).toLocaleString()}
                        </small>
                      </p>
                    </div>
                  )}

                  {verification.rejectionReason && (
                    <div className="rejection-reason">
                      <label>Rejection Reason:</label>
                      <p>{verification.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {verification.status === "pending" && (
                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(verification._id);
                        }}
                        disabled={processingId === verification._id}
                      >
                        {processingId === verification._id ? "⏳" : "✅"} Approve Payment
                      </button>

                      <div className="reject-section">
                        <input
                          type="text"
                          placeholder="Reason for rejection (e.g., Amount mismatch, Duplicate entry)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="reject-input"
                        />
                        <button
                          className="btn-reject"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(verification._id);
                          }}
                          disabled={processingId === verification._id || !rejectReason.trim()}
                        >
                          {processingId === verification._id ? "⏳" : "❌"} Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
