import { useEffect, useRef, useState } from "react";
import "./Pomodoro.css";

export default function Pomodoro({ tasks = [], persistedLog = [], onUpdateLog }) {
    const [mode, setMode] = useState("WORK"); // WORK | BREAK
    const [minutesInput, setMinutesInput] = useState(25);
    const [breakInput, setBreakInput] = useState(5);
    const [longBreakInput, setLongBreakInput] = useState(15);
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [cycles, setCycles] = useState(0);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [ambience, setAmbience] = useState("NONE"); // NONE | HUM | RAIN
    const [autoStart, setAutoStart] = useState(false);

    const endTimeRef = useRef(null);
    const audioCtxRef = useRef(null);
    const ambienceNodesRef = useRef([]);

    // Get selected task name
    const selectedTask = tasks.find(t => t.id === selectedTaskId) || { text: "General Focus" };

    // Accurate timer loop
    useEffect(() => {
        if (!running) return;

        const tick = () => {
            const remaining = Math.max(
                0,
                Math.round((endTimeRef.current - Date.now()) / 1000)
            );

            setSecondsLeft(remaining);

            if (remaining === 0) {
                handleComplete();
            }
        };

        const interval = setInterval(tick, 500);
        return () => clearInterval(interval);
    }, [running, mode, cycles, autoStart]); // Dependencies for handleComplete transitions

    // Ambience Control
    useEffect(() => {
        if (!audioCtxRef.current) return;

        // Stop previous ambience
        ambienceNodesRef.current.forEach(node => node.stop?.() || node.disconnect());
        ambienceNodesRef.current = [];

        if (ambience === "HUM") {
            const osc1 = audioCtxRef.current.createOscillator();
            const osc2 = audioCtxRef.current.createOscillator();
            const gainNode = audioCtxRef.current.createGain();

            osc1.frequency.value = 50;
            osc1.type = 'sine';
            osc2.frequency.value = 52;
            osc2.type = 'sine';

            gainNode.gain.value = 0.05;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);

            osc1.start();
            osc2.start();
            ambienceNodesRef.current = [osc1, osc2, gainNode];
        } else if (ambience === "RAIN") {
            // Procedural Brown Noise for Rain
            const bufferSize = 2 * audioCtxRef.current.sampleRate;
            const noiseBuffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Gain adjustment
            }

            const noise = audioCtxRef.current.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;

            const filter = audioCtxRef.current.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            const gain = audioCtxRef.current.createGain();
            gain.gain.value = 0.15;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtxRef.current.destination);

            noise.start();
            ambienceNodesRef.current = [noise, filter, gain];
        }
    }, [ambience]);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    };

    const start = () => {
        initAudio();
        endTimeRef.current = Date.now() + secondsLeft * 1000;
        setRunning(true);
    };

    const pause = () => setRunning(false);

    const reset = () => {
        setRunning(false);
        let mins = minutesInput;
        if (mode === "SHORT_BREAK") mins = breakInput;
        if (mode === "LONG_BREAK") mins = longBreakInput;
        setSecondsLeft(mins * 60);
    };

    const playBeep = () => {
        initAudio();
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.value = 0.2;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
    };

    const handleComplete = () => {
        setRunning(false);
        playBeep();

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (mode === "WORK") {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            const newLogEntry = `[${timestamp}] COMPLETED: FOCUS SESSION #${newCycles} (${selectedTask.text})`;
            onUpdateLog([newLogEntry, ...persistedLog]);

            // Auto-switch logic
            const isLongBreak = newCycles % 4 === 0;
            const nextMode = isLongBreak ? "LONG_BREAK" : "SHORT_BREAK";
            const breakMins = isLongBreak ? longBreakInput : breakInput;

            setMode(nextMode);
            setSecondsLeft(breakMins * 60);

            if (autoStart) {
                setTimeout(() => {
                    endTimeRef.current = Date.now() + breakMins * 60 * 1000;
                    setRunning(true);
                }, 1000);
            }
        } else {
            const newLogEntry = `[${timestamp}] COMPLETED: ${mode.replace('_', ' ')}`;
            onUpdateLog([newLogEntry, ...persistedLog]);
            setMode("WORK");
            setSecondsLeft(minutesInput * 60);
            if (autoStart) {
                setTimeout(() => {
                    endTimeRef.current = Date.now() + minutesInput * 60 * 1000;
                    setRunning(true);
                }, 1000);
            }
        }
    };

    const switchMode = (newMode) => {
        setRunning(false);
        setMode(newMode);
        let mins = minutesInput;
        if (newMode === "SHORT_BREAK") mins = breakInput;
        if (newMode === "LONG_BREAK") mins = longBreakInput;
        setSecondsLeft(mins * 60);
    };

    const format = (s) => {
        const m = String(Math.floor(s / 60)).padStart(2, "0");
        const sec = String(s % 60).padStart(2, "0");
        return `${m}:${sec}`;
    };

    const getTotalSeconds = () => {
        if (mode === "SHORT_BREAK") return breakInput * 60;
        if (mode === "LONG_BREAK") return longBreakInput * 60;
        return minutesInput * 60;
    };

    const progress = secondsLeft / (getTotalSeconds() || 1);
    const barLength = 20;
    const filled = Math.max(0, Math.min(barLength, Math.floor((1 - progress) * barLength)));

    return (
        <div className="pomodoro-page">
            <div className="pomodoro-bg-viz"></div>
            <div className="pomodoro-vignette"></div>
            <div className="pomodoro-scanlines"></div>

            <header className="pomodoro-header-nav">
                <div className="brand-label">
                    PREP<span className="logo-accent">TRACK</span> // POMODORO_INTERFACE
                    <button className="exit-btn" onClick={() => window.history.back()}>
                        RETURN_TO_DASHBOARD
                    </button>
                </div>
            </header>

            <div className="pomodoro-content-wrapper">
                <div className="pomodoro-terminal">
                    <div className="pomodoro-left">
                        <div className="timer-display-container">
                            <div className="timer-display">
                                {format(secondsLeft)}
                                <span className={`timer-status ${running ? 'pulsing' : ''}`}>
                                    {mode.replace('_', ' ')} :: {running ? "SYSTEM_ACTIVE" : "PAUSED"}
                                </span>
                            </div>
                        </div>

                        <div className="mode-switcher">
                            {["WORK", "SHORT_BREAK", "LONG_BREAK"].map(m => (
                                <button
                                    key={m}
                                    className={`mode-btn ${mode === m ? 'active' : ''}`}
                                    onClick={() => switchMode(m)}
                                >
                                    {m.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="ascii-bar">
                            <div
                                className="visual-progress-fill"
                                style={{ width: `${(1 - progress) * 100}%` }}
                            ></div>
                            <span>{"[ "}</span>
                            <span className="terminal-green">{"#".repeat(filled)}</span>
                            <span className="terminal-dim">{"-".repeat(barLength - filled)}</span>
                            <span>{" ]"}</span>
                        </div>

                        <div className="pomodoro-controls">
                            {!running ? (
                                <button className="bracket-btn primary" onClick={start}>INITIALIZE</button>
                            ) : (
                                <button className="bracket-btn" onClick={pause}>INTERRUPT</button>
                            )}
                            <button className="bracket-btn" onClick={reset}>TERMINATE_RESET</button>
                        </div>

                        <div className="pomodoro-config">
                            <div className="config-row">
                                <label>TARGET_CORE</label>
                                <select
                                    value={selectedTaskId}
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                    className="terminal-select"
                                >
                                    <option value="">General Focus</option>
                                    {tasks.map(t => (
                                        <option key={t.id} value={t.id}>{t.text}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="config-row">
                                <label>BINAURAL_AMBIENCE</label>
                                <div className="ambience-toggles">
                                    {["NONE", "HUM", "RAIN"].map(type => (
                                        <button
                                            key={type}
                                            className={`text-btn ${ambience === type ? 'active' : ''}`}
                                            onClick={() => { initAudio(); setAmbience(type); }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="config-row">
                                <label>AUTO_SEQUENCE</label>
                                <button
                                    className={`text-btn ${autoStart ? 'active' : ''}`}
                                    onClick={() => setAutoStart(!autoStart)}
                                >
                                    {autoStart ? 'ENABLED' : 'DISABLED'}
                                </button>
                            </div>

                            {/* Custom Duration Controls */}
                            <div className="config-row">
                                <label>FOCUS_MINS</label>
                                <input
                                    type="number"
                                    value={minutesInput}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setMinutesInput(val);
                                        if (!running && mode === "WORK") setSecondsLeft(val * 60);
                                    }}
                                    className="terminal-number-input"
                                />
                            </div>
                            <div className="config-row">
                                <label>BREAK_MINS</label>
                                <input
                                    type="number"
                                    value={breakInput}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setBreakInput(val);
                                        if (!running && mode === "BREAK" && cycles % 4 !== 0) setSecondsLeft(val * 60);
                                    }}
                                    className="terminal-number-input"
                                />
                            </div>
                            <div className="config-row">
                                <label>LONG_BREAK</label>
                                <input
                                    type="number"
                                    value={longBreakInput}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setLongBreakInput(val);
                                        if (!running && mode === "BREAK" && cycles % 4 === 0) setSecondsLeft(val * 60);
                                    }}
                                    className="terminal-number-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pomodoro-right">
                        <div className="log-header">COMMAND_HISTORY_LOG</div>
                        <div className="session-log">
                            {persistedLog.length === 0 && <div className="dim-text">Waiting for session initialization...</div>}
                            {persistedLog.map((entry, i) => (
                                <div key={i} className="log-entry">
                                    <span className="terminal-green">TRC_</span> {entry}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <footer className="pomodoro-footer">
                <div className="footer-left-group">
                    <div className="footer-stat">[ SESSION_STATUS :: <span className="highlight-green">ENHANCED_FOCUS</span> ]</div>
                    <div className="footer-stat">CYCLES_COMPLETED: {cycles}</div>
                </div>

                <div className="footer-right-group">
                    <div className="footer-stat">NEXT_PHASE: {mode === "WORK" ? (cycles % 4 === 3 ? `LONG_BREAK` : `BREAK`) : "WORK SESSION"}</div>
                    <div className="footer-stat">© 2026 PREPTRACK_OS</div>
                </div>
            </footer>
        </div>
    );
}
