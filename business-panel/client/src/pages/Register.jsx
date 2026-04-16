import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaPhone, FaMapMarkedAlt, FaStore, FaMotorcycle
} from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const PHONE_REGEX = /^[6-9]\d{9}$/;

const STRENGTH_CONFIG = {
    weak: { color: "#ef4444", label: "Too short", width: "33%" },
    medium: { color: "#f59e0b", label: "Medium", width: "66%" },
    strong: { color: "#10b981", label: "Strong", width: "100%" },
};

const ROLES = [
    { value: "user", label: "Customer", icon: <FaUser size={14} />, desc: "Shop & buy products" },
    { value: "vendor", label: "Sell on Urbexon", icon: <FaStore size={14} />, desc: "List & sell your products" },
    { value: "delivery_boy", label: "Delivery Partner", icon: <FaMotorcycle size={14} />, desc: "Earn by delivering orders" },
];

const GLOBAL_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

    .mc-root {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background: #080810;
        position: relative;
        overflow: hidden;
        font-family: 'DM Sans', sans-serif;
    }
    .mc-root::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 80% 60% at 50% 0%,   rgba(180,140,60,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 100%, rgba(120,80,20,0.10) 0%, transparent 60%);
        pointer-events: none;
    }
    .mc-card {
        position: relative;
        width: 100%;
        max-width: 480px;
        background: #16151f;
        border: 1px solid rgba(200,168,75,0.28);
        border-radius: 6px;
        padding: 48px 44px;
        box-shadow: 0 40px 80px rgba(0,0,0,0.85), 0 0 120px rgba(200,168,75,0.06);
        animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        box-sizing: border-box;
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .mc-card::before { content: ''; position: absolute; top: 14px; left: 14px; width: 24px; height: 24px; border: 1.5px solid rgba(200,168,75,0.55); border-width: 1.5px 0 0 1.5px; }
    .mc-card::after  { content: ''; position: absolute; bottom: 14px; right: 14px; width: 24px; height: 24px; border: 1.5px solid rgba(200,168,75,0.55); border-width: 0 1.5px 1.5px 0; }

    .mc-divider { width:100%; height:1px; background: linear-gradient(90deg, transparent, rgba(200,168,75,0.4), transparent); margin: 24px 0; }
    .mc-logo { display:flex; flex-direction:column; align-items:center; margin-bottom:24px; }
    .mc-logo-icon { width:50px; height:50px; border:1.5px solid rgba(200,168,75,0.45); border-radius:50%; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle, rgba(200,168,75,0.14), rgba(120,80,20,0.08)); margin-bottom:12px; }
    .mc-brand { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:700; letter-spacing:7px; text-transform:uppercase; color:#d4aa55; }
    .mc-brand-sub { font-size:9px; letter-spacing:4px; color:rgba(200,168,75,0.5); text-transform:uppercase; font-weight:500; margin-top:5px; }
    .mc-heading { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:600; color:#f0e4c0; text-align:center; letter-spacing:2px; margin-bottom:4px; }
    .mc-subheading { font-size:10px; color:rgba(200,168,75,0.5); text-align:center; letter-spacing:3.5px; text-transform:uppercase; margin-bottom:24px; }

    /* ── Role Selector ── */
    .mc-role-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:24px; }
    .mc-role-card {
        cursor:pointer;
        border:1.5px solid rgba(200,168,75,0.15);
        border-radius:8px;
        padding:12px 8px;
        text-align:center;
        background:rgba(255,255,255,0.02);
        transition:all 0.2s;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:6px;
    }
    .mc-role-card:hover { border-color:rgba(200,168,75,0.4); background:rgba(200,168,75,0.05); }
    .mc-role-card.selected { border-color:#c9a84c; background:rgba(200,168,75,0.10); }
    .mc-role-icon { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(200,168,75,0.1);color:#c9a84c; }
    .mc-role-label { font-size:11px;font-weight:600;color:#f0e4c0;letter-spacing:0.3px; }
    .mc-role-desc { font-size:9px;color:rgba(200,168,75,0.45);line-height:1.3;letter-spacing:0.2px; }
    .mc-role-card.selected .mc-role-label { color:#d4aa55; }

    .mc-field { margin-bottom:18px; }
    .mc-label { display:block; font-size:10px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:rgba(220,185,90,0.75); margin-bottom:8px; }
    .mc-input-wrap { position:relative; }
    .mc-input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(200,168,75,0.4); pointer-events:none; transition:color 0.2s; }
    .mc-input-wrap:focus-within .mc-input-icon { color:rgba(200,168,75,0.85); }
    .mc-input { width:100%; padding:13px 13px 13px 42px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,168,75,0.2); border-radius:3px; color:#f0e4c0; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:all 0.25s; box-sizing:border-box; }
    .mc-input::placeholder { color:rgba(200,168,75,0.22); font-size:13px; }
    .mc-input:focus { border-color:rgba(200,168,75,0.6); background:rgba(200,168,75,0.05); box-shadow:0 0 0 2px rgba(200,168,75,0.1); }
    .mc-phone-prefix { position:absolute; left:42px; top:50%; transform:translateY(-50%); font-size:13px; font-weight:600; color:rgba(200,168,75,0.55); pointer-events:none; }
    .mc-input-phone { padding-left:76px !important; }
    .mc-eye-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(200,168,75,0.35); cursor:pointer; padding:4px; transition:color 0.2s; }
    .mc-eye-btn:hover { color:rgba(200,168,75,0.85); }

    .mc-strength-bar { height:2px; background:rgba(255,255,255,0.07); border-radius:1px; margin-top:8px; overflow:hidden; }
    .mc-strength-fill { height:100%; border-radius:1px; transition:width 0.4s ease,background-color 0.4s ease; }
    .mc-strength-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; margin-top:5px; font-weight:600; }
    .mc-hint { font-size:11px; letter-spacing:0.5px; margin-top:5px; font-weight:500; }
    .mc-hint-warn { color:#fbbf24; } .mc-hint-error { color:#f87171; } .mc-hint-success { color:#34d399; }

    .mc-alert { padding:12px 16px; border-radius:3px; font-size:12.5px; margin-bottom:18px; display:flex; align-items:flex-start; gap:10px; animation:shake 0.35s ease; }
    .mc-alert-error   { background:rgba(239,68,68,0.08);  border:1px solid rgba(239,68,68,0.25);  color:#fca5a5; }
    .mc-alert-success { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); color:#6ee7b7; }
    @keyframes shake { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-5px); } 40%,80% { transform:translateX(5px); } }

    .mc-otp-notice { background:rgba(200,168,75,0.06); border:1px solid rgba(200,168,75,0.18); border-radius:3px; padding:10px 14px; font-size:11.5px; color:rgba(210,178,90,0.65); text-align:center; margin-bottom:22px; }
    .mc-otp-input { width:100%; padding:20px; background:rgba(255,255,255,0.04); border:1px solid rgba(200,168,75,0.2); border-radius:3px; color:#d4aa55; font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; text-align:center; letter-spacing:16px; outline:none; transition:all 0.25s; box-sizing:border-box; }
    .mc-otp-input::placeholder { color:rgba(200,168,75,0.15); letter-spacing:10px; }
    .mc-otp-input:focus { border-color:rgba(200,168,75,0.55); background:rgba(200,168,75,0.05); box-shadow:0 0 0 2px rgba(200,168,75,0.1); }

    .mc-btn { width:100%; padding:16px; background:linear-gradient(135deg,#b8943c 0%,#e8d070 50%,#b8943c 100%); background-size:200% 100%; border:none; border-radius:3px; color:#0a0a0f; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; letter-spacing:5px; text-transform:uppercase; cursor:pointer; transition:all 0.35s; display:flex; align-items:center; justify-content:center; gap:10px; margin-top:8px; position:relative; overflow:hidden; }
    .mc-btn:hover:not(:disabled) { box-shadow:0 8px 32px rgba(200,168,75,0.32); }
    .mc-btn:active:not(:disabled) { transform:scale(0.99); }
    .mc-btn:disabled { opacity:0.35; cursor:not-allowed; }
    .mc-spinner { width:14px; height:14px; border:2px solid rgba(0,0,0,0.2); border-top-color:#0a0a0f; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .mc-footer-text { font-size:12px; color:rgba(200,168,75,0.45); text-align:center; }
    .mc-link { color:rgba(210,178,90,0.8); font-weight:600; text-decoration:none; cursor:pointer; background:none; border:none; font-family:'DM Sans',sans-serif; font-size:inherit; transition:color 0.2s; }
    .mc-link:hover { color:#d4aa55; }
    .mc-link:disabled { opacity:0.4; cursor:not-allowed; }
    .mc-security { text-align:center; font-size:9px; letter-spacing:3px; color:rgba(200,168,75,0.22); text-transform:uppercase; margin-top:20px; }
    .mc-otp-email-label { text-align:center; font-size:12px; color:rgba(200,168,75,0.5); margin-bottom:5px; }
    .mc-otp-email-val   { text-align:center; font-size:14px; font-weight:600; color:#d4aa55; margin-bottom:20px; }
`;

const AlertBox = ({ type, children }) => (
    <div className={`mc-alert ${type === "error" ? "mc-alert-error" : "mc-alert-success"}`}>
        <span>{type === "error" ? "◆" : "✓"}</span>
        <span>{children}</span>
    </div>
);

const Register = () => {
    const navigate = useNavigate();
    const { loginWithData } = useAuth();

    const [step, setStep] = useState("register");
    const [selectedRole, setSelectedRole] = useState("user");
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const onChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === "phone" && !/^\d*$/.test(value)) return;
        setForm(prev => ({ ...prev, [name]: value }));
        setError("");
    }, []);

    const togglePassword = useCallback(() => setShowPassword(s => !s), []);
    const handleOtpChange = useCallback((e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }, []);
    const goBackToRegister = useCallback(() => { setStep("register"); setError(""); setOtp(""); }, []);

    const submitHandler = useCallback(async (e) => {
        e.preventDefault();
        const { name, email, phone, password } = form;
        if (!name || !email || !phone || !password) return setError("All fields are required");
        if (!PHONE_REGEX.test(phone)) return setError("Enter a valid 10-digit Indian mobile number");
        if (password.length < 8) return setError("Password must be at least 8 characters");
        try {
            setLoading(true); setError("");
            await api.post("/auth/register", { name: name.trim(), email: email.trim(), phone: phone.trim(), password, role: selectedRole });
            setStep("otp");
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally { setLoading(false); }
    }, [form, selectedRole]);

    const verifyOtp = useCallback(async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter valid 6-digit OTP");
        try {
            setLoading(true); setError("");
            const { data } = await api.post("/auth/verify-otp", { email: form.email.trim(), otp: otp.trim() });
            if (data.role === "vendor") {
                // Vendor - go to vendor portal
                loginWithData(data);
                window.location.href = (import.meta.env.VITE_VENDOR_URL || `${import.meta.env.VITE_VENDOR_URL || "http://localhost:5175"}/dashboard`);
            } else if (data.role === "delivery_boy") {
                // Delivery boy - go to delivery portal
                loginWithData(data);
                window.location.href = (import.meta.env.VITE_DELIVERY_URL || "http://localhost:5176") + "/dashboard";
            } else {
                loginWithData(data);
                navigate("/", { replace: true });
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid or expired OTP");
        } finally { setLoading(false); }
    }, [otp, form.email, loginWithData, navigate]);

    const resendOtp = useCallback(async () => {
        try {
            setResendLoading(true); setError("");
            await api.post("/auth/resend-otp", { email: form.email.trim() });
            setSuccess("OTP resent successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to resend OTP");
        } finally { setResendLoading(false); }
    }, [form.email]);

    const passwordStrength = useMemo(() => {
        const len = form.password.length;
        if (len === 0) return null;
        if (len < 8) return "weak";
        if (len < 12) return "medium";
        return "strong";
    }, [form.password]);

    const passwordInvalid = useMemo(
        () => form.password.length > 0 && form.password.length < 8,
        [form.password]
    );

    const phoneHint = useMemo(() => {
        const { phone } = form;
        if (!phone.length) return null;
        if (phone.length < 10) return <p className="mc-hint mc-hint-warn">{10 - phone.length} more digits needed</p>;
        if (!PHONE_REGEX.test(phone)) return <p className="mc-hint mc-hint-error">Must start with 6, 7, 8 or 9</p>;
        return <p className="mc-hint mc-hint-success">✓ &nbsp;Valid number</p>;
    }, [form.phone]);

    return (
        <div className="mc-root">
            <style>{GLOBAL_STYLES}</style>
            <div className="mc-card">

                {/* Brand */}
                <div className="mc-logo">
                    <div className="mc-logo-icon">
                        <FaMapMarkedAlt size={20} style={{ color: "#d4aa55" }} />
                    </div>
                    <div className="mc-brand">Urbexon</div>
                    <div className="mc-brand-sub">Explore the unknown</div>
                </div>

                <div className="mc-divider" />

                {step === "register" ? (
                    <>
                        <div className="mc-heading">Create Account</div>
                        <div className="mc-subheading">Choose your role</div>

                        {/* Role Selector */}
                        <div className="mc-role-grid">
                            {ROLES.map(r => (
                                <div
                                    key={r.value}
                                    className={`mc-role-card ${selectedRole === r.value ? "selected" : ""}`}
                                    onClick={() => setSelectedRole(r.value)}
                                >
                                    <div className="mc-role-icon">{r.icon}</div>
                                    <div className="mc-role-label">{r.label}</div>
                                    <div className="mc-role-desc">{r.desc}</div>
                                </div>
                            ))}
                        </div>

                        {error && <AlertBox type="error">{error}</AlertBox>}

                        <form onSubmit={submitHandler}>
                            <div className="mc-field">
                                <label className="mc-label">Full Name</label>
                                <div className="mc-input-wrap">
                                    <FaUser className="mc-input-icon" size={12} />
                                    <input name="name" type="text" placeholder="e.g. Rahul Verma"
                                        value={form.name} onChange={onChange} className="mc-input" />
                                </div>
                            </div>

                            <div className="mc-field">
                                <label className="mc-label">Email Address</label>
                                <div className="mc-input-wrap">
                                    <FaEnvelope className="mc-input-icon" size={12} />
                                    <input name="email" type="email" placeholder="your@email.com"
                                        value={form.email} onChange={onChange} className="mc-input" />
                                </div>
                            </div>

                            <div className="mc-field">
                                <label className="mc-label">Mobile Number</label>
                                <div className="mc-input-wrap">
                                    <FaPhone className="mc-input-icon" size={12} />
                                    <span className="mc-phone-prefix">+91</span>
                                    <input name="phone" type="tel" inputMode="numeric"
                                        maxLength={10} placeholder="9876543210"
                                        value={form.phone} onChange={onChange}
                                        className="mc-input mc-input-phone" />
                                </div>
                                {phoneHint}
                            </div>

                            <div className="mc-field">
                                <label className="mc-label">Password</label>
                                <div className="mc-input-wrap">
                                    <FaLock className="mc-input-icon" size={12} />
                                    <input name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={form.password} onChange={onChange}
                                        style={{ paddingRight: 44 }}
                                        className="mc-input" />
                                    <button type="button" onClick={togglePassword} className="mc-eye-btn">
                                        {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                                    </button>
                                </div>
                                {passwordStrength && (
                                    <>
                                        <div className="mc-strength-bar">
                                            <div className="mc-strength-fill" style={{
                                                width: STRENGTH_CONFIG[passwordStrength].width,
                                                backgroundColor: STRENGTH_CONFIG[passwordStrength].color,
                                            }} />
                                        </div>
                                        <div className="mc-strength-label" style={{ color: STRENGTH_CONFIG[passwordStrength].color }}>
                                            {STRENGTH_CONFIG[passwordStrength].label}
                                        </div>
                                    </>
                                )}
                            </div>

                            <button type="submit" disabled={loading || passwordInvalid} className="mc-btn">
                                {loading ? <><div className="mc-spinner" /> Sending OTP</> : "Continue →"}
                            </button>
                        </form>

                        <div className="mc-divider" />
                        <p className="mc-footer-text">
                            Already a member?&nbsp;&nbsp;
                            <Link to="/login" className="mc-link">Sign In →</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mc-heading">Verify Identity</div>
                        <div className="mc-subheading">One-time passcode</div>

                        <p className="mc-otp-email-label">Code dispatched to</p>
                        <p className="mc-otp-email-val">{form.email}</p>

                        <div className="mc-otp-notice">◆ &nbsp;Check your spam / junk folder if not received</div>

                        {error && <AlertBox type="error">{error}</AlertBox>}
                        {success && <AlertBox type="success">{success}</AlertBox>}

                        <form onSubmit={verifyOtp}>
                            <div className="mc-field">
                                <label className="mc-label" style={{ textAlign: "center", display: "block" }}>Enter 6-digit code</label>
                                <input type="text" inputMode="numeric" maxLength={6}
                                    value={otp} onChange={handleOtpChange}
                                    placeholder="· · · · · ·"
                                    className="mc-otp-input" />
                            </div>
                            <button type="submit" disabled={loading} className="mc-btn">
                                {loading ? <><div className="mc-spinner" /> Verifying</> : "Confirm & Enter"}
                            </button>
                        </form>

                        <div className="mc-divider" />
                        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
                            <p className="mc-footer-text">
                                Didn't receive it?&nbsp;&nbsp;
                                <button onClick={resendOtp} disabled={resendLoading} className="mc-link">
                                    {resendLoading ? "Sending..." : "Resend Code"}
                                </button>
                            </p>
                            <button onClick={goBackToRegister} className="mc-link"
                                style={{ fontSize: 10, letterSpacing: 2, color: "rgba(200,168,75,0.35)" }}>
                                ← Change Details
                            </button>
                        </div>
                    </>
                )}

                <div className="mc-security">◆ &nbsp; Secured Connection &nbsp; ◆</div>
            </div>
        </div>
    );
};

export default Register;
