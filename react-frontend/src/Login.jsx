
import { useState, useEffect } from "react";
import { login, signup, signInWithGoogle } from "./auth";
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

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-viz"></div>
            <div className="login-vignette"></div>
            <div className="login-scanlines"></div>

            <div className="login-interface">
                {/* --- STAGE 1: INTRO SEQUENCE --- */}
                {stage === "intro" && (
                    <div className="branding-intro">
                        <div className="logo-glitch-container">
                            <h1 className="logo-text">PREP<span className="logo-accent">TRACK</span></h1>
                            <div className="logo-glow"></div>
                        </div>
                        <div className="loading-bar-container">
                            <div className="loading-bar-fill"></div>
                        </div>
                        <p className="loading-status">INITIALIZING_CORE_SYSTEMS...</p>
                    </div>
                )}

                {/* --- STAGE 2: SELECTION SCREEN --- */}
                {stage === "selection" && (
                    <div className="auth-selection">
                        <div className="auth-header">
                            <h2 className="auth-brand">PREPTRACK</h2>
                            <p className="auth-tagline">QUANTUM_PRODUCTIVITY_INTERFACE</p>
                        </div>

                        <div className="auth-options">
                            <button className="premium-auth-btn" onClick={() => handleSelection("signin")}>
                                <span className="btn-label">EXISTING_USER</span>
                                <span className="btn-value">SIGN_IN</span>
                            </button>
                            <button className="premium-auth-btn secondary" onClick={() => handleSelection("signup")}>
                                <span className="btn-label">NEW_ENTITY</span>
                                <span className="btn-value">CREATE_ACCOUNT</span>
                            </button>

                            <div className="auth-divider">
                                <span>OR_AUTHENTICATE_VIA</span>
                            </div>

                            <button className="google-auth-btn" onClick={handleGoogleLogin}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
                                SIGN_IN_WITH_GOOGLE
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STAGE 3: AUTHENTICATION FORM --- */}
                {stage === "form" && (
                    <div className="auth-form-container">
                        <header className="auth-form-header">
                            <button className="back-link" onClick={handleBack}>
                                &larr; RETURN
                            </button>
                            <div className="form-info">
                                <span className="form-mode">{isSignup ? "REGISTRATION" : "AUTHENTICATION"}</span>
                                <span className="form-session">SESSION_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
                            </div>
                        </header>

                        <div className="auth-form-body">
                            {error && (
                                <div className="auth-error-box">
                                    <div className="error-icon">!</div>
                                    <div className="error-msg">SYSTEM_ERROR: {error}</div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="auth-input-group">
                                    <label>IDENTIFIER_EMAIL</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoFocus
                                            required
                                            placeholder="user@preptrack.sys"
                                        />
                                        <div className="input-glow"></div>
                                    </div>
                                </div>

                                <div className="auth-input-group">
                                    <label>ACCESS_PASSCODE</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                        />
                                        <div className="input-glow"></div>
                                    </div>
                                </div>

                                <button type="submit" className="auth-submit-btn">
                                    {isSignup ? "AUTHORIZE_NEW_USER" : "ESTABLISH_CONNECTION"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <footer className="auth-footer">
                <span className="build-ver">v4.0.2-STABLE</span>
                <span className="sys-status">ALL_SYSTEMS_OPERATIONAL [OK]</span>
            </footer>
        </div>
    );
}
