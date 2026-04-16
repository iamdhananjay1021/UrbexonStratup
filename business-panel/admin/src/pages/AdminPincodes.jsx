/**
 * AdminPincodes.jsx
 * Path: src/pages/AdminPincodes.jsx
 */

import { useEffect, useState, useCallback } from "react";
import { usePincodes } from "../hooks/usePincodes";
import {
    FiMapPin, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX,
    FiCheckCircle, FiAlertCircle, FiLoader, FiUsers, FiRefreshCw,
} from "react-icons/fi";

const T = {
    bg: "#f8fafc", white: "#ffffff", surfaceAlt: "#f1f5f9",
    border: "#e2e8f0", borderLight: "#f1f5f9",
    blue: "#2563eb", blueBg: "#eff6ff", blueMid: "#dbeafe",
    text: "#1e293b", sub: "#334155", muted: "#475569", hint: "#94a3b8",
    green: "#10b981", amber: "#f59e0b", red: "#ef4444", violet: "#8b5cf6",
};

const STATUS_CONFIG = {
    active: { label: "Active", color: T.green, bg: "#f0fdf4" },
    coming_soon: { label: "Coming Soon", color: T.amber, bg: "#fef3c7" },
    blocked: { label: "Blocked", color: T.red, bg: "#fef2f2" },
};

const useToast = () => {
    const [toast, setToast] = useState(null);
    const show = useCallback((type, msg, duration = 4000) => {
        setToast({ type, msg, id: Date.now() });
        setTimeout(() => setToast(null), duration);
    }, []);
    return { toast, show };
};

const Toast = ({ toast }) => {
    if (!toast) return null;
    const isErr = toast.type === "error";
    return (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: isErr ? "#fef2f2" : "#f0fdf4", border: `1px solid ${isErr ? "#fecaca" : "#bbf7d0"}`, color: isErr ? T.red : T.green, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 8, maxWidth: 340, animation: "ap-fadeUp .2s ease" }}>
            {isErr ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
            {toast.msg}
        </div>
    );
};

const EMPTY_FORM = { code: "", status: "coming_soon", area: "", city: "", district: "", state: "", expectedLaunchDate: "", note: "", priority: 0 };

