import { useEffect, useState } from "react";
import "./CodeforcesProfile.css";

function CodeforcesProfile() {
  const [handle, setHandle] = useState(
    localStorage.getItem("cfHandle") || ""
  );
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!handle) return;

    setLoading(true);
    setError(null); // Clear previous errors
    
    fetch(`http://localhost:5000/api/codeforces/user/${handle}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "OK") {
          setProfile(data.result[0]);
          localStorage.setItem("cfHandle", handle);
        } else {
            setError("User not found");
            setProfile(null);
        }
      })
      .catch((err) => {
          setError("Network Error");
          console.error(err);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  // Function to reset the view to search again
  const resetProfile = () => {
    setHandle("");
    setProfile(null);
    setInput("");
    localStorage.removeItem("cfHandle"); // Optional: clear storage if you prefer
  };

  const handleSearch = () => {
      if(input.trim()) {
          setHandle(input);
      }
  }

  return (
    <div className="cf-card">
      <h2>Codeforces Stats</h2>

      {/* Show Input if no profile is loaded */}
      {!profile && !loading && (
        <div className="cf-input">
          <input
            placeholder="Enter CF handle..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Load</button>
        </div>
      )}

      {loading && <p className="muted">Fetching data...</p>}
      
      {error && !loading && (
          <div style={{textAlign: 'center'}}>
              <p style={{color: '#ff4d4d'}}>{error}</p>
              <button className="cf-btn-reset" onClick={() => setError(null)}>Try Again</button>
          </div>
      )}

      {/* Show Profile if data exists */}
      {profile && !loading && (
        <div className="cf-profile">
          <p className="cf-handle">@{profile.handle}</p>
          <p className="cf-rating">⭐ {profile.rating || "Unrated"}</p>
          <p className="cf-rank">{profile.rank}</p>
          <p className="cf-max">Max: {profile.maxRating}</p>

          <div className="cf-actions">
            <a
              href={`https://codeforces.com/profile/${profile.handle}`}
              target="_blank"
              rel="noreferrer"
              className="cf-btn-link"
            >
              Profile ↗
            </a>
            
            <button className="cf-btn-reset" onClick={resetProfile}>
              Search Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeforcesProfile;