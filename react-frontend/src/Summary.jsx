import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Summary.css";

export default function Summary({ dailyLog = {}, streak = 0 }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [view, setView] = useState("weekly"); // 'weekly' | 'monthly'
    const [aiInsight, setAiInsight] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // --- DATA AGGREGATION ---
    const stats = useMemo(() => {
        const today = new Date();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let startDate, endDate, chartLabels;

        if (view === "weekly") {
            // Last 7 days
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            endDate = today;
            chartLabels = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                chartLabels.push(dayNames[d.getDay()]);
            }
        } else {
            // Current month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            chartLabels = [];
            for (let i = 1; i <= endDate.getDate(); i++) {
                chartLabels.push(String(i));
            }
        }

        let totalTasks = 0;
        let totalVideos = 0;
        let activeDays = 0;
        const dailyTotals = [];
        const allTasks = [];
        const allVideos = [];

        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const key = cursor.toDateString();
            const log = dailyLog[key];
            const dayTasks = log?.tasksCompleted?.length || 0;
            const dayVideos = log?.videosCompleted?.length || 0;

            totalTasks += dayTasks;
            totalVideos += dayVideos;
            if (dayTasks + dayVideos > 0) activeDays++;
            dailyTotals.push(dayTasks + dayVideos);

            if (log?.tasksCompleted) allTasks.push(...log.tasksCompleted);
            if (log?.videosCompleted) allVideos.push(...log.videosCompleted);

            cursor.setDate(cursor.getDate() + 1);
        }

        const maxActivity = Math.max(...dailyTotals, 1);

        // Most productive day
        let bestDayIdx = 0;
        dailyTotals.forEach((v, i) => {
            if (v > dailyTotals[bestDayIdx]) bestDayIdx = i;
        });
        const bestDay = chartLabels[bestDayIdx] || "—";

        return {
            totalTasks,
            totalVideos,
            activeDays,
            totalDays: chartLabels.length,
            dailyTotals,
            maxActivity,
            chartLabels,
            bestDay,
            allTasks: [...new Set(allTasks)].slice(0, 5),
            allVideos: [...new Set(allVideos)].slice(0, 5),
        };
    }, [dailyLog, view]);

    // --- AI INSIGHTS ---
    const generateAiInsight = async () => {
        setAiLoading(true);
        setAiInsight("");

        try {
            const token = await currentUser.getIdToken();
            const res = await fetch("http://localhost:5000/api/ai-summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    view,
                    totalTasks: stats.totalTasks,
                    totalVideos: stats.totalVideos,
                    activeDays: stats.activeDays,
                    totalDays: stats.totalDays,
                    streak,
                    bestDay: stats.bestDay,
                    topTasks: stats.allTasks,
                    topVideos: stats.allVideos,
                }),
            });

            const data = await res.json();
            if (data.insight) {
                setAiInsight(data.insight);
            } else {
                setAiInsight("⚠️ Could not generate insights. Check your Gemini API key.");
            }
        } catch (err) {
            console.error("AI insight error:", err);
            setAiInsight("❌ Error connecting to AI service. Is the backend running?");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="summary-page">
            <button className="exit-btn" onClick={() => navigate("/")}>
                [ EXIT ]
            </button>

            <div className="summary-header">
                <h1>📊 PrepTrack Wrapped</h1>
                <p className="subtitle">
                    {view === "weekly" ? "Last 7 Days" : new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                </p>
            </div>

            {/* VIEW TOGGLE */}
            <div className="view-toggle">
                <button className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")}>
                    [ WEEKLY ]
                </button>
                <button className={view === "monthly" ? "active" : ""} onClick={() => setView("monthly")}>
                    [ MONTHLY ]
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalTasks}</div>
                    <div className="stat-label">Tasks Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalVideos}</div>
                    <div className="stat-label">Videos Watched</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeDays}/{stats.totalDays}</div>
                    <div className="stat-label">Active Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{streak}</div>
                    <div className="stat-label">Current Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.bestDay}</div>
                    <div className="stat-label">Most Productive</div>
                </div>
            </div>

            {/* BAR CHART */}
            <div className="chart-section">
                <h3>Daily Activity</h3>
                <div className="bar-chart">
                    {stats.dailyTotals.map((val, i) => (
                        <div className="bar-col" key={i}>
                            <div
                                className="bar"
                                style={{ height: `${(val / stats.maxActivity) * 130}px` }}
                                title={`${val} items`}
                            />
                            <span className="bar-label">{stats.chartLabels[i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* TOP ITEMS */}
            <div className="top-items-section">
                <h3>Top Completed Items</h3>
                <div className="top-items-grid">
                    <div className="top-items-list">
                        <h4>Tasks</h4>
                        {stats.allTasks.length > 0 ? (
                            <ol>{stats.allTasks.map((t, i) => <li key={i}>{t}</li>)}</ol>
                        ) : (
                            <p className="no-data-msg">No tasks logged yet.</p>
                        )}
                    </div>
                    <div className="top-items-list">
                        <h4>Videos</h4>
                        {stats.allVideos.length > 0 ? (
                            <ol>{stats.allVideos.map((v, i) => <li key={i}>{v}</li>)}</ol>
                        ) : (
                            <p className="no-data-msg">No videos logged yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="ai-section">
                <h3>🤖 AI Insights</h3>
                {!aiInsight && !aiLoading && (
                    <button className="ai-generate-btn" onClick={generateAiInsight}>
                        [ GENERATE WRAPPED ]
                    </button>
                )}
                {aiLoading && <p className="ai-loading">⏳ Analyzing your data...</p>}
                {aiInsight && <div className="ai-response">{aiInsight}</div>}
                {aiInsight && (
                    <button className="ai-generate-btn" onClick={generateAiInsight} style={{ marginTop: '15px' }}>
                        [ REGENERATE ]
                    </button>
                )}
            </div>
        </div>
    );
}
