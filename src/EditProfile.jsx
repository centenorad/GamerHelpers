import { useState, useEffect } from "react";
import "./Dashboard.css";

function EditProfile({ open, onClose, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    contact_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && currentUser) {
      setFormData({
        full_name: currentUser.full_name || "",
        username: currentUser.username || "",
        contact_number: currentUser.contact_number || "",
      });
      setError("");
    }
  }, [open, currentUser]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }

    // Validate username format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:4000/api/profile/${currentUser.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess && onSuccess(data.user);
      onClose();
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="composer-overlay">
      <div className="composer-backdrop" onClick={onClose}></div>
      <div className="composer-card" style={{ maxWidth: "500px" }}>
        <div className="composer-head">
          <div style={{ fontWeight: 700 }}>Edit Profile</div>
          <button className="composer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="composer-form" onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: "10px",
                background: "rgba(255, 80, 80, 0.1)",
                border: "1px solid rgba(255, 80, 80, 0.3)",
                borderRadius: "8px",
                color: "#ff9999",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <label className="composer-label">
            <span>Full Name *</span>
            <input
              type="text"
              name="full_name"
              className="composer-input"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </label>

          <label className="composer-label">
            <span>Username *</span>
            <input
              type="text"
              name="username"
              className="composer-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
            <small style={{ fontSize: "11px", color: "#9ab3be" }}>
              Letters, numbers, and underscores only
            </small>
          </label>

          <label className="composer-label">
            <span>Contact Number</span>
            <input
              type="tel"
              name="contact_number"
              className="composer-input"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="Enter your contact number (optional)"
            />
          </label>

          <div className="composer-actions">
            <button
              type="button"
              className="dash-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dash-btn"
              style={{
                background: "rgba(91, 123, 255, 0.2)",
                borderColor: "rgba(91, 123, 255, 0.4)",
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
