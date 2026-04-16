/**
 * Delivery Partner Apply / Register — Production v3.0
 * Full application form: personal details + vehicle + document uploads
 * Works for: logged-in users applying as delivery boy, OR new users (redirect to signup first)
 */
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { FaMotorcycle, FaUpload, FaCheckCircle, FaCamera, FaIdCard, FaCar, FaUser, FaPhone, FaCity, FaArrowLeft, FaSpinner } from "react-icons/fa";

const VEHICLE_TYPES = [
    { value: "bicycle", label: "Bicycle", emoji: "🚲" },
    { value: "scooter", label: "Scooter", emoji: "🛵" },
    { value: "motorcycle", label: "Motorcycle", emoji: "🏍️" },
    { value: "car", label: "Car", emoji: "🚗" },
    { value: "other", label: "Other", emoji: "🚚" },
];

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.rg-root{min-height:100vh;background:linear-gradient(135deg,#0f172a 0%,#134e2a 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;display:flex;align-items:flex-start;justify-content:center}
.rg-card{background:#fff;border-radius:18px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;margin:20px 0}
.rg-head{background:#0f172a;padding:28px 24px;text-align:center}
.rg-head h1{color:#22c55e;font-size:20px;font-weight:800;margin:10px 0 4px;letter-spacing:1px}
.rg-head p{color:#94a3b8;font-size:12px}
.rg-body{padding:24px}
.rg-step-bar{display:flex;gap:8px;margin-bottom:24px}
.rg-step{flex:1;height:4px;border-radius:4px;background:#e2e8f0;transition:background .3s}
.rg-step.active{background:#22c55e}
.rg-step.done{background:#059669}
.rg-label{display:block;font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;margin-top:16px}
.rg-label:first-of-type{margin-top:0}
.rg-input-wrap{position:relative}
.rg-input-wrap svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:13px;pointer-events:none}
.rg-input{width:100%;padding:11px 14px 11px 36px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;outline:none;transition:border .15s;font-family:inherit}
.rg-input:focus{border-color:#22c55e}
.rg-vehicles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px}
@media(min-width:400px){.rg-vehicles{grid-template-columns:repeat(5,1fr)}}
.rg-veh{padding:12px 4px;border-radius:10px;border:1.5px solid #e2e8f0;cursor:pointer;text-align:center;transition:all .15s;background:#fff}
.rg-veh.sel{border-color:#22c55e;background:#f0fdf4}
.rg-veh span{display:block;font-size:22px;margin-bottom:2px}
.rg-veh small{font-size:10px;font-weight:700;color:#64748b}
.rg-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px}
.rg-doc{border:2px dashed #e2e8f0;border-radius:12px;padding:16px 8px;text-align:center;cursor:pointer;transition:all .15s;background:#fafafa;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.rg-doc:hover{border-color:#22c55e;background:#f0fdf4}
.rg-doc.has{border-color:#22c55e;border-style:solid;background:#f0fdf4}
.rg-doc svg{font-size:20px;color:#94a3b8}
.rg-doc.has svg{color:#22c55e}
.rg-doc small{font-size:10px;font-weight:700;color:#64748b;display:block}
.rg-doc .fname{font-size:9px;color:#22c55e;font-weight:600;margin-top:2px;word-break:break-all;max-width:100%}
.rg-preview{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0}
.rg-btns{display:flex;gap:10px;margin-top:24px}
.rg-btn{flex:1;padding:13px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}
.rg-btn-primary{background:#0f172a;color:#22c55e;letter-spacing:1px}
.rg-btn-primary:hover{background:#1e293b}
.rg-btn-primary:disabled{opacity:.5;cursor:not-allowed}
.rg-btn-back{background:#f1f5f9;color:#475569}
.rg-btn-back:hover{background:#e2e8f0}
.rg-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:8px;font-size:12px;margin-top:12px}
.rg-success{text-align:center;padding:40px 24px}
.rg-success h2{font-size:20px;font-weight:800;color:#1e293b;margin:16px 0 8px}
.rg-success p{font-size:13px;color:#64748b;line-height:1.5}
.rg-success .rg-btn{margin-top:24px;max-width:240px;margin-left:auto;margin-right:auto}
@keyframes spin{to{transform:rotate(360deg)}}
.rg-spin{animation:spin .8s linear infinite}
.rg-login-hint{text-align:center;margin-top:16px;padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e}
.rg-login-hint a{color:#22c55e;font-weight:700;text-decoration:none}
`;

const Register = () => {
    const { rider } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: personal, 2: vehicle+docs, 3: success
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form data
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");

    // Documents
    const [docs, setDocs] = useState({ aadhaarPhoto: null, licensePhoto: null, vehicleRc: null, selfie: null });
    const [previews, setPreviews] = useState({});
    const fileRefs = {
        aadhaarPhoto: useRef(null),
        licensePhoto: useRef(null),
        vehicleRc: useRef(null),
        selfie: useRef(null),
    };

    const handleFile = (field, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("File size max 5MB"); return; }
        setDocs(d => ({ ...d, [field]: file }));
        setPreviews(p => ({ ...p, [field]: URL.createObjectURL(file) }));
        setError("");
    };

    const validateStep1 = () => {
        if (!name.trim() || name.trim().length < 2) { setError("Name minimum 2 characters"); return false; }
        if (!/^[6-9]\d{9}$/.test(phone.trim())) { setError("Valid 10-digit phone number daalein"); return false; }
        setError("");
        return true;
    };

    const validateStep2 = () => {
        if (!vehicleType) { setError("Vehicle type select karein"); return false; }
        if (!docs.aadhaarPhoto) { setError("Aadhaar photo upload karein"); return false; }
        if (!docs.selfie) { setError("Selfie upload karein"); return false; }
        setError("");
        return true;
    };

    const submit = async () => {
        if (!validateStep2()) return;
        setSubmitting(true);
        setError("");
        try {
            const fd = new FormData();
            fd.append("name", name.trim());
            fd.append("phone", phone.trim());
            fd.append("city", city.trim());
            fd.append("vehicleType", vehicleType);
            fd.append("vehicleNumber", vehicleNumber.trim());
            fd.append("vehicleModel", vehicleModel.trim());
            Object.entries(docs).forEach(([key, file]) => { if (file) fd.append(key, file); });

            await api.post("/delivery/register", fd, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 60000,
            });
            setSuccess(true);
            setStep(3);
        } catch (err) {
            const msg = err.response?.data?.message || "Registration fail ho gayi. Dobara try karein.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Not logged in — show hint to login first
    if (!rider && !localStorage.getItem("deliveryAuth")) {
        return (
            <div className="rg-root">
                <style>{CSS}</style>
                <div className="rg-card">
                    <div className="rg-head">
                        <FaMotorcycle size={36} color="#22c55e" />
                        <h1>Delivery Partner Banein</h1>
                        <p>URBEXON Delivery Team mein shamil hon</p>
                    </div>
                    <div className="rg-body">
                        <div className="rg-login-hint">
                            Apply karne ke liye pehle <Link to="/login">Login</Link> karein.<br />
                            Agar account nahi hai toh pehle main site pe register karein.
                        </div>
                        <div className="rg-btns" style={{ marginTop: 20 }}>
                            <Link to="/login" className="rg-btn rg-btn-primary" style={{ textDecoration: "none" }}>Login Karein</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success || step === 3) {
        return (
            <div className="rg-root">
                <style>{CSS}</style>
                <div className="rg-card">
                    <div className="rg-success">
                        <FaCheckCircle size={56} color="#22c55e" />
                        <h2>Application Submit Ho Gayi!</h2>
                        <p>
                            Aapki application review mein hai. Admin approval ke baad aap deliveries start kar sakte hain.
                            <br /><br />
                            Aam taur pe <strong>24-48 ghante</strong> mein approval mil jaata hai.
                        </p>
                        <button onClick={() => navigate("/dashboard")} className="rg-btn rg-btn-primary">
                            Dashboard pe Jaayein
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const DOC_FIELDS = [
        { key: "aadhaarPhoto", label: "Aadhaar Photo", icon: FaIdCard, required: true },
        { key: "licensePhoto", label: "Driving License", icon: FaIdCard, required: false },
        { key: "vehicleRc", label: "Vehicle RC", icon: FaCar, required: false },
        { key: "selfie", label: "Selfie", icon: FaCamera, required: true },
    ];

    return (
        <div className="rg-root">
            <style>{CSS}</style>
            <div className="rg-card">
                <div className="rg-head">
                    <FaMotorcycle size={36} color="#22c55e" />
                    <h1>Delivery Partner Banein</h1>
                    <p>Step {step} of 2 — {step === 1 ? "Personal Details" : "Vehicle & Documents"}</p>
                </div>
                <div className="rg-body">
                    {/* Step indicator */}
                    <div className="rg-step-bar">
                        <div className={`rg-step ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`} />
                        <div className={`rg-step ${step >= 2 ? "active" : ""}`} />
                    </div>

                    {/* ── Step 1: Personal Info ── */}
                    {step === 1 && (
                        <>
                            <label className="rg-label">Full Name *</label>
                            <div className="rg-input-wrap">
                                <FaUser />
                                <input className="rg-input" value={name} onChange={e => setName(e.target.value)} placeholder="Aapka poora naam" />
                            </div>

                            <label className="rg-label">Phone Number *</label>
                            <div className="rg-input-wrap">
                                <FaPhone />
                                <input className="rg-input" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" />
                            </div>

                            <label className="rg-label">City</label>
                            <div className="rg-input-wrap">
                                <FaCity />
                                <input className="rg-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Aapka city/area" />
                            </div>
                        </>
                    )}

                    {/* ── Step 2: Vehicle + Docs ── */}
                    {step === 2 && (
                        <>
                            <label className="rg-label">Vehicle Type *</label>
                            <div className="rg-vehicles">
                                {VEHICLE_TYPES.map(v => (
                                    <div key={v.value} className={`rg-veh ${vehicleType === v.value ? "sel" : ""}`} onClick={() => setVehicleType(v.value)}>
                                        <span>{v.emoji}</span>
                                        <small>{v.label}</small>
                                    </div>
                                ))}
                            </div>

                            <label className="rg-label">Vehicle Number</label>
                            <div className="rg-input-wrap">
                                <FaCar />
                                <input className="rg-input" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="e.g. UP32 AB 1234" />
                            </div>

                            <label className="rg-label">Vehicle Model</label>
                            <div className="rg-input-wrap">
                                <FaCar />
                                <input className="rg-input" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="e.g. Honda Activa 6G" />
                            </div>

                            <label className="rg-label" style={{ marginTop: 20 }}>Documents Upload</label>
                            <div className="rg-doc-grid">
                                {DOC_FIELDS.map(d => (
                                    <div key={d.key} className={`rg-doc ${docs[d.key] ? "has" : ""}`} onClick={() => fileRefs[d.key].current?.click()}>
                                        <input ref={fileRefs[d.key]} type="file" accept="image/*,.pdf" hidden onChange={e => handleFile(d.key, e)} />
                                        {previews[d.key] ? (
                                            <img src={previews[d.key]} alt={d.label} className="rg-preview" />
                                        ) : (
                                            <d.icon />
                                        )}
                                        <small>{d.label} {d.required ? "*" : ""}</small>
                                        {docs[d.key] && <span className="fname">{docs[d.key].name}</span>}
                                        {!docs[d.key] && <small style={{ color: "#94a3b8", fontSize: 9 }}><FaUpload size={8} /> Upload</small>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {error && <div className="rg-err">{error}</div>}

                    {/* Buttons */}
                    <div className="rg-btns">
                        {step === 2 && (
                            <button className="rg-btn rg-btn-back" onClick={() => { setStep(1); setError(""); }}>
                                <FaArrowLeft size={11} /> Back
                            </button>
                        )}
                        {step === 1 && (
                            <button className="rg-btn rg-btn-primary" onClick={() => validateStep1() && setStep(2)}>
                                Aage Badhein →
                            </button>
                        )}
                        {step === 2 && (
                            <button className="rg-btn rg-btn-primary" disabled={submitting} onClick={submit}>
                                {submitting ? <><FaSpinner className="rg-spin" size={14} /> Submitting...</> : "Apply Karein ✓"}
                            </button>
                        )}
                    </div>

                    {step === 1 && (
                        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94a3b8" }}>
                            Already registered? <Link to="/login" style={{ color: "#22c55e", fontWeight: 700, textDecoration: "none" }}>Login karein</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
