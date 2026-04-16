/**
 * Login.jsx — Production
 * Role-based redirect: user→/, vendor→/vendor/dashboard, delivery_boy→/delivery/dashboard
 */
import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";

const getRoleRedirect = (role) => {
    switch (role) {
        case "vendor":        return "/vendor/dashboard";
        case "delivery_boy":  return "/delivery/dashboard";
        case "admin":
        case "owner":         return null; // block - use admin panel
        default:              return "/";
    }
};

const S = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box}
.lg-root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:#f7f3eb;position:relative;overflow:hidden;font-family:'DM Sans',sans-serif}
.lg-root::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 120% 80% at 50% -20%,rgba(201,168,76,0.08) 0%,transparent 60%),radial-gradient(ellipse 60% 60% at 100% 100%,rgba(26,23,64,0.04) 0%,transparent 60%)}
.lg-card{position:relative;width:100%;max-width:420px;background:#fff;border:1px solid rgba(201,168,76,0.2);box-shadow:0 20px 60px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.04)}
.lg-top{background:#1a1740;padding:32px;text-align:center}
.lg-brand{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:#c9a84c;letter-spacing:6px;text-transform:uppercase;margin:0}
.lg-brand-sub{font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:4px;text-transform:uppercase;margin:6px 0 0}
.lg-body{padding:32px}
.lg-title{font-size:18px;font-weight:700;color:#1a1740;margin:0 0 4px}
.lg-sub{font-size:12px;color:#94a3b8;margin:0 0 28px;letter-spacing:0.3px}
.lg-field{margin-bottom:20px}
.lg-label{display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-bottom:8px}
.lg-inp-wrap{position:relative}
.lg-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none;transition:color 0.2s;display:flex}
.lg-inp-wrap:focus-within .lg-icon{color:#c9a84c}
.lg-inp{width:100%;padding:13px 13px 13px 42px;border:1.5px solid #e2e8f0;background:#fafafe;color:#1e293b;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s;box-sizing:border-box}
.lg-inp:focus{border-color:#c9a84c;background:#fff;box-shadow:0 0 0 3px rgba(201,168,76,0.08)}
.lg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;transition:color 0.2s;display:flex}
.lg-eye:hover{color:#1a1740}
.lg-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:11px 14px;font-size:12.5px;margin-bottom:18px;display:flex;gap:8px;align-items:flex-start}
.lg-btn{width:100%;padding:15px;background:#1a1740;border:none;color:#c9a84c;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all 0.25s;margin-top:4px;position:relative;overflow:hidden}
.lg-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent);transition:left 0.5s}
.lg-btn:hover:not(:disabled)::before{left:100%}
.lg-btn:hover:not(:disabled){background:#252060;box-shadow:0 8px 24px rgba(26,23,64,0.25)}
.lg-btn:disabled{opacity:0.5;cursor:not-allowed}
.lg-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent);margin:24px 0}
.lg-foot{font-size:12px;color:#94a3b8;text-align:center}
.lg-link{color:#1a1740;font-weight:600;text-decoration:none;transition:color 0.2s}
.lg-link:hover{color:#c9a84c}
.lg-spin{width:16px;height:16px;border:2px solid rgba(201,168,76,0.3);border-top-color:#c9a84c;border-radius:50%;animation:sp 0.7s linear infinite;display:inline-block}
@keyframes sp{to{transform:rotate(360deg)}}
.lg-forgot{font-size:11px;color:#94a3b8;text-decoration:none;float:right;margin-top:-2px;transition:color 0.2s}
.lg-forgot:hover{color:#c9a84c}
`;

const Login = () => {
    const navigate = useNavigate();
    const { loginWithData } = useAuth();

    const [email, setEmail]     = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");

    // OTP re-verify state
    const [otpStep, setOtpStep]   = useState(false);
    const [otp, setOtp]           = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return setError("Email and password are required");
        try {
            setLoading(true); setError("");
            const { data } = await api.post("/auth/login", { email: email.trim(), password: password.trim() });
            if (["admin","owner"].includes(data.role)) {
                setError("Admin accounts must use the Admin Panel.");
                return;
            }
            loginWithData(data);
            const redirect = getRoleRedirect(data.role) || "/";
            navigate(redirect, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || "Login failed";
            if (err?.response?.data?.requiresVerification) {
                setOtpStep(true);
                setError("");
            } else {
                setError(msg);
            }
        } finally { setLoading(false); }
    }, [email, password, loginWithData, navigate]);

    const handleVerifyOtp = useCallback(async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter valid 6-digit OTP");
        try {
            setOtpLoading(true); setError("");
            const { data } = await api.post("/auth/verify-otp", { email: email.trim(), otp: otp.trim() });
            // Save auth and trigger page reload for AuthContext to pick up
            loginWithData(data);
            const redirect = getRoleRedirect(data.role) || "/";
            navigate(redirect, { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid OTP");
        } finally { setOtpLoading(false); }
    }, [otp, email, loginWithData, navigate]);

    return (
        <div className="lg-root">
            <style>{S}</style>
            <div className="lg-card">
                <div className="lg-top">
                    <div className="lg-brand">Urbexon</div>
                    <div className="lg-brand-sub">Explore the unknown</div>
                </div>
                <div className="lg-body">
                    {!otpStep ? (
                        <>
                            <div className="lg-title">Welcome back</div>
                            <div className="lg-sub">Sign in to your account</div>

                            {error && <div className="lg-err"><span>◆</span><span>{error}</span></div>}

                            <form onSubmit={handleLogin}>
                                <div className="lg-field">
                                    <label className="lg-label">Email Address</label>
                                    <div className="lg-inp-wrap">
                                        <span className="lg-icon"><FaEnvelope size={13} /></span>
                                        <input className="lg-inp" type="email" placeholder="your@email.com"
                                            value={email} onChange={e => { setEmail(e.target.value); setError(""); }} autoComplete="email" />
                                    </div>
                                </div>
                                <div className="lg-field">
                                    <label className="lg-label">
                                        Password
                                        <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
                                    </label>
                                    <div className="lg-inp-wrap">
                                        <span className="lg-icon"><FaLock size={13} /></span>
                                        <input className="lg-inp" type={showPwd ? "text" : "password"}
                                            placeholder="••••••••" value={password}
                                            onChange={e => { setPassword(e.target.value); setError(""); }}
                                            style={{ paddingRight: 44 }} autoComplete="current-password" />
                                        <button type="button" className="lg-eye" onClick={() => setShowPwd(s => !s)}>
                                            {showPwd ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="lg-btn" disabled={loading}>
                                    {loading ? <><span className="lg-spin" style={{ marginRight: 8 }} />Signing In</> : "Sign In →"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="lg-title">Verify Email</div>
                            <div className="lg-sub">OTP sent to {email}</div>
                            {error && <div className="lg-err"><span>◆</span><span>{error}</span></div>}
                            <form onSubmit={handleVerifyOtp}>
                                <div className="lg-field">
                                    <label className="lg-label">6-Digit OTP</label>
                                    <input className="lg-inp" type="text" inputMode="numeric" maxLength={6}
                                        placeholder="• • • • • •"
                                        value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,"")); setError(""); }}
                                        style={{ paddingLeft: 16, fontSize: 22, letterSpacing: 12, textAlign: "center" }} />
                                </div>
                                <button type="submit" className="lg-btn" disabled={otpLoading}>
                                    {otpLoading ? <><span className="lg-spin" style={{ marginRight: 8 }} />Verifying</> : "Verify & Continue →"}
                                </button>
                            </form>
                            <div style={{ textAlign: "center", marginTop: 16 }}>
                                <button onClick={() => setOtpStep(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                                    ← Back to Login
                                </button>
                            </div>
                        </>
                    )}

                    <div className="lg-divider" />
                    <div className="lg-foot">
                        New to Urbexon?&nbsp;&nbsp;<Link to="/register" className="lg-link">Create Account →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Login;
