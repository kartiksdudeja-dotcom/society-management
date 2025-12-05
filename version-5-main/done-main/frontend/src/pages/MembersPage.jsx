import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaTrash, FaEdit, FaSave, FaSearch, FaPlus, FaArrowLeft, FaLock, FaTimes, FaKey, FaUserPlus } from "react-icons/fa";
import "./MembersPage.css";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", FlatNumber: "", role: "user" });
  const [addingUser, setAddingUser] = useState(false);
  
  // Password Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const role = (user?.role || "").toString().trim().toLowerCase();
  const isAdmin = role === "admin" || role === "1" || role === "manager";
  
  // Debug log
  console.log("User role:", role, "isAdmin:", isAdmin, "user:", user);

  // Load members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found");
          setLoading(false);
          return;
        }
      const res = await API.get("/admin/members", {
  headers: {
    authorization: `Bearer ${localStorage.getItem("token")}`
  }
});



        console.log("Fetched members:", res.data);
        setMembers(res.data);
        setFilteredMembers(res.data);
      } catch (err) {
        console.log("Error loading members:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Search and filter
  useEffect(() => {
    let filtered = members.filter((m) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (m.name || "").toLowerCase().includes(searchLower) ||
        (m.email || "").toLowerCase().includes(searchLower) ||
        (m.FlatNumber || m.flat_number || m.s_no || "")
          .toString()
          .toLowerCase()
          .includes(searchLower)
      );
    });

    // Sort
    if (sortBy === "name") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "email") {
      filtered.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    } else if (sortBy === "flat") {
      filtered.sort((a, b) => {
        const flatA = a.FlatNumber || a.flat_number || a.s_no || "";
        const flatB = b.FlatNumber || b.flat_number || b.s_no || "";
        return flatA.toString().localeCompare(flatB.toString());
      });
    }

    setFilteredMembers(filtered);
  }, [searchTerm, sortBy, members]);

  // Delete user
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      await API.delete(`/admin/delete-user/${id}`);
      setMembers(members.filter((m) => m._id !== id));
      alert("User deleted successfully");
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Save user update
  const handleSave = async () => {
    try {
      const payload = {
        name: editData.name || "",
        email: editData.email || "",
        FlatNumber: editData.FlatNumber || editData.flat_number || editData.s_no || "",
      };
      const res = await API.put(`/admin/update-user/${editId}`, payload);
      alert("User updated successfully");

      // Update the member in the list
      setMembers(members.map((m) => (m._id === editId ? { ...m, ...payload } : m)));
      setEditId(null);
      setEditData({});
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  // Login as member (Admin only)
  const handleLoginAsMember = async (memberId) => {
    try {
      const member = members.find((m) => m._id === memberId);
      if (!member) {
        alert("Member not found");
        return;
      }

      // Create a token for this member
      const response = await API.post("/auth/login-as-member", { memberId });
      
      // Store the member's credentials
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);
      
      alert(`Logged in as ${member.name}`);
      window.location.reload();
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Add New User
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Name, email and password are required");
      return;
    }
    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setAddingUser(true);
      const response = await API.post("/admin/create-user", newUser);
      setMembers([...members, response.data.user]);
      setShowAddModal(false);
      setNewUser({ name: "", email: "", password: "", FlatNumber: "", role: "user" });
      alert("User created successfully!");
    } catch (err) {
      alert("Failed to create user: " + (err.response?.data?.message || err.message));
    } finally {
      setAddingUser(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await API.put(`/admin/update-password/${passwordUserId}`, { newPassword });
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully!");
    } catch (err) {
      alert("Failed to update password: " + (err.response?.data?.message || err.message));
    }
  };

  // Open password reset modal
  const openPasswordModal = (userId) => {
    setPasswordUserId(userId);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  return (
    <div className="members-container">
      {/* HEADER */}
      <div className="members-header">
        <div className="header-content">
          <h1 className="header-title">Members Directory</h1>
          <p className="header-subtitle">Manage all society members and their information</p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn btn-add-user" onClick={() => setShowAddModal(true)}>
              <FaUserPlus /> Add User
            </button>
          )}
          <div className="stat-badge">
            <span className="stat-number">{filteredMembers.length}</span>
            <span className="stat-label">Members</span>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="members-controls">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="flat">Sort by Flat Number</option>
        </select>
      </div>

      {/* TABLE SECTION */}
      <div className="members-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <p>Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <p>No members found</p>
            <span>Try adjusting your search criteria</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="members-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Flat Number</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, i) => (
                  <tr key={m._id} className={editId === m._id ? "editing" : ""}>
                    <td className="index-col">{i + 1}</td>

                    {/* NAME */}
                    <td className="name-col">
                      {editId === m._id ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editData.name || ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          autoFocus
                        />
                      ) : (
                        <span className="member-name">{m.name}</span>
                      )}
                    </td>

                    {/* EMAIL */}
                    <td className="email-col">
                      {editId === m._id ? (
                        <input
                          type="email"
                          className="edit-input"
                          value={editData.email || ""}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      ) : (
                        <span className="member-email">{m.email}</span>
                      )}
                    </td>

                    {/* FLAT NUMBER */}
                    <td className="flat-col">
                      {editId === m._id ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editData.FlatNumber || editData.flat_number || editData.s_no || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, FlatNumber: e.target.value })
                          }
                        />
                      ) : (
                        <span className="flat-badge">
                          {m.FlatNumber || m.flat_number || m.s_no || "—"}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="actions-col">
                      <div className="action-buttons">
                        {editId === m._id ? (
                          <>
                            <button
                              className="btn btn-save"
                              onClick={handleSave}
                              title="Save changes"
                            >
                              <FaSave /> Save
                            </button>
                            <button
                              className="btn btn-cancel"
                              onClick={cancelEdit}
                              title="Cancel editing"
                            >
                              <FaArrowLeft /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {isAdmin && (
                              <>
                                <button
                                  className="btn btn-login"
                                  onClick={() => handleLoginAsMember(m._id)}
                                  title="Login as this member"
                                >
                                  <FaLock />
                                </button>
                                <button
                                  className="btn btn-password"
                                  onClick={() => openPasswordModal(m._id)}
                                  title="Reset password"
                                >
                                  <FaKey />
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-edit"
                              onClick={() => {
                                setEditId(m._id);
                                setEditData(m);
                              }}
                              title="Edit member"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-delete"
                              onClick={() => handleDelete(m._id)}
                              title="Delete member"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="members-footer">
        <p>Showing {filteredMembers.length} of {members.length} members</p>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaUserPlus /> Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Flat Number</label>
                <input
                  type="text"
                  value={newUser.FlatNumber}
                  onChange={(e) => setNewUser({ ...newUser, FlatNumber: e.target.value })}
                  placeholder="e.g., A-101"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-save" disabled={addingUser}>
                  {addingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaKey /> Reset Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="modal-form">
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-save">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
