
import { useState, useEffect } from "react";
import { login, signup } from "./auth";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Login() {
    const [stage, setStage] = useState("intro"); // 'intro', 'selection', 'form'
    const [isSignup, setIsSignup] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // STAGE 1 LOGIC: INTRO TIMEOUT
    useEffect(() => {
        // Auto transition from 'intro' to 'selection' after 2.6 seconds
        if (stage === "intro") {
            const timer = setTimeout(() => {
                setStage("selection");
            }, 2600);
            return () => clearTimeout(timer);
        }
    }, [stage]);

    // STAGE 2 LOGIC: USER SELECTS MODE
    const handleSelection = (mode) => {
        setIsSignup(mode === "signup");
        setStage("form");
        setError("");
    };

    const handleBack = () => {
        setStage("selection");
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (isSignup) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="scanlines"></div> {/* CRT OVERLAY EFFECT */}

            {/* --- STAGE 1: INTRO SEQUENCE --- */}
            {stage === "intro" && (
                <div className="intro-box">
                    <h1 className="glitch-text">PrepTrack</h1>
                    <p className="terminal-subtitle">INITIALIZING SYSTEM...</p>
                </div>
            )}

            {/* --- STAGE 2: SELECTION SCREEN --- */}
            {stage === "selection" && (
                <div className="selection-box">
                    <button className="big-bracket-btn" onClick={() => handleSelection("signin")}>
                        [ SIGN IN ]
                    </button>
                    <button className="big-bracket-btn" onClick={() => handleSelection("signup")}>
                        [ SIGN UP ]
                    </button>
                </div>
            )}

            {/* --- STAGE 3: AUTHENTICATION FORM --- */}
            {stage === "form" && (
                <div className="login-form-box">
                    <div className="form-header">
                        <button className="text-btn" onClick={handleBack} style={{ fontSize: '0.9rem' }}>
                            &lt; BACK
                        </button>
                        <span className="form-title">
                            {isSignup ? "NEW_USER_REGISTRATION" : "USER_AUTHENTICATION"}
                        </span>
                    </div>

                    {error && <div style={{ color: "#ff4444", marginBottom: "1rem", border: "1px dashed #ff4444", padding: "10px" }}>ERR: {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="login-field">
                            <label className="field-label">USER_ID / EMAIL</label>
                            <input
                                className="field-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                                placeholder="enter_email..."
                            />
                        </div>

                        <div className="login-field">
                            <label className="field-label">ACCESS_KEY / PASSWORD</label>
                            <input
                                className="field-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="sv_cheats 1..."
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '2.5rem' }}>
                            <button type="submit" className="big-bracket-btn" style={{ fontSize: '1.2rem', padding: '10px 30px' }}>
                                [ {isSignup ? "REGISTER" : "LOGIN"} ]
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
