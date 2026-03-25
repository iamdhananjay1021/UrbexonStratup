import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";

/* ── Reusable Field ── */
const Field = ({ label, hint, icon, rightElement, ...props }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#8c8580",
                }}>
                    {label}
                </label>
                {hint}
            </div>
            <div style={{ position: "relative" }}>
                <span style={{
                    position: "absolute", left: 14, top: "50%",
                    transform: "translateY(-50%)", pointerEvents: "none",
                    color: focused ? "#c8a96e" : "#b0aba5",
                    transition: "color 0.2s", display: "flex",
                }}>
                    {icon}
                </span>
                <input
                    {...props}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                    style={{
                        width: "100%",
                        padding: rightElement ? "13px 44px 13px 42px" : "13px 14px 13px 42px",
                        background: focused ? "#fff" : "#fafaf8",
                        border: `1.5px solid ${focused ? "#c8a96e" : "#e8e4de"}`,
                        color: "#1c1917",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                        boxShadow: focused ? "0 0 0 3px rgba(200,169,110,0.1)" : "none",
                        borderRadius: 0,
                    }}
                />
                {rightElement && (
                    <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)" }}>
                        {rightElement}
                    </span>
                )}
            </div>
        </div>
    );
};

/* ── Main ── */
const Login = () => {
    const { login, loginWithData, user, loading } = useAuth();
    const navigate = useNavigate();
    const emailRef = useRef(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // OTP step
    const [step, setStep] = useState("login"); // "login" | "otp"
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!loading && user) navigate("/", { replace: true });
    }, [user, loading, navigate]);

    useEffect(() => {
        if (step === "login") emailRef.current?.focus();
    }, [step]);

    /* ── Step 1: Login ── */
    const submitHandler = useCallback(async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return setError("Email and password are required");
        try {
            setSubmitting(true);
            setError("");
            await login(email.trim(), password);
        } catch (err) {
            const data = err.response?.data;
            if (data?.requiresVerification) { setStep("otp"); return; }
            setError(data?.message || "Invalid email or password");
        } finally {
            setSubmitting(false);
        }
    }, [email, password, login]);

    /* ── Step 2: Verify OTP ── */
    const verifyOtp = useCallback(async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter a valid 6-digit OTP");
        try {
            setOtpLoading(true);
            setError("");
            const { data } = await api.post("/auth/verify-otp", { email: email.trim(), otp: otp.trim() });
            loginWithData(data);
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setOtpLoading(false);
        }
    }, [otp, email, loginWithData]);

    /* ── Resend OTP ── */
    const resendOtp = useCallback(async () => {
        try {
            setResendLoading(true);
            setError("");
            await api.post("/auth/resend-otp", { email: email.trim() });
            setSuccess("OTP resent successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    }, [email]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            background: "#f8f6f2",
            fontFamily: "'Jost', 'DM Sans', system-ui, sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Jost:wght@300;400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                ::placeholder { color: #c4bdb5 !important; font-size: 13px; }

                @keyframes lg-fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes lg-shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
                @keyframes lg-spin   { to{transform:rotate(360deg)} }

                .lg-card { animation: lg-fadeIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
                .lg-error { animation: lg-shake 0.35s ease; }

                .lg-submit {
                    width: 100%; padding: 14px;
                    border: none; cursor: pointer;
                    font-family: inherit; font-size: 11px; font-weight: 700;
                    letter-spacing: 0.18em; text-transform: uppercase;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.2s; position: relative; overflow: hidden;
                }
                .lg-submit::before {
                    content: ''; position: absolute; inset: 0;
                    background: rgba(255,255,255,0.12); opacity: 0; transition: opacity 0.2s;
                }
                .lg-submit:hover:not(:disabled)::before { opacity: 1; }
                .lg-submit:hover:not(:disabled) { transform: translateY(-1px); }
                .lg-submit:active:not(:disabled) { transform: scale(0.99); }
                .lg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

                .lg-link {
                    color: #c8a96e; font-weight: 700; text-decoration: none;
                    font-size: 13px; transition: color 0.2s; border-bottom: 1px solid transparent;
                }
                .lg-link:hover { color: #a68850; border-bottom-color: #a68850; }

                .lg-eye {
                    background: none; border: none; cursor: pointer; padding: 4px;
                    color: #b0aba5; display: flex; align-items: center; transition: color 0.2s;
                    font-family: inherit;
                }
                .lg-eye:hover { color: #c8a96e; }

                .lg-otp-input {
                    width: 100%; padding: 18px 14px;
                    background: #fff;
                    border: 1.5px solid #e8e4de;
                    font-size: 2rem; font-weight: 700; text-align: center;
                    letter-spacing: 14px; color: #1c1917;
                    outline: none; transition: all 0.2s; font-family: inherit;
                    box-sizing: border-box; border-radius: 0;
                }
                .lg-otp-input:focus { border-color: #c8a96e; box-shadow: 0 0 0 3px rgba(200,169,110,0.1); }

                .lg-resend {
                    background: none; border: none; cursor: pointer; font-family: inherit;
                    font-size: 13px; font-weight: 700; color: #c8a96e;
                    transition: color 0.2s; padding: 0;
                }
                .lg-resend:hover { color: #a68850; }
                .lg-resend:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            {/* ── Left decorative panel (hidden on mobile) ── */}
            <div style={{
                display: "none",
                width: "42%",
                background: "#1c1917",
                padding: "60px 48px",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
            }}
                className="lg-left-panel"
            >
                <style>{`
                    @media (min-width: 900px) { .lg-left-panel { display: flex !important; } }
                `}</style>

                {/* Texture */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(rgba(200,169,110,0.08) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.5rem", fontWeight: 600,
                        color: "#f0ece4", letterSpacing: "0.02em",
                    }}>
                        Urbexon
                    </div>
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: "italic",
                        fontSize: "1.8rem", lineHeight: 1.4,
                        color: "rgba(240,236,228,0.75)",
                        marginBottom: 24,
                    }}>
                        "Quality is never an accident; it is always the result of intelligent effort."
                    </p>
                    <div style={{
                        height: 1,
                        background: "linear-gradient(90deg, rgba(200,169,110,0.5), transparent)",
                        marginBottom: 20,
                    }} />
                    <p style={{
                        fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.15em", textTransform: "uppercase",
                        color: "rgba(200,169,110,0.6)",
                    }}>
                        Premium Shopping Experience
                    </p>
                </div>
            </div>

            {/* ── Right: Form panel ── */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
            }}>
                <div className="lg-card" style={{ width: "100%", maxWidth: 400 }}>

                    {/* Mobile logo */}
                    <div style={{ marginBottom: 40 }}>
                        <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "1.6rem", fontWeight: 600,
                            color: "#1c1917", letterSpacing: "0.01em",
                            marginBottom: 6,
                        }}>
                            Urbexon
                        </div>
                        <p style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: "#c8a96e",
                        }}>
                            {step === "login" ? "Welcome Back" : "Verify Your Email"}
                        </p>
                    </div>

                    {/* ─────────── LOGIN STEP ─────────── */}
                    {step === "login" && (
                        <>
                            <h1 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "1.9rem", fontWeight: 600,
                                color: "#1c1917", marginBottom: 6, lineHeight: 1.2,
                            }}>
                                Sign In
                            </h1>
                            <p style={{ fontSize: 13, color: "#8c8580", marginBottom: 32 }}>
                                Sign in to your Urbexon account
                            </p>

                            {error && (
                                <div className="lg-error" key={error} style={{
                                    marginBottom: 24, padding: "11px 14px",
                                    background: "#fff5f5",
                                    border: "1.5px solid #fecaca",
                                    color: "#b91c1c", fontSize: 13,
                                    display: "flex", gap: 8, alignItems: "flex-start",
                                }}>
                                    <span>⚠</span> <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={submitHandler} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                <Field
                                    label="Email Address"
                                    icon={<FaEnvelope size={12} />}
                                    ref={emailRef}
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                />

                                <Field
                                    label="Password"
                                    icon={<FaLock size={12} />}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    hint={
                                        <Link to="/forgot-password" style={{
                                            fontSize: 11, fontWeight: 600, color: "#c8a96e",
                                            textDecoration: "none", letterSpacing: "0.06em",
                                            textTransform: "uppercase", transition: "color 0.2s",
                                        }}
                                            onMouseEnter={e => e.target.style.color = "#a68850"}
                                            onMouseLeave={e => e.target.style.color = "#c8a96e"}
                                        >
                                            Forgot?
                                        </Link>
                                    }
                                    rightElement={
                                        <button type="button" className="lg-eye"
                                            onClick={() => setShowPassword(s => !s)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}>
                                            {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                        </button>
                                    }
                                />

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="lg-submit"
                                    style={{
                                        marginTop: 8,
                                        background: submitting
                                            ? "rgba(200,169,110,0.3)"
                                            : "linear-gradient(135deg, #c8a96e, #a68850)",
                                        color: submitting ? "#c8a96e" : "#fff",
                                        boxShadow: submitting ? "none" : "0 6px 24px rgba(200,169,110,0.25)",
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <div style={{
                                                width: 13, height: 13,
                                                border: "2px solid rgba(200,169,110,0.3)",
                                                borderTopColor: "#c8a96e",
                                                borderRadius: "50%",
                                                animation: "lg-spin 0.7s linear infinite",
                                            }} />
                                            Signing In…
                                        </>
                                    ) : "Sign In"}
                                </button>
                            </form>

                            <div style={{
                                marginTop: 28,
                                paddingTop: 24,
                                borderTop: "1px solid #ece8e2",
                                textAlign: "center",
                            }}>
                                <p style={{ fontSize: 13, color: "#8c8580" }}>
                                    New to Urbexon?{" "}
                                    <Link to="/register" className="lg-link">
                                        Create Account →
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}

                    {/* ─────────── OTP STEP ─────────── */}
                    {step === "otp" && (
                        <>
                            <h1 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "1.9rem", fontWeight: 600,
                                color: "#1c1917", marginBottom: 6, lineHeight: 1.2,
                            }}>
                                Verify Email
                            </h1>
                            <p style={{ fontSize: 13, color: "#8c8580", marginBottom: 4 }}>
                                OTP sent to
                            </p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#c8a96e", marginBottom: 28 }}>
                                {email}
                            </p>

                            {error && (
                                <div className="lg-error" key={error} style={{
                                    marginBottom: 20, padding: "11px 14px",
                                    background: "#fff5f5", border: "1.5px solid #fecaca",
                                    color: "#b91c1c", fontSize: 13,
                                    display: "flex", gap: 8,
                                }}>
                                    <span>⚠</span> <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div style={{
                                    marginBottom: 20, padding: "11px 14px",
                                    background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                                    color: "#15803d", fontSize: 13,
                                    display: "flex", gap: 8, alignItems: "center",
                                }}>
                                    <FaCheckCircle size={12} /> {success}
                                </div>
                            )}

                            <form onSubmit={verifyOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <div>
                                    <label style={{
                                        display: "block", fontSize: 10, fontWeight: 700,
                                        letterSpacing: "0.18em", textTransform: "uppercase",
                                        color: "#8c8580", textAlign: "center", marginBottom: 12,
                                    }}>
                                        Enter 6-digit OTP
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                                        placeholder="——————"
                                        className="lg-otp-input"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={otpLoading}
                                    className="lg-submit"
                                    style={{
                                        background: otpLoading
                                            ? "rgba(200,169,110,0.3)"
                                            : "linear-gradient(135deg, #c8a96e, #a68850)",
                                        color: otpLoading ? "#c8a96e" : "#fff",
                                        boxShadow: otpLoading ? "none" : "0 6px 24px rgba(200,169,110,0.25)",
                                    }}
                                >
                                    {otpLoading ? (
                                        <>
                                            <div style={{
                                                width: 13, height: 13,
                                                border: "2px solid rgba(200,169,110,0.3)",
                                                borderTopColor: "#c8a96e",
                                                borderRadius: "50%",
                                                animation: "lg-spin 0.7s linear infinite",
                                            }} />
                                            Verifying…
                                        </>
                                    ) : (
                                        <><FaCheckCircle size={11} /> Verify & Sign In</>
                                    )}
                                </button>
                            </form>

                            <div style={{ marginTop: 24, textAlign: "center" }}>
                                <p style={{ fontSize: 13, color: "#8c8580", marginBottom: 10 }}>
                                    Didn't receive OTP?{" "}
                                    <button onClick={resendOtp} disabled={resendLoading} className="lg-resend">
                                        {resendLoading ? "Sending…" : "Resend OTP"}
                                    </button>
                                </p>
                                <button
                                    onClick={() => { setStep("login"); setError(""); setOtp(""); }}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        fontSize: 12, color: "#b0aba5", fontFamily: "inherit",
                                        transition: "color 0.2s",
                                    }}
                                    onMouseEnter={e => e.target.style.color = "#1c1917"}
                                    onMouseLeave={e => e.target.style.color = "#b0aba5"}
                                >
                                    ← Back to Login
                                </button>
                            </div>
                        </>
                    )}

                    <p style={{ marginTop: 32, fontSize: 11, color: "#c4bdb5", textAlign: "center" }}>
                        🔒 Your data is safe & secure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;