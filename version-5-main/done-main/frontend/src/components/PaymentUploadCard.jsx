import React, { useState } from "react";
import { FaCamera, FaImage, FaFile, FaTimes, FaCheck } from "react-icons/fa";
import "./PaymentUploadCard.css";

export default function PaymentUploadCard({ onSubmit, loading }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    transactionId: "",
    paymentMode: "UPI",
    paymentDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selected);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a payment proof image");
      return;
    }
    const data = new FormData();
    data.append("proofImage", file);
    data.append("paymentDetails", JSON.stringify(formData));
    onSubmit(data);
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setFormData({
      transactionId: "",
      paymentMode: "UPI",
      paymentDate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
  };

  return (
    <div className="payment-upload-card">
      <div className="payment-upload-header">
        <h3>Upload Payment Proof</h3>
        <p className="payment-upload-subtitle">Already paid? Upload your proof here</p>
      </div>

      {/* Step Indicator */}
      <div className="payment-steps">
        <div className={`step ${step >= 1 ? "active" : ""}`}>
          <span>1</span>
          <label>Upload Photo</label>
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 2 ? "active" : ""}`}>
          <span>2</span>
          <label>Payment Details</label>
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 3 ? "active" : ""}`}>
          <span>3</span>
          <label>Confirm</label>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="payment-step-content">
          {!preview ? (
            <div className="upload-area">
              <label className="upload-option camera">
                <FaCamera />
                <span>Take Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>

              <label className="upload-option gallery">
                <FaImage />
                <span>Choose File</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>
            </div>
          ) : (
            <div className="upload-preview">
              <img src={preview} alt="Preview" />
              <button 
                className="upload-remove"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <FaTimes /> Remove
              </button>
            </div>
          )}

          <button 
            className="payment-btn-next"
            onClick={() => setStep(2)}
            disabled={!file}
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="payment-step-content">
          <div className="payment-form-group">
            <label>Payment Mode</label>
            <select 
              value={formData.paymentMode}
              onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
            >
              <option>UPI</option>
              <option>NEFT</option>
              <option>IMPS</option>
              <option>Cheque</option>
            </select>
          </div>

          <div className="payment-form-group">
            <label>Payment Date</label>
            <input 
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
            />
          </div>

          <div className="payment-form-group">
            <label>Transaction ID (Optional)</label>
            <input 
              type="text"
              placeholder="UTR or reference number"
              value={formData.transactionId}
              onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
            />
          </div>

          <div className="payment-form-group">
            <label>Remarks (Optional)</label>
            <textarea 
              placeholder="Any additional details..."
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              rows={3}
            />
          </div>

          <div className="payment-buttons">
            <button className="payment-btn-back" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="payment-btn-next" onClick={() => setStep(3)}>
              Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="payment-step-content">
          <div className="payment-review">
            <div className="review-section">
              <h4>Payment Proof</h4>
              <img src={preview} alt="Payment" className="review-image" />
            </div>

            <div className="review-section">
              <h4>Payment Details</h4>
              <div className="review-item">
                <span className="label">Mode:</span>
                <span className="value">{formData.paymentMode}</span>
              </div>
              <div className="review-item">
                <span className="label">Date:</span>
                <span className="value">{formData.paymentDate}</span>
              </div>
              {formData.transactionId && (
                <div className="review-item">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{formData.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          <p className="payment-warning">
            ⓘ Manager will review and approve your payment within 24 hours.
          </p>

          <div className="payment-buttons">
            <button className="payment-btn-back" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button 
              className="payment-btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Uploading..." : <><FaCheck /> Submit</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
