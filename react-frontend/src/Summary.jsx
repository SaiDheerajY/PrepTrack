import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Summary.css";

export default function Summary({ dailyLog = {}, streak = 0 }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [view, setView] = useState("weekly"); // 'weekly' | 'monthly' | 'custom'
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [aiInsight, setAiInsight] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    // --- DATA AGGREGATION ---
    const stats = useMemo(() => {
        const today = new Date();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let startDate, endDate, chartLabels;

        if (view === "weekly") {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 6);
            endDate = today;
            chartLabels = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                chartLabels.push(dayNames[d.getDay()]);
            }
        } else if (view === "monthly") {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            chartLabels = [];
            for (let i = 1; i <= endDate.getDate(); i++) {
                chartLabels.push(String(i));
            }
        } else {
            // Custom Range
            startDate = customStart ? new Date(customStart) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = customEnd ? new Date(customEnd) : today;

            // Generate labels based on duration
            chartLabels = [];
            const temp = new Date(startDate);
            while (temp <= endDate) {
                chartLabels.push(temp.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }));
                temp.setDate(temp.getDate() + 1);
                if (chartLabels.length >= 31) break; // Limit chart density to 1 month max
            }
        }

        let totalTasks = 0;
        let totalVideos = 0;
        let activeDays = 0;
        const dailyTotals = [];
        const allTasks = [];
        const allVideos = [];

        // We use the generated labels length to ensure dailyTotals matches chartLabels
        for (let i = 0; i < chartLabels.length; i++) {
            const cursor = new Date(startDate);
            cursor.setDate(startDate.getDate() + i);
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
        }

        const maxActivity = Math.max(...dailyTotals, 1);

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
    }, [dailyLog, view, customStart, customEnd]);

    // --- AI INSIGHTS ---
    const generateAiInsight = async () => {
        setAiLoading(true);
        setAiInsight("");

        const timeRangeLabel = view === "custom"
            ? `${customStart} to ${customEnd}`
            : view;

        try {
            const token = await currentUser.getIdToken();
            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/ai-summary`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    view: timeRangeLabel,
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
            <div className="dynamic-visual-bg"></div>
            <div className="wrapped-grid-overlay"></div>
            <div className="wrapped-vignette"></div>
            <div className="wrapped-scanlines"></div>
            <div className="wrapped-glow-orb orb-1"></div>
            <div className="wrapped-glow-orb orb-2"></div>

            <button className="exit-btn" onClick={() => navigate("/")}>
                &times; CLOSE
            </button>

            <div className="wrapped-viewport">
                <header className="wrapped-header">
                    <div className="year-tag">2026_COLLECTION</div>
                    <h1 className="main-title">
                        {view.toUpperCase()}
                        <span className="highlight-text"> WRAPPED</span>
                    </h1>
                    <div className="period-subtitle">
                        {view === "weekly" && "The Last 7 Days of Progress"}
                        {view === "monthly" && new Date().toLocaleString("default", { month: "long" }).toUpperCase() + " SUMMARY"}
                        {view === "custom" && `Analysis for Selection: ${customStart || '...'} to ${customEnd || '...'}`}
                    </div>
                </header>

                <div className="control-bar">
                    <div className="toggle-group">
                        <button className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")}>WEEK</button>
                        <button className={view === "monthly" ? "active" : ""} onClick={() => setView("monthly")}>MONTH</button>
                        <button className={view === "custom" ? "active" : ""} onClick={() => setView("custom")}>CUSTOM</button>
                    </div>

                    {view === "custom" && (
                        <div className="date-picker-row">
                            <input
                                type="date"
                                className="wrapped-date-input"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            />
                            <span className="date-sep">TO</span>
                            <input
                                type="date"
                                className="wrapped-date-input"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="wrapped-content">
                    {/* KEY STATS ROW */}
                    <section className="highlights-row">
                        <div className="highlight-box">
                            <span className="label">UNIT_VOLUME</span>
                            <div className="value">{stats.totalTasks + stats.totalVideos}</div>
                            <span className="trend">COMPLETED_UNITS</span>
                        </div>
                        <div className="highlight-box">
                            <span className="label">COMMITMENT</span>
                            <div className="value">{streak}</div>
                            <span className="trend">DAY_STREAK</span>
                        </div>
                        <div className="highlight-box">
                            <span className="label">PEAK_FLOW</span>
                            <div className="value">{stats.bestDay}</div>
                            <span className="trend">TOP_PRODUCTIVITY</span>
                        </div>
                    </section>

                    {/* MAIN VISUALIZATION */}
                    <section className="viz-container">
                        <div className="viz-header">ACTIVITY_CHART</div>
                        <div className="wrapped-chart">
                            {stats.dailyTotals.map((val, i) => (
                                <div className="chart-col" key={i}>
                                    <div className="bar-stack">
                                        <div
                                            className="main-bar"
                                            style={{
                                                height: val > 0 ? `${(val / stats.maxActivity) * 100}%` : '4%',
                                                background: val > 0 ? 'var(--terminal-green)' : 'rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            {val > 0 && <div className="bar-cap"></div>}
                                            {val > 0 && <div className="bar-val-hint">{val}</div>}
                                        </div>
                                    </div>
                                    <label>{stats.chartLabels[i]}</label>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* TWO COLUMN CONTENT */}
                    <div className="dual-column">
                        <section className="top-lists">
                            <div className="list-panel">
                                <h3>TOP_TASKS</h3>
                                {stats.allTasks.length > 0 ? (
                                    <div className="wrapped-list">
                                        {stats.allTasks.map((t, i) => (
                                            <div key={i} className="list-item">
                                                <span className="num">0{i + 1}</span>
                                                <span className="name">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">NO_DATA</div>
                                )}
                            </div>
                            <div className="list-panel">
                                <h3>TOP_VIDEOS</h3>
                                {stats.allVideos.length > 0 ? (
                                    <div className="wrapped-list">
                                        {stats.allVideos.map((v, i) => (
                                            <div key={i} className="list-item">
                                                <span className="num">0{i + 1}</span>
                                                <span className="name">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">NO_DATA</div>
                                )}
                            </div>
                        </section>

                        <section className="ai-insight-panel">
                            <h3>NEURAL_ANALYSIS</h3>
                            <div className="ai-card">
                                {!aiInsight && !aiLoading && (
                                    <div className="ai-init">
                                        <p>Performance metrics ready for deep analysis.</p>
                                        <button className="analyze-btn" onClick={generateAiInsight}>
                                            ANALYZE_STATISTICS
                                        </button>
                                    </div>
                                )}
                                {aiLoading && (
                                    <div className="ai-processing">
                                        <div className="pulse-loader"></div>
                                        <span>SEQUENCING_DATA...</span>
                                    </div>
                                )}
                                {aiInsight && (
                                    <div className="ai-finished">
                                        <div className="quote-mark">"</div>
                                        <p className="insight-text">{aiInsight}</p>
                                        <button className="retry-btn" onClick={generateAiInsight}>RE-RUN</button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <footer className="wrapped-footer">
                <div className="footer-left-group">
                    <div className="footer-stat">[ ANALYTICS_MODE :: <span className="highlight-green">PERFORMANCE_MATRIX</span> ]</div>
                    <div className="footer-stat">DATA_SOURCE: LOCAL_NODE + CLOUD_SYNC</div>
                </div>

                <div className="footer-right-group">
                    <div className="footer-stat">VIEW_CORE: {view.toUpperCase()}</div>
                    <div className="footer-stat">© 2026 PREPTRACK_OS</div>
                </div>
            </footer>
        </div>
    );
}
