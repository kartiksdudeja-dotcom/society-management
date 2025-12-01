import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./DocumentUploadPage.css";
import { FaFileUpload, FaEye, FaTrash, FaSearch } from "react-icons/fa";

export default function DocumentUploadPage() {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("Rent Agreement");
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user && (user.role === "admin" || user.role === "1");

  // Handle both 'flatNumber' and 'FlatNumber' casings
  const flatNumber = user?.flatNumber || user?.FlatNumber || "";
  const [houseNumber, setHouseNumber] = useState(isAdmin ? "" : flatNumber);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const filtered = documents.filter(doc =>
      doc.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);

  const fetchDocuments = async () => {
    try {
      const response = await API.get("/documents");
      setDocuments(response.data);
    } catch (err) {
      setError("Failed to fetch documents.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !documentType || (!isAdmin && !houseNumber)) {
      setError("Please fill all fields and select a file.");
      return;
    }
    setIsLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("document", file);
    formData.append("type", documentType);
    if (isAdmin) {
      formData.append("houseNumber", houseNumber);
    } else {
      formData.append("houseNumber", flatNumber);
    }

    try {
      const response = await API.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Document uploaded successfully!");
      setDocuments([response.data.document, ...documents]);
      // Reset form
      setFile(null);
      setDocumentType("Rent Agreement");
      if (isAdmin) setHouseNumber("");
      e.target.reset(); // Reset file input
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    // Note: This is a placeholder. You need a backend route for deletion.
    alert(`Deletion functionality for document ID: ${id} is not yet implemented on the backend.`);
  }

  return (
    <div className="doc-upload-container">
      <div className="doc-upload-header">
        <h1>Document Management</h1>
        <p>Upload and manage society documents securely.</p>
      </div>

      {/* UPLOAD FORM */}
      <div className="upload-form-section card-morph">
        <h2><FaFileUpload /> Upload New Document</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {isAdmin && (
              <div className="form-group">
                <label htmlFor="houseNumber">House Number</label>
                <input
                  id="houseNumber"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g., A-101"
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="documentType">Document Type</label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                <option value="Rent Agreement">Rent Agreement</option>
                <option value="Police Verification">Police Verification</option>
                <option value="Other">Other Documents</option>
              </select>
            </div>
            <div className="form-group file-input-group">
               <label htmlFor="file-upload" className="file-upload-label">
                {file ? file.name : "Choose a file..."}
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* DOCUMENT LIST */}
      <div className="document-list-section card-morph">
         <div className="list-header">
            <h2>Uploaded Documents</h2>
            <div className="search-wrapper">
                <FaSearch className="search-icon"/>
                <input
                    type="text"
                    placeholder="Search by house number or uploader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>House No.</th>
                {isAdmin && <th>Uploader</th>}
                <th>Type</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr key={doc._id}>
                    <td>{doc.houseNumber}</td>
                    {isAdmin && <td>{doc.user?.name || 'N/A'}</td>}
                    <td>{doc.type}</td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <a href={doc.driveLink} target="_blank" rel="noopener noreferrer" className="btn-view">
                        <FaEye /> View
                      </a>
                      <button onClick={() => handleDelete(doc._id)} className="btn-delete">
                          <FaTrash/> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? "5" : "4"}>No documents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
