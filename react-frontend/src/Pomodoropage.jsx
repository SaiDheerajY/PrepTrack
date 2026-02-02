import Pomodoro from "./Pomodoro";
import { useNavigate } from "react-router-dom";

export default function PomodoroPage() {
    const navigate = useNavigate();

    return (
        <div className="pomodoro-page">
            <button
                onClick={() => navigate("/")}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '30px',
                    background: 'transparent',
                    border: '1px solid #00ff9c',
                    color: '#00ff9c',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.9rem',
                    zIndex: 10
                }}
            >
                [ EXIT ]
            </button>
            <Pomodoro />
        </div>
    );
}
