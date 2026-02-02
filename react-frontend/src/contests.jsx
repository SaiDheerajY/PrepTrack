import { useEffect, useState } from "react";
import "./contests.css";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase"; // your firebase init

function Contests() {
  const [contests, setContests] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Tick every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/codeforces/contests")
      .then(res => res.json())
      .then(data => {
        const now = Date.now();
        const SixDaysLater = now + 6 * 24 * 60 * 60 * 1000;

        const upcoming = (data.result || []).filter(contest => {
          const startTime = contest.startTimeSeconds * 1000;
          return startTime >= now && startTime <= SixDaysLater;
        });

        setContests(upcoming);
      })
      .catch(err => console.error(err));
  }, []);

  const formatCountdown = (startSeconds) => {
    const diff = startSeconds * 1000 - now;
    if (diff <= 0) return "Started";

    const minutes = Math.floor(diff / 60000);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;

    return `${days}d ${hours}h ${mins}m`;
  };


  return (
    <div className="contests-box">
      <h2>Codeforces Contests</h2>

      {contests.map(contest => (
        <div key={contest.id} className="contest-card">
          <div className="contest-info">
            <span className="contest-name">{contest.name}</span>
            <span className="contest-time">
              ⏳ {formatCountdown(contest.startTimeSeconds)}
            </span>
          </div>

          <a
            href={`https://codeforces.com/contest/${contest.id}`}
            target="_blank"
            rel="noreferrer"
            className="register-btn"
          >
            Register
          </a>
        </div>
      ))}
    </div>
  );
}

export default Contests;
