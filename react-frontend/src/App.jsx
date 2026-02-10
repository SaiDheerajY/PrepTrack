import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { logout } from "./auth";
import { enableNotifications, updateNotificationPreference } from "./notifications";
import { useFirestore } from "./useFirestore";
import Login from "./Login";
import MyCalendar from "./Calender";
import Contests from "./contests";
import Tasks from "./Tasks";
import Videos from "./Videos";
import PomodoroPage from "./Pomodoropage";
import Summary from "./Summary";
import CodeforcesProfile from "./codeforcesprofile";

import "./App.css";

function Dashboard() {
  const { currentUser } = useAuth();

  // -- FIREBASE SYNC --
  const uid = currentUser?.uid;
  const getKey = (key) => uid ? `${key}_${uid}` : key;
  const { data: cloudData, loading: cloudLoading, saveData } = useFirestore(uid);

  // -- STATE --
  const [videos, setVideos] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dailyLog, setDailyLog] = useState({});
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isInitialized = useRef(false); // Guard: prevent saving before data loads

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // -- THEME STATE (Simple) --
  // Restoring simple theme state since CSS supports it
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("appTheme") || "spring");

  const themes = ["spring", "amber", "cyber", "matrix"];
  const cycleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setCurrentTheme(nextTheme);
    localStorage.setItem("appTheme", nextTheme);
  };

  useEffect(() => {
    // Apply theme to body
    document.body.className = ""; // clear previous
    if (currentTheme !== "spring") {
      document.body.classList.add(`theme-${currentTheme}`);
    }
  }, [currentTheme]);


  // -- INITIAL FETCH & MIGRATION --
  useEffect(() => {
    if (!uid || cloudLoading) return;

    if (cloudData) {
      setVideos(cloudData.videos || []);
      setTasks(cloudData.tasks || []);
      setDailyLog(cloudData.dailyLog || {});
      setStreak(cloudData.streak || 0);
      setLastActiveDate(cloudData.lastActiveDate || "");
      setNotificationsEnabled(cloudData.notificationsEnabled || false);
    } else {
      const getLocal = (k) => {
        const namespaced = localStorage.getItem(`${k}_${uid}`);
        if (namespaced) return JSON.parse(namespaced);
        return JSON.parse(localStorage.getItem(k));
      };

      const localVideos = getLocal("videos") || [];
      const localTasks = getLocal("tasks") || [];
      const localLog = getLocal("dailyLog") || {};
      const localStreak = Number(localStorage.getItem(`streak_${uid}`) || localStorage.getItem("streak")) || 0;
      const localLastActive = localStorage.getItem(`lastActiveDate_${uid}`) || localStorage.getItem("lastActiveDate") || "";
      const localNotif = (localStorage.getItem(`notificationsEnabled_${uid}`) || localStorage.getItem("notificationsEnabled")) === "true";

      setVideos(localVideos);
      setTasks(localTasks);
      setDailyLog(localLog);
      setStreak(localStreak);
      setLastActiveDate(localLastActive);
      setNotificationsEnabled(localNotif);

      saveData({
        videos: localVideos,
        tasks: localTasks,
        dailyLog: localLog,
        streak: localStreak,
        lastActiveDate: localLastActive,
        notificationsEnabled: localNotif
      });
    }

    // Mark as ready — now persistence effect can safely run
    isInitialized.current = true;
  }, [uid, cloudLoading, cloudData, saveData]);


  // -- PERSISTENCE (only runs AFTER initial data is loaded) --
  useEffect(() => {
    if (!uid || !isInitialized.current) return; // <-- GUARD: skip until data loaded
    const dataToSave = { videos, tasks, dailyLog, streak, lastActiveDate, notificationsEnabled };
    saveData(dataToSave);

    localStorage.setItem(getKey("videos"), JSON.stringify(videos));
    localStorage.setItem(getKey("tasks"), JSON.stringify(tasks));
    localStorage.setItem(getKey("dailyLog"), JSON.stringify(dailyLog));
    localStorage.setItem(getKey("streak"), streak);
    localStorage.setItem(getKey("lastActiveDate"), lastActiveDate);
    localStorage.setItem(getKey("notificationsEnabled"), notificationsEnabled);
  }, [videos, tasks, dailyLog, streak, lastActiveDate, notificationsEnabled, uid, saveData, getKey]);


  const [leftPanelWidth, setLeftPanelWidth] = useState(() => Number(localStorage.getItem(getKey("leftPanelWidth"))) || (window.innerWidth * 0.75));
  useEffect(() => { localStorage.setItem(getKey("leftPanelWidth"), leftPanelWidth); }, [leftPanelWidth, uid]);
  const isDragging = useRef(false);


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

    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActiveDate === yesterday.toDateString()) {
        setStreak(s => s + 1);
      } else {
        setStreak(1);
      }
      setLastActiveDate(today);
    }
  };

  const markActivity = () => { };

  const resetTasks = () => {
    const completed = tasks.filter(t => t.completed);
    completed.forEach(t => logActivity("task", t.text));
    setTasks([]);
  };

  const resetVideos = () => {
    const completed = videos.filter(v => v.progress >= 90);
    completed.forEach(v => logActivity("video", v.title));
    setVideos([]);
  };

  const handleDeleteVideo = (video) => {
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
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      newWidth = Math.max(240, newWidth);
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

      {/* SIDEBAR NAVIGATION */}
      <div className={`terminal-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="terminal-green">NAV_MENU</span>
          <button className="text-btn close-sidebar" onClick={() => setIsSidebarOpen(false)}>[ X ]</button>
        </div>
        <div className="sidebar-content">
          <Link to="/pomodoro" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            {`[ >> POMODORO_TIMER ]`}
          </Link>
          <Link to="/summary" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            {`[ >> WRAPPED ]`}
          </Link>
          <Link to="/contests" className="sidebar-link" onClick={() => setIsSidebarOpen(false)}>
            {`[ >> CONTEST_HUB ]`}
          </Link>

          <div className="sidebar-sep"></div>

          <div className="sidebar-stat">
            <span className="label">THEME:</span>
            <button className="text-btn theme-btn" onClick={cycleTheme}>
              {currentTheme.toUpperCase()}
            </button>
          </div>

          <div className="sidebar-stat">
            <span className="label">NOTIFS:</span>
            <button className="text-btn" onClick={async () => {
              const newState = !notificationsEnabled;
              const authToken = await currentUser.getIdToken();
              if (newState) {
                const result = await enableNotifications(
                  currentUser.email,
                  currentUser.displayName || currentUser.email.split('@')[0],
                  authToken
                );
                if (result.success) {
                  setNotificationsEnabled(true);
                  localStorage.setItem(getKey("notificationsEnabled"), "true");
                  await updateNotificationPreference(true, authToken);
                }
              } else {
                setNotificationsEnabled(false);
                localStorage.setItem(getKey("notificationsEnabled"), "false");
                await updateNotificationPreference(false, authToken);
              }
            }}>
              {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="sidebar-sep"></div>

          <button className="text-btn logout-btn" onClick={logout}>
            [ LOGOUT_SESSION ]
          </button>
        </div>
      </div>

      {/* OVERLAY FOR SIDEBAR */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className="terminal-header-row">
        <div className="header-left">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
            <div className="line"></div>
            <div className="line"></div>
            <div className="line"></div>
          </button>
          <div className="brand-text">
            PREP<span className="logo-accent">TRACK</span>
          </div>
        </div>

        <div className="header-center">
          <div className="user-status">
            STREAK: <span className="terminal-green">{streak}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-status">
            USER: <span className="terminal-dim">{currentUser?.email?.split('@')[0]}</span>
          </div>
        </div>
      </div>

      <div className="terminal-main-grid" style={{ "--left-width": `${leftPanelWidth}px` }}>
        <div className="terminal-col left-col">
          <Tasks tasks={tasks} setTasks={setTasks} markActivity={markActivity} resetTasks={resetTasks} />
          <div style={{ height: '40px' }}></div>
          <Videos videos={videos} setVideos={setVideos} markActivity={markActivity} resetVideos={resetVideos} onDeleteVideo={handleDeleteVideo} />
        </div>

        <div className="terminal-resizer" onMouseDown={handleMouseDown}></div>

        <div className="terminal-col right-col">
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div className="section-title" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setCalendarOpen(!calendarOpen)}>
              SYSTEM_CALENDAR :: {new Date().getFullYear()} [{calendarOpen ? "OPEN" : "MIN"}]
            </div>
            {calendarOpen && <MyCalendar dailyLog={dailyLog} />}
          </div>
          <div className="ascii-sep" style={{ margin: "20px 0", textAlign: 'right', opacity: 0.1 }}>{"=".repeat(60)}</div>
          <div style={{ flexShrink: 0 }}>
            <Contests />
            <CodeforcesProfile />
          </div>
        </div>
      </div>

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

function SummaryPage() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const { data: cloudData, loading } = useFirestore(uid);

  if (loading) return <div style={{ color: '#00ff9c', textAlign: 'center', marginTop: '40vh', fontFamily: 'monospace' }}>Loading data...</div>;

  // Use cloud data if available, otherwise fallback to local for immediate feedback
  const dailyLog = cloudData?.dailyLog || JSON.parse(localStorage.getItem(`dailyLog_${uid}`) || localStorage.getItem("dailyLog") || '{}');
  const streak = cloudData?.streak || Number(localStorage.getItem(`streak_${uid}`) || localStorage.getItem("streak")) || 0;

  return (
    <Summary
      dailyLog={dailyLog}
      streak={streak}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
            <Route path="/pomodoro" element={<ProtectedRoute><PomodoroPage /></ProtectedRoute>} />
            <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
