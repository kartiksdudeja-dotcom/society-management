import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUpload, FaTimes, FaPaperPlane, FaArrowLeft, FaExclamationTriangle, FaImage, FaMobileAlt } from "react-icons/fa";
import API from "../services/api";
import "./ReportProblemPage.css";

export default function ReportProblemPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "problem",
    priority: "medium",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processImage = (file) => {
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    processImage(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  // Open camera
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  // Open file browser
  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a problem title");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("priority", formData.priority);
      
      if (selectedImage) {
        submitData.append("image", selectedImage);
      }

      await API.post("/tasks/create", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      
      // Reset form
      setFormData({ title: "", description: "", category: "problem", priority: "medium" });
      removeImage();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/app/my-complaints");
      }, 2000);

    } catch (err) {
      console.error("Error submitting problem:", err);
      setError(err.response?.data?.message || "Failed to submit problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="report-problem-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Problem Reported Successfully!</h2>
          <p>Your problem has been submitted and a task has been created.</p>
          <p>The society admin will review and address it soon.</p>
          <button className="back-btn" onClick={() => navigate("/app/my-complaints")}>
            View My Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-problem-page">
      <div className="report-container">
        {/* Header */}
        <div className="report-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <div className="header-content">
            <FaExclamationTriangle className="header-icon" />
            <div>
              <h1>Report a Problem</h1>
              <p>Let us know about any issues in the society</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="report-form">
          {error && <div className="error-message">{error}</div>}

          {/* Image Upload Section with Drag & Drop */}
          <div className="form-section">
            <label className="section-label">
              <FaCamera /> Upload Photo (Optional)
            </label>
            <div 
              className={`image-upload-area ${isDragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button type="button" className="remove-image-btn" onClick={removeImage}>
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="drag-drop-content">
                    <FaImage className="upload-icon" />
                    <span className="drag-text">Drag & Drop image here</span>
                    <span className="upload-or">or</span>
                    <div className="upload-buttons">
                      <button type="button" className="upload-btn browse-btn" onClick={openFileBrowser}>
                        <FaUpload /> Browse Files
                      </button>
                      <button type="button" className="upload-btn camera-btn" onClick={openCamera}>
                        <FaMobileAlt /> Take Photo
                      </button>
                    </div>
                    <span className="upload-hint">Max 5MB - JPG, PNG, GIF</span>
                  </div>
                </div>
              )}
              {/* Hidden file input for browsing */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="file-input"
              />
              {/* Hidden file input for camera capture */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="file-input"
              />
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Problem Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Water leakage in parking area"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide more details about the problem..."
              rows="4"
            />
          </div>

          {/* Category & Priority */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="problem">General Problem</option>
                <option value="maintenance">Maintenance Issue</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane /> Submit Problem
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
