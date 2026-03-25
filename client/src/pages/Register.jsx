import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
    FaCheckCircle, FaPhone, FaMapMarkedAlt
} from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

const PHONE_REGEX = /^[6-9]\d{9}$/;

const STRENGTH_CONFIG = {
    weak: { color: "#ef4444", label: "Too short", width: "33%" },
    medium: { color: "#f59e0b", label: "Medium", width: "66%" },
    strong: { color: "#10b981", label: "Strong", width: "100%" },
};

const GLOBAL_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');

    .mc-root {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
        background: #0a0a0f;
        position: relative;
        overflow: hidden;
        font-family: 'Montserrat', sans-serif;
    }
    .mc-root::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,140,60,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 100%, rgba(120,80,20,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(100,60,10,0.08) 0%, transparent 60%);
        pointer-events: none;
    }
    .mc-root::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(180,140,60,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,140,60,0.04) 1px, transparent 1px);
        background-size: 60px 60px;
        pointer-events: none;
    }
    .mc-card {
        position: relative;
        width: 100%;
        max-width: 440px;
        background: linear-gradient(160deg, #16151e 0%, #0f0e17 50%, #13121a 100%);
        border: 1px solid rgba(180,140,60,0.25);
        border-radius: 4px;
        padding: 48px 44px;
        box-shadow:
            0 0 0 1px rgba(180,140,60,0.08),
            0 40px 80px rgba(0,0,0,0.8),
            0 0 120px rgba(180,140,60,0.05);
        animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
        box-sizing: border-box;
    }
    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .mc-card::before, .mc-card::after {
        content: '';
        position: absolute;
        width: 28px;
        height: 28px;
        border-color: rgba(180,140,60,0.6);
        border-style: solid;
    }
    .mc-card::before { top: 12px; left: 12px; border-width: 1px 0 0 1px; }
    .mc-card::after  { bottom: 12px; right: 12px; border-width: 0 1px 1px 0; }
    .mc-card-inner { position: relative; }
    .mc-card-inner::before, .mc-card-inner::after {
        content: '';
        position: absolute;
        width: 28px;
        height: 28px;
        border-color: rgba(180,140,60,0.6);
        border-style: solid;
    }
    .mc-card-inner::before { top: -36px; right: -32px; border-width: 1px 1px 0 0; }
    .mc-card-inner::after  { bottom: -36px; left: -32px; border-width: 0 0 1px 1px; }

    .mc-divider {
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(180,140,60,0.5), transparent);
        margin: 28px 0;
    }
    .mc-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 32px;
    }
    .mc-logo-icon {
        width: 52px; height: 52px;
        border: 1px solid rgba(180,140,60,0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(180,140,60,0.15), rgba(120,80,20,0.1));
        margin-bottom: 16px;
        position: relative;
    }
    .mc-logo-icon::before {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        border: 1px solid rgba(180,140,60,0.2);
    }
    .mc-brand {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 600;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: #c8a84b;
        line-height: 1;
    }
    .mc-brand-sub {
        font-size: 9px;
        letter-spacing: 4px;
        color: rgba(180,140,60,0.45);
        text-transform: uppercase;
        font-weight: 500;
        margin-top: 5px;
    }
    .mc-heading {
        font-family: 'Cormorant Garamond', serif;
        font-size: 22px;
        font-weight: 500;
        color: #e8d5a3;
        text-align: center;
        letter-spacing: 2px;
        margin-bottom: 4px;
    }
    .mc-subheading {
        font-size: 9px;
        color: rgba(200,168,75,0.45);
        text-align: center;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 28px;
    }
    .mc-field { margin-bottom: 20px; }
    .mc-label {
        display: block;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: rgba(200,168,75,0.55);
        margin-bottom: 8px;
    }
    .mc-input-wrap { position: relative; }
    .mc-input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(180,140,60,0.35);
        pointer-events: none;
        transition: color 0.2s;
    }
    .mc-input-wrap:focus-within .mc-input-icon { color: rgba(180,140,60,0.8); }
    .mc-input {
        width: 100%;
        padding: 13px 14px 13px 42px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(180,140,60,0.18);
        border-radius: 2px;
        color: #e8d5a3;
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0.5px;
        outline: none;
        transition: all 0.25s;
        box-sizing: border-box;
    }
    .mc-input::placeholder { color: rgba(200,168,75,0.18); font-size: 12px; }
    .mc-input:focus {
        border-color: rgba(180,140,60,0.55);
        background: rgba(180,140,60,0.04);
        box-shadow: 0 0 0 1px rgba(180,140,60,0.12), inset 0 1px 3px rgba(0,0,0,0.3);
    }
    .mc-phone-prefix {
        position: absolute;
        left: 42px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        font-weight: 600;
        color: rgba(200,168,75,0.45);
        pointer-events: none;
    }
    .mc-input-phone { padding-left: 72px !important; }
    .mc-eye-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(180,140,60,0.3);
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
    }
    .mc-eye-btn:hover { color: rgba(180,140,60,0.8); }
    .mc-strength-bar {
        height: 2px;
        background: rgba(255,255,255,0.06);
        border-radius: 1px;
        margin-top: 8px;
        overflow: hidden;
    }
    .mc-strength-fill {
        height: 100%;
        border-radius: 1px;
        transition: width 0.4s ease, background-color 0.4s ease;
    }
    .mc-strength-label {
        font-size: 9px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-top: 5px;
        font-weight: 600;
    }
    .mc-hint { font-size: 10px; letter-spacing: 1px; margin-top: 5px; font-weight: 500; }
    .mc-hint-warn    { color: rgba(245,158,11,0.7); }
    .mc-hint-error   { color: rgba(239,68,68,0.75); }
    .mc-hint-success { color: rgba(16,185,129,0.75); }
    .mc-alert {
        padding: 12px 16px;
        border-radius: 2px;
        font-size: 12px;
        letter-spacing: 0.3px;
        margin-bottom: 20px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        animation: shake 0.35s ease;
    }
    .mc-alert-error   { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: rgba(252,165,165,0.9); }
    .mc-alert-success { background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2); color: rgba(110,231,183,0.9); }
    @keyframes shake {
        0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)}
    }
    .mc-otp-notice {
        background: rgba(180,140,60,0.05);
        border: 1px solid rgba(180,140,60,0.15);
        border-radius: 2px;
        padding: 10px 14px;
        font-size: 11px;
        color: rgba(200,168,75,0.55);
        text-align: center;
        margin-bottom: 24px;
        letter-spacing: 0.3px;
    }
    .mc-otp-input {
        width: 100%;
        padding: 18px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(180,140,60,0.18);
        border-radius: 2px;
        color: #c8a84b;
        font-family: 'Cormorant Garamond', serif;
        font-size: 34px;
        font-weight: 600;
        text-align: center;
        letter-spacing: 14px;
        outline: none;
        transition: all 0.25s;
        box-sizing: border-box;
    }
    .mc-otp-input::placeholder { color: rgba(180,140,60,0.13); letter-spacing: 10px; }
    .mc-otp-input:focus {
        border-color: rgba(180,140,60,0.5);
        background: rgba(180,140,60,0.04);
        box-shadow: 0 0 0 1px rgba(180,140,60,0.12);
    }
    .mc-btn {
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #b8943c 0%, #e8d080 50%, #b8943c 100%);
        background-size: 200% 100%;
        border: none;
        border-radius: 2px;
        color: #0a0a0f;
        font-family: 'Montserrat', sans-serif;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.35s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 8px;
        position: relative;
        overflow: hidden;
    }
    .mc-btn::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        transition: left 0.55s;
    }
    .mc-btn:hover:not(:disabled)::before { left: 100%; }
    .mc-btn:hover:not(:disabled) { background-position: 100% 0; box-shadow: 0 8px 32px rgba(180,140,60,0.3); }
    .mc-btn:active:not(:disabled) { transform: scale(0.99); }
    .mc-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .mc-spinner {
        width: 14px; height: 14px;
        border: 2px solid rgba(0,0,0,0.2);
        border-top-color: #0a0a0f;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mc-footer-text { font-size: 11px; color: rgba(200,168,75,0.35); text-align: center; letter-spacing: 0.5px; }
    .mc-link {
        color: rgba(200,168,75,0.7);
        font-weight: 600;
        text-decoration: none;
        letter-spacing: 1px;
        transition: color 0.2s;
        cursor: pointer;
        background: none;
        border: none;
        font-family: 'Montserrat', sans-serif;
        font-size: inherit;
    }
    .mc-link:hover { color: #c8a84b; }
    .mc-link:disabled { opacity: 0.4; cursor: not-allowed; }
    .mc-security {
        text-align: center;
        font-size: 9px;
        letter-spacing: 3px;
        color: rgba(180,140,60,0.22);
        text-transform: uppercase;
        margin-top: 20px;
    }
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
            await api.post("/auth/register", { name: name.trim(), email: email.trim(), phone: phone.trim(), password });
            setStep("otp");
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed");
        } finally { setLoading(false); }
    }, [form]);

    const verifyOtp = useCallback(async (e) => {
        e.preventDefault();
        if (!otp.trim() || otp.length !== 6) return setError("Enter valid 6-digit OTP");
        try {
            setLoading(true); setError("");
            const { data } = await api.post("/auth/verify-otp", { email: form.email.trim(), otp: otp.trim() });
            loginWithData(data);
            navigate("/", { replace: true });
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
                <div className="mc-card-inner">

                    {/* Brand */}
                    <div className="mc-logo">
                        <div className="mc-logo-icon">
                            <FaMapMarkedAlt size={20} style={{ color: "#c8a84b" }} />
                        </div>
                        <div className="mc-brand">Urbexon</div>
                        <div className="mc-brand-sub">Explore the unknown</div>
                    </div>

                    <div className="mc-divider" />

                    {step === "register" ? (
                        <>
                            <div className="mc-heading">Create Account</div>
                            <div className="mc-subheading">Begin your journey</div>

                            {error && <AlertBox type="error">{error}</AlertBox>}

                            <form onSubmit={submitHandler}>
                                {/* Name */}
                                <div className="mc-field">
                                    <label className="mc-label">Full Name</label>
                                    <div className="mc-input-wrap">
                                        <FaUser className="mc-input-icon" size={11} />
                                        <input name="name" type="text" placeholder="e.g. Rahul Verma"
                                            value={form.name} onChange={onChange} className="mc-input" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="mc-field">
                                    <label className="mc-label">Email Address</label>
                                    <div className="mc-input-wrap">
                                        <FaEnvelope className="mc-input-icon" size={11} />
                                        <input name="email" type="email" placeholder="your@email.com"
                                            value={form.email} onChange={onChange} className="mc-input" />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="mc-field">
                                    <label className="mc-label">Mobile Number</label>
                                    <div className="mc-input-wrap">
                                        <FaPhone className="mc-input-icon" size={11} />
                                        <span className="mc-phone-prefix">+91</span>
                                        <input name="phone" type="tel" inputMode="numeric"
                                            maxLength={10} placeholder="9876543210"
                                            value={form.phone} onChange={onChange}
                                            className="mc-input mc-input-phone" />
                                    </div>
                                    {phoneHint}
                                </div>

                                {/* Password */}
                                <div className="mc-field">
                                    <label className="mc-label">Password</label>
                                    <div className="mc-input-wrap">
                                        <FaLock className="mc-input-icon" size={11} />
                                        <input name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 characters"
                                            value={form.password} onChange={onChange}
                                            style={{ paddingRight: 44 }}
                                            className="mc-input" />
                                        <button type="button" onClick={togglePassword} className="mc-eye-btn">
                                            {showPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
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
                                    {passwordInvalid && (
                                        <p className="mc-hint mc-hint-error">
                                            {8 - form.password.length} more character{8 - form.password.length > 1 ? "s" : ""} needed
                                        </p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading || passwordInvalid} className="mc-btn">
                                    {loading
                                        ? <><div className="mc-spinner" /> Sending OTP</>
                                        : "Enter the Club"}
                                </button>
                            </form>

                            <div className="mc-divider" />

                            <p className="mc-footer-text">
                                Already a member?&nbsp;&nbsp;
                                <Link to="/login" className="mc-link">Sign In →</Link>
                            </p>
                        </>
                    ) : (
                        /* ── OTP Step ── */
                        <>
                            <div className="mc-heading">Verify Identity</div>
                            <div className="mc-subheading">One-time passcode</div>

                            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(200,168,75,0.45)", marginBottom: 6 }}>
                                Code dispatched to
                            </p>
                            <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#c8a84b", marginBottom: 20, letterSpacing: 1 }}>
                                {form.email}
                            </p>

                            <div className="mc-otp-notice">
                                ◆ &nbsp;Check your spam / junk folder if not received
                            </div>

                            {error && <AlertBox type="error">{error}</AlertBox>}
                            {success && <AlertBox type="success">{success}</AlertBox>}

                            <form onSubmit={verifyOtp}>
                                <div className="mc-field">
                                    <label className="mc-label" style={{ textAlign: "center", display: "block" }}>
                                        Enter 6-digit code
                                    </label>
                                    <input type="text" inputMode="numeric" maxLength={6}
                                        value={otp} onChange={handleOtpChange}
                                        placeholder="· · · · · ·"
                                        className="mc-otp-input" />
                                </div>
                                <button type="submit" disabled={loading} className="mc-btn">
                                    {loading
                                        ? <><div className="mc-spinner" /> Verifying</>
                                        : "Confirm & Enter"}
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
                                    style={{ fontSize: 10, letterSpacing: 2, color: "rgba(180,140,60,0.28)" }}>
                                    ← Change Email
                                </button>
                            </div>
                        </>
                    )}

                    <div className="mc-security">◆ &nbsp; Secured Connection &nbsp; ◆</div>
                </div>
            </div>
        </div>
    );
};

export default Register;