/* ── Pincode Form Modal ── */
const PincodeModal = ({ initial, onSave, onClose, loading }) => {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isEdit = !!initial?._id;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: T.white, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>{isEdit ? "Edit Pincode" : "Add Pincode"}</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                        { key: "code", label: "Pincode *", placeholder: "e.g. 226010", type: "text" },
                        { key: "area", label: "Area", placeholder: "Gomti Nagar", type: "text" },
                        { key: "city", label: "City", placeholder: "Lucknow", type: "text" },
                        { key: "district", label: "District", placeholder: "Lucknow", type: "text" },
                        { key: "state", label: "State", placeholder: "UP", type: "text" },
                        { key: "priority", label: "Priority", placeholder: "0", type: "number" },
                    ].map(({ key, label, placeholder, type }) => (
                        <div key={key}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>{label}</label>
                            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                                style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>Status</label>
                    <select value={form.status} onChange={e => set("status", e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.white, outline: "none", fontFamily: "inherit" }}>
                        <option value="coming_soon">Coming Soon</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>

                {form.status === "coming_soon" && (
                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>Expected Launch Date</label>
                        <input type="date" value={form.expectedLaunchDate?.split("T")[0] || ""} onChange={e => set("expectedLaunchDate", e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                )}

                <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 5 }}>Note (internal)</label>
                    <input type="text" value={form.note} onChange={e => set("note", e.target.value)} placeholder="Internal notes..."
                        style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button onClick={() => form.code.trim() && onSave(form)} disabled={loading || !form.code.trim()}
                        style={{ flex: 1, padding: "10px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: !form.code.trim() ? 0.5 : 1 }}>
                        {loading ? <FiLoader size={13} style={{ animation: "ap-spin 0.8s linear infinite" }} /> : <FiCheckCircle size={13} />}
                        {isEdit ? "Update" : "Create"}
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.muted, cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const AdminPincodes = () => {
    const { pincodes, loading, actionLoading, error, fetchPincodes, createPincode, updatePincode, deletePincode } = usePincodes();
    const { toast, show: showToast } = useToast();

    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null); // null | { type: "add" | "edit", pincode? }

    useEffect(() => { fetchPincodes(); }, []);

    const handleFilter = useCallback((status) => {
        setFilterStatus(status);
        const params = {};
        if (status !== "ALL") params.status = status;
        if (search.trim()) params.search = search.trim();
        fetchPincodes(params);
    }, [fetchPincodes, search]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        const params = {};
        if (filterStatus !== "ALL") params.status = filterStatus;
        if (search.trim()) params.search = search.trim();
        fetchPincodes(params);
    }, [fetchPincodes, filterStatus, search]);

    const handleSave = useCallback(async (form) => {
        const isEdit = !!modal?.pincode?._id;
        const res = isEdit
            ? await updatePincode(modal.pincode._id, form)
            : await createPincode(form);
        if (res.success) {
            showToast("success", isEdit ? "Pincode updated!" : "Pincode created!");
            setModal(null);
        } else {
            showToast("error", res.message);
        }
    }, [modal, createPincode, updatePincode, showToast]);

    const handleDelete = useCallback(async (p) => {
        if (!window.confirm(`Delete pincode ${p.code}?`)) return;
        const res = await deletePincode(p._id);
        if (res.success) showToast("success", "Pincode deleted.");
        else showToast("error", res.message);
    }, [deletePincode, showToast]);

    const filters = [
        { key: "ALL", label: "All" },
        { key: "active", label: "Active", dot: T.green },
        { key: "coming_soon", label: "Coming Soon", dot: T.amber },
        { key: "blocked", label: "Blocked", dot: T.red },
    ];

    if (loading && pincodes.length === 0) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${T.blueMid}`, borderTopColor: T.blue, borderRadius: "50%", animation: "ap-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: T.hint, fontSize: 13 }}>Loading pincodes...</p>
            </div>
            <style>{`@keyframes ap-spin{to{transform:rotate(360deg)}} @keyframes ap-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: T.text }}>
            <style>{`
                @keyframes ap-spin{to{transform:rotate(360deg)}}
                @keyframes ap-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .ap-row{animation:ap-fadeUp .3s ease forwards;}
                .ap-card{transition:border-color .18s,box-shadow .18s;}
                .ap-card:hover{border-color:#bfdbfe !important;box-shadow:0 2px 12px rgba(37,99,235,0.07) !important;}
                button:disabled{cursor:not-allowed;}
                .pin-desktop{display:block}
                .pin-mobile{display:none}
                @media(max-width:640px){
                    .pin-desktop{display:none !important}
                    .pin-mobile{display:block !important}
                }
            `}</style>

            <Toast toast={toast} />
            {modal && <PincodeModal initial={modal.pincode} onSave={handleSave} onClose={() => setModal(null)} loading={actionLoading === "create" || actionLoading === modal?.pincode?._id} />}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Pincodes</h1>
                    <p style={{ fontSize: 13, color: T.hint, marginTop: 3 }}>{pincodes.length} pincodes configured</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <form onSubmit={handleSearch} style={{ display: "flex" }}>
                        <div style={{ position: "relative" }}>
                            <FiSearch size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.hint, pointerEvents: "none" }} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pincode, city..."
                                style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: T.white, border: `1px solid ${T.border}`, borderRight: "none", borderRadius: "8px 0 0 8px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: 180 }} />
                        </div>
                        <button type="submit" style={{ padding: "8px 12px", background: T.blue, border: "none", borderRadius: "0 8px 8px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Go</button>
                    </form>
                    <button onClick={() => setModal({ type: "add" })}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        <FiPlus size={14} /> Add Pincode
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
                {filters.map(({ key, label, dot }) => {
                    const active = filterStatus === key;
                    return (
                        <button key={key} onClick={() => handleFilter(key)}
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, border: active ? `1px solid ${T.blue}` : `1px solid ${T.border}`, background: active ? T.blueBg : T.white, color: active ? T.blue : T.muted, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "all .15s" }}>
                            {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}{label}
                        </button>
                    );
                })}
            </div>

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: T.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

            {/* Desktop Table */}
            <div className="pin-desktop" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflowX: "auto" }}>
                {/* Table Head */}
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 120px 100px 80px", gap: 12, padding: "10px 20px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, minWidth: 640 }}>
                    {["Pincode", "Area / City", "Status", "Vendors", "Priority", "Actions"].map(h => (
                        <p key={h} style={{ fontSize: 10, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{h}</p>
                    ))}
                </div>

                {pincodes.length === 0 && !loading ? (
                    <div style={{ padding: "52px 0", textAlign: "center" }}>
                        <FiMapPin size={28} style={{ color: T.hint, marginBottom: 10 }} />
                        <p style={{ color: T.hint, fontSize: 14 }}>No pincodes found</p>
                    </div>
                ) : pincodes.map((p, idx) => {
                    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.coming_soon;
                    const isActing = actionLoading === p._id;
                    return (
                        <div key={p._id} className="ap-card ap-row"
                            style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 120px 100px 80px", gap: 12, padding: "14px 20px", borderBottom: idx < pincodes.length - 1 ? `1px solid ${T.borderLight}` : "none", alignItems: "center", animationDelay: `${idx * 20}ms`, minWidth: 640 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'Courier New',monospace" }}>{p.code}</p>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{p.area || "—"}</p>
                                <p style={{ fontSize: 11, color: T.hint }}>{[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                            </div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: 99 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />{cfg.label}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <FiUsers size={12} color={T.hint} />
                                <span style={{ fontSize: 13, color: T.sub }}>{p.assignedVendors?.length || 0}</span>
                            </div>
                            <p style={{ fontSize: 13, color: T.muted }}>{p.priority || 0}</p>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setModal({ type: "edit", pincode: p })} title="Edit"
                                    style={{ width: 30, height: 30, background: T.blueBg, border: `1px solid ${T.blueMid}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                    <FiEdit2 size={12} color={T.blue} />
                                </button>
                                <button onClick={() => handleDelete(p)} disabled={isActing} title="Delete"
                                    style={{ width: 30, height: 30, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                    {isActing ? <FiLoader size={11} color={T.red} style={{ animation: "ap-spin 0.8s linear infinite" }} /> : <FiTrash2 size={12} color={T.red} />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Cards */}
            <div className="pin-mobile" style={{ display: "none", flexDirection: "column", gap: 10 }}>
                {pincodes.length === 0 && !loading ? (
                    <div style={{ padding: "52px 0", textAlign: "center", background: T.white, borderRadius: 12, border: `1px solid ${T.border}` }}>
                        <FiMapPin size={28} style={{ color: T.hint, marginBottom: 10 }} />
                        <p style={{ color: T.hint, fontSize: 14 }}>No pincodes found</p>
                    </div>
                ) : pincodes.map((p, idx) => {
                    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.coming_soon;
                    const isActing = actionLoading === p._id;
                    return (
                        <div key={p._id} className="ap-card ap-row" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, animationDelay: `${idx * 20}ms` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Courier New',monospace" }}>{p.code}</p>
                                    <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{p.area || "—"}, {[p.city, p.state].filter(Boolean).join(", ") || "—"}</p>
                                </div>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 8px", borderRadius: 99, flexShrink: 0 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />{cfg.label}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.hint }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiUsers size={11} /> {p.assignedVendors?.length || 0} vendors</span>
                                    <span>Priority: {p.priority || 0}</span>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => setModal({ type: "edit", pincode: p })} title="Edit"
                                        style={{ width: 30, height: 30, background: T.blueBg, border: `1px solid ${T.blueMid}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <FiEdit2 size={12} color={T.blue} />
                                    </button>
                                    <button onClick={() => handleDelete(p)} disabled={isActing} title="Delete"
                                        style={{ width: 30, height: 30, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        {isActing ? <FiLoader size={11} color={T.red} style={{ animation: "ap-spin 0.8s linear infinite" }} /> : <FiTrash2 size={12} color={T.red} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminPincodes;