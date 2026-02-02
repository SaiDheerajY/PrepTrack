import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { logout } from "./auth";
import { enableNotifications, updateNotificationPreference } from "./notifications";
import Login from "./Login";
import MyCalendar from "./Calender"; // Capitalization from file list
import Contests from "./contests";
import Tasks from "./Tasks";
import Videos from "./Videos";
import PomodoroPage from "./Pomodoropage";

import "./App.css";


import CodeforcesProfile from "./codeforcesprofile";

function Dashboard() {
  const { currentUser } = useAuth();

  // -- STATE --
  const [videos, setVideos] = useState(() => JSON.parse(localStorage.getItem("videos")) || []);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("tasks")) || []);
  const [dailyLog, setDailyLog] = useState(() => JSON.parse(localStorage.getItem("dailyLog")) || {});
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("streak")) || 0);
  const [lastActiveDate, setLastActiveDate] = useState(() => localStorage.getItem("lastActiveDate") || "");
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    localStorage.getItem("notificationsEnabled") === "true"
  );

  const [leftPanelWidth, setLeftPanelWidth] = useState(() => Number(localStorage.getItem("leftPanelWidth")) || (window.innerWidth * 0.75));
  const isDragging = useRef(false);

  // -- PERSISTENCE --
  useEffect(() => { localStorage.setItem("videos", JSON.stringify(videos)); }, [videos]);
  useEffect(() => { localStorage.setItem("tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("dailyLog", JSON.stringify(dailyLog)); }, [dailyLog]);
  useEffect(() => { localStorage.setItem("streak", streak); }, [streak]);
  useEffect(() => { localStorage.setItem("lastActiveDate", lastActiveDate); }, [lastActiveDate]);
  useEffect(() => { localStorage.setItem("leftPanelWidth", leftPanelWidth); }, [leftPanelWidth]);


  // -- LOGGING LOGIC --
  const logActivity = (type, item) => {
    const today = new Date().toDateString();

    setDailyLog(prev => {
      const dayLog = prev[today] || { tasksCompleted: [], videosCompleted: [] };
      return {
        ...prev,
        [today]: {
          ...dayLog,
          [type === "task" ? "tasksCompleted" : "videosCompleted"]: [
            ...(type === "task" ? dayLog.tasksCompleted : dayLog.videosCompleted),
            item
          ]
        }
      };
    });

    // Update Streak
    if (lastActiveDate !== today) {
      // If last active was yesterday, increment. If older, reset to 1.
      // Simple logic: just increment if not today. 
      // Real streak logic requires checking if yesterday was skipped. 
      // For simple resume project: Increment if new day.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActiveDate === yesterday.toDateString()) {
        setStreak(s => s + 1);
      } else {
        setStreak(1); // Reset or Start new
      }
      setLastActiveDate(today);
    }
  };

  const markActivity = () => { /* Placeholder if components just call this for fun */ };


  // -- RESET HANDLERS --
  const resetTasks = () => {
    // Log completed tasks
    const completed = tasks.filter(t => t.completed);
    completed.forEach(t => logActivity("task", t.text));

    // Clear list
    setTasks([]);
  };

  const resetVideos = () => {
    // Log videos > 90%
    const completed = videos.filter(v => v.progress >= 90);
    completed.forEach(v => logActivity("video", v.title));

    // Clear list
    setVideos([]);
  };

  // -- DELETE VIDEO HANDLER --
  const handleDeleteVideo = (video) => {
    // If > 90% progress, log it before deleting
    if (video.progress >= 90) {
      logActivity("video", video.title);
    }
    setVideos(prev => prev.filter(v => v.id !== video.id));
  };


  // -- RESIZE LOGIC --
  const handleMouseDown = (e) => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const container = document.querySelector(".terminal-main-grid");
      const rect = container.getBoundingClientRect();

      let newWidth = e.clientX - rect.left;

      // clamp
      // Allow it to grow, only limited by minRightWidth logic below
      newWidth = Math.max(240, newWidth);

      // ensure right panel min width is 25% of total width
      const minRightWidth = rect.width * 0.25;
      if (rect.width - newWidth - 6 < minRightWidth) {
        newWidth = rect.width - minRightWidth - 6;
      }

      setLeftPanelWidth(newWidth);

    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="terminal-dashboard">
      <div className="scanlines"></div>

      {/* 0. TOP NAV ROW REMOVED */}
      {/* 1. HEADER INFO ROW */}

      {/* 1. HEADER INFO ROW */}
      <div className="terminal-header-row">
        <div className="brand-text">
          PREPTRACK :: STREAK[<span className="highlight-green">{streak}</span>]
        </div>
        <div className="user-status">
          USER: {currentUser?.email}
          <button className="text-btn" onClick={async () => {
            const newState = !notificationsEnabled;

            if (newState) {
              // Turning ON: trigger email notification
              const authToken = await currentUser.getIdToken();
              const result = await enableNotifications(
                currentUser.email,
                currentUser.displayName || currentUser.email.split('@')[0],
                authToken
              );

              if (result.success) {
                setNotificationsEnabled(true);
                localStorage.setItem("notificationsEnabled", "true");
                await updateNotificationPreference(true, authToken);

                if (result.emailSuccess) {
                  alert("✅ Notifications enabled and confirmation email sent!");
                } else {
                  console.error("Email failed:", result.emailError);
                  alert(`⚠️ Notifications enabled, but confirmation email failed (Error: ${result.emailError}). Please check backend .env credentials.`);
                }
              } else {
                alert(`❌ Failed to enable notifications: ${result.error}`);
              }
            } else {
              // Turning OFF: just update preference
              setNotificationsEnabled(false);
              localStorage.setItem("notificationsEnabled", "false");
              const authToken = await currentUser.getIdToken();
              await updateNotificationPreference(false, authToken);
              console.log("🔕 Notifications disabled");
            }
          }} style={{ marginLeft: '20px' }}>
            [ NOTIFS: {notificationsEnabled ? 'ON' : 'OFF'} ]
          </button>
          <button className="text-btn" onClick={logout} style={{ marginLeft: '10px' }}>
            [ TERMINATE_SESSION ]
          </button>

          <Link to="/pomodoro" className="nav-link" style={{ marginLeft: '20px', color: '#00ff9c', textDecoration: 'none' }}>
            {`[ >> POMODORO_TIMER ]`}
          </Link>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="terminal-main-grid" style={{ "--left-width": `${leftPanelWidth}px` }}>

        {/* LEFT COLUMN */}
        <div className="terminal-col left-col">
          <Tasks
            tasks={tasks}
            setTasks={setTasks}
            markActivity={markActivity}
            resetTasks={resetTasks}
          />

          <div className="ascii-sep">
            {"-".repeat(40)}
          </div>

          <Videos
            videos={videos}
            setVideos={setVideos}
            markActivity={markActivity}
            resetVideos={resetVideos}
            onDeleteVideo={handleDeleteVideo}
          />
        </div>

        {/* DRAG HANDLE */}
        <div className="terminal-resizer" onMouseDown={handleMouseDown}></div>

        {/* RIGHT COLUMN */}
        <div className="terminal-col right-col">
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div
              className="section-title"
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              SYSTEM_CALENDAR :: {new Date().getFullYear()} [{calendarOpen ? "OPEN" : "MIN"}]
            </div>

            {calendarOpen && <MyCalendar dailyLog={dailyLog} />}
          </div>


          <div className="ascii-sep" style={{ margin: "10px 0", textAlign: 'right' }}>
            {"=".repeat(60)}
          </div>

          <div style={{ flexShrink: 0 }}>
            <Contests />
            <CodeforcesProfile />
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="terminal-footer">
        <div className="footer-left">
          [ SYSTEM_STATUS :: <span className="highlight-green">ONLINE</span> ]
        </div>
        <div className="footer-right">
          © 2026 PREPTRACK_OS
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">


          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contests"
              element={
                <ProtectedRoute>
                  <Contests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pomodoro"
              element={
                <ProtectedRoute>
                  <PomodoroPage />
                </ProtectedRoute>
              }
            />
            {/* Add other protected routes as needed */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
