import { useEffect, useRef, useState } from "react";
import "./Pomodoro.css";

export default function Pomodoro() {
    const [mode, setMode] = useState("WORK"); // WORK | BREAK
    const [minutesInput, setMinutesInput] = useState(25);
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [cycles, setCycles] = useState(0);

    const endTimeRef = useRef(null);

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
    }, [running]);

    const start = () => {
        endTimeRef.current = Date.now() + secondsLeft * 1000;
        setRunning(true);
    };

    const pause = () => setRunning(false);

    const reset = () => {
        setRunning(false);
        setSecondsLeft(minutesInput * 60);
    };

    // Play a beep sound using Web Audio API
    const playBeep = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'square';
        gainNode.gain.value = 0.3;

        oscillator.start();

        // Beep pattern: 3 short beeps
        setTimeout(() => oscillator.stop(), 150);
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            osc2.connect(gainNode);
            osc2.frequency.value = 800;
            osc2.type = 'square';
            osc2.start();
            setTimeout(() => osc2.stop(), 150);
        }, 250);
        setTimeout(() => {
            const osc3 = audioContext.createOscillator();
            osc3.connect(gainNode);
            osc3.frequency.value = 1000; // Higher pitch for final beep
            osc3.type = 'square';
            osc3.start();
            setTimeout(() => osc3.stop(), 300);
        }, 500);
    };

    const handleComplete = () => {
        setRunning(false);
        playBeep(); // Play beep sound

        if (mode === "WORK") {
            setCycles((c) => c + 1);
        }
    };

    const switchMode = (newMode) => {
        setRunning(false);
        setMode(newMode);
        setSecondsLeft(minutesInput * 60);
    };

    const applyTime = () => {
        setRunning(false);
        setSecondsLeft(minutesInput * 60);
    };

    const format = (s) => {
        const m = String(Math.floor(s / 60)).padStart(2, "0");
        const sec = String(s % 60).padStart(2, "0");
        return `${m}:${sec}`;
    };

    const progress = secondsLeft / ((minutesInput * 60) || 1);
    const barLength = 14;
    // CLAMP filled to [0, barLength] to prevent negative repeat crash
    const rawFilled = Math.floor((1 - progress) * barLength);
    const filled = Math.max(0, Math.min(barLength, rawFilled));

    return (
        <div className="pomodoro-terminal">
            <div className="pomodoro-header">
                POMODORO :: {mode}_MODE
            </div>

            <div className="pomodoro-mode-switch">
                <button
                    className={mode === "WORK" ? "active" : ""}
                    onClick={() => switchMode("WORK")}
                >
                    WORK
                </button>
                <button
                    className={mode === "BREAK" ? "active" : ""}
                    onClick={() => switchMode("BREAK")}
                >
                    BREAK
                </button>
            </div>

            <div className="pomodoro-timer">
                {format(secondsLeft)}
            </div>

            <div className="pomodoro-progress">
                {"▓".repeat(filled)}
                {"░".repeat(barLength - filled)}
            </div>

            <div className="pomodoro-input">
                DURATION (MIN):
                <input
                    type="number"
                    min="1"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(Number(e.target.value))}
                />
                <button onClick={applyTime}>APPLY</button>
            </div>

            <div className="pomodoro-controls">
                <button onClick={start} disabled={running}>
                    [ START ]
                </button>
                <button onClick={pause} disabled={!running}>
                    [ PAUSE ]
                </button>
                <button onClick={reset}>
                    [ RESET ]
                </button>
            </div>

            <div className="pomodoro-footer">
                CYCLES_COMPLETED :: {cycles}
                {!running && <span className="cursor">_</span>}
            </div>
        </div>
    );
}
