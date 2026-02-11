import { useState, useEffect } from "react";
import "./CodeforcesProfile.css";

export default function CodeforcesProfile() {
  const [handle, setHandle] = useState(() => localStorage.getItem("cf_handle") || "");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (handle && !profile) {
      loadProfile();
    }
  }, []);

  const loadProfile = async () => {
    if (!handle) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/codeforces/user/${handle}`);
      const data = await response.json();

      if (data.status === "OK") {
        setProfile(data.result[0]);
        localStorage.setItem("cf_handle", handle);
      } else {
        setError(data.comment || "User not found");
      }
    } catch (err) {
      setError("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHandle("");
    setProfile(null);
    setError(null);
    localStorage.removeItem("cf_handle");
  };

  const getRankColor = (rank) => {
    if (!rank) return "gray";
    if (rank.includes("grandmaster")) return "red"; // legendary GM is usually red/black
    if (rank.includes("master")) return "orange";
    if (rank.includes("candidate user")) return "violet"; // correction: candidate master is violet/purple
    if (rank.includes("expert")) return "blue";
    if (rank.includes("specialist")) return "cyan";
    if (rank.includes("pupil")) return "green";
    if (rank.includes("newbie")) return "#888888"; // distinct gray
    return "#ffffff";
  };

  return (
    <div className="cf-profile-card">
      <h3>Codeforces Profile</h3>
      <div className="cf-input-group">
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter handle"
        />
        <div className="cf-button-row">
          <button onClick={loadProfile} disabled={loading || !handle}>
            {loading ? "..." : "Load"}
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {profile && (
        <div className="cf-stats">
          <div className="cf-header">
            <img src={profile.titlePhoto} alt="avatar" className="cf-avatar" />
            <div className="cf-info-main">
              <div className="cf-handle" style={{ color: getRankColor(profile.rank) }}>
                {profile.handle}
              </div>
              <div className="cf-rank">{profile.rank}</div>
              <div className="cf-decor">SYSTEM_USER :: {profile.country || "GLOBAL"}</div>
            </div>
          </div>
          <div className="cf-ratings">
            <div className="rating-box">
              <span>Rating</span>
              <strong>{profile.rating}</strong>
            </div>
            <div className="rating-box">
              <span>Max</span>
              <strong>{profile.maxRating}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}