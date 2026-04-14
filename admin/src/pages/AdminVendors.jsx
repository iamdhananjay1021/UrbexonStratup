/**
 * AdminVendors.jsx
 * Path: src/pages/AdminVendors.jsx
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVendors } from "../hooks/useVendors";
import {
    FiSearch, FiX, FiRefreshCw, FiCheckCircle, FiXCircle,
    FiAlertCircle, FiChevronDown, FiLoader, FiShoppingBag,
    FiUser, FiPhone, FiMail, FiMapPin, FiEye, FiTrash2,
    FiPauseCircle, FiPercent,
} from "react-icons/fi";

/* ── Design tokens (matches AdminOrders) ── */
const T = {
    bg: "#f8fafc", white: "#ffffff", surfaceAlt: "#f1f5f9",
    border: "#e2e8f0", borderLight: "#f1f5f9",
    blue: "#2563eb", blueBg: "#eff6ff", blueMid: "#dbeafe",
    text: "#1e293b", sub: "#334155", muted: "#475569", hint: "#94a3b8",
    green: "#10b981", amber: "#f59e0b", red: "#ef4444",
    violet: "#8b5cf6", orange: "#f97316",
};

const STATUS_CONFIG = {
    pending: { label: "Pending", color: T.amber, bg: "#fef3c7" },
    under_review: { label: "Under Review", color: T.blue, bg: T.blueBg },
    approved: { label: "Approved", color: T.green, bg: "#f0fdf4" },
    rejected: { label: "Rejected", color: T.red, bg: "#fef2f2" },
    suspended: { label: "Suspended", color: T.violet, bg: "#f5f3ff" },
};

const PAGE_LIMIT = 20;

/* ── Toast hook ── */
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
        <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 9999,
            background: isErr ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${isErr ? "#fecaca" : "#bbf7d0"}`,
            color: isErr ? T.red : T.green,
            padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            display: "flex", alignItems: "center", gap: 8,
            maxWidth: 340, animation: "av-fadeUp .2s ease",
        }}>
            {isErr ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
            {toast.msg}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`, padding: "3px 10px", borderRadius: 99 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />{cfg.label}
        </span>
    );
};

/* ── Approve Modal ── */
const ApproveModal = ({ vendor, onConfirm, onClose, loading }) => {
    const [commission, setCommission] = useState(18);
    const [plan, setPlan] = useState("starter");
    const [note, setNote] = useState("");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: T.white, borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Approve Vendor</h3>
                <p style={{ fontSize: 13, color: T.hint, marginBottom: 20 }}>{vendor.shopName}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Plan</label>
                        <select value={plan} onChange={e => setPlan(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, background: T.white, outline: "none", fontFamily: "inherit" }}>
                            <option value="starter">Starter</option>
                            <option value="growth">Growth</option>
                            <option value="pro">Pro</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Commission Rate (%)</label>
                        <input type="number" value={commission} onChange={e => setCommission(Number(e.target.value))} min={0} max={50}
                            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Admin Note (optional)</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note..."
                            style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button onClick={() => onConfirm({ commissionRate: commission, plan, note })} disabled={loading}
                        style={{ flex: 1, padding: "10px", background: T.green, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {loading ? <FiLoader size={13} style={{ animation: "av-spin 0.8s linear infinite" }} /> : <FiCheckCircle size={13} />}
                        Approve
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.muted, cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

/* ── Reject Modal ── */
const RejectModal = ({ vendor, onConfirm, onClose, loading }) => {
    const [reason, setReason] = useState("");
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: T.white, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Reject Vendor</h3>
                <p style={{ fontSize: 13, color: T.hint, marginBottom: 20 }}>{vendor.shopName}</p>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Reason <span style={{ color: T.red }}>*</span></label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..." rows={3}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button onClick={() => reason.trim() && onConfirm({ reason })} disabled={loading || !reason.trim()}
                        style={{ flex: 1, padding: "10px", background: T.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !reason.trim() ? 0.5 : 1 }}>
                        {loading ? "..." : "Reject"}
                    </button>
                    <button onClick={onClose} style={{ padding: "10px 18px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.muted, cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

/* ── Commission Modal ── */
const CommissionModal = ({ vendor, onConfirm, onClose, loading }) => {
    const [rate, setRate] = useState(vendor.commissionRate || 18);
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: T.white, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>Update Commission</h3>
                <p style={{ fontSize: 13, color: T.hint, marginBottom: 20 }}>{vendor.shopName}</p>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Commission Rate (0–50%)</label>
                <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} min={0} max={50}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button onClick={() => onConfirm(rate)} disabled={loading}
                        style={{ flex: 1, padding: "10px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        {loading ? "..." : "Update"}
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
const AdminVendors = () => {
    const navigate = useNavigate();
    const {
        vendors, loading, actionLoading, error,
        total, totalPages, currentPage,
        fetchVendors, approveVendor, rejectVendor,
        suspendVendor, updateCommission, deleteVendor,
    } = useVendors();

    const { toast, show: showToast } = useToast();

    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [modal, setModal] = useState(null); // { type, vendor }

    useEffect(() => {
        fetchVendors({ page: 1 });
    }, []);

    const handleFilter = useCallback((status) => {
        setFilterStatus(status);
        setExpandedId(null);
        fetchVendors({ page: 1, status, search: searchQuery });
    }, [fetchVendors, searchQuery]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setFilterStatus("ALL");
        fetchVendors({ page: 1, search: searchInput });
    }, [fetchVendors, searchInput]);

    const clearSearch = useCallback(() => {
        setSearchInput(""); setSearchQuery("");
        fetchVendors({ page: 1, status: filterStatus });
    }, [fetchVendors, filterStatus]);

    const goToPage = useCallback((page) => {
        setExpandedId(null);
        window.scrollTo(0, 0);
        fetchVendors({ page, status: filterStatus, search: searchQuery });
    }, [fetchVendors, filterStatus, searchQuery]);

    const handleApprove = useCallback(async (payload) => {
        if (!modal?.vendor?._id) return;
        const res = await approveVendor(modal.vendor._id, payload);
        if (res.success) { showToast("success", "Vendor approved!"); setModal(null); }
        else showToast("error", res.message);
    }, [approveVendor, modal, showToast]);

    const handleReject = useCallback(async (payload) => {
        if (!modal?.vendor?._id) return;
        const res = await rejectVendor(modal.vendor._id, payload);
        if (res.success) { showToast("success", "Vendor rejected."); setModal(null); }
        else showToast("error", res.message);
    }, [rejectVendor, modal, showToast]);

    const handleSuspend = useCallback(async (vendor) => {
        const res = await suspendVendor(vendor._id, { reason: "Suspended by admin" });
        if (res.success) showToast("success", "Vendor suspended.");
        else showToast("error", res.message);
    }, [suspendVendor, showToast]);

    const handleCommission = useCallback(async (rate) => {
        if (!modal?.vendor?._id) return;
        const res = await updateCommission(modal.vendor._id, rate);
        if (res.success) { showToast("success", "Commission updated!"); setModal(null); }
        else showToast("error", res.message);
    }, [updateCommission, modal, showToast]);

    const handleDelete = useCallback(async (vendor) => {
        if (!window.confirm(`Delete vendor "${vendor.shopName}"? This cannot be undone.`)) return;
        const res = await deleteVendor(vendor._id);
        if (res.success) showToast("success", "Vendor deleted.");
        else showToast("error", res.message);
    }, [deleteVendor, showToast]);

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
        if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
    };

    const filters = [
        { key: "ALL", label: "All" },
        { key: "pending", label: "Pending", dot: T.amber },
        { key: "under_review", label: "Under Review", dot: T.blue },
        { key: "approved", label: "Approved", dot: T.green },
        { key: "rejected", label: "Rejected", dot: T.red },
        { key: "suspended", label: "Suspended", dot: T.violet },
    ];

    if (loading && vendors.length === 0) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${T.blueMid}`, borderTopColor: T.blue, borderRadius: "50%", animation: "av-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: T.hint, fontSize: 13 }}>Loading vendors...</p>
            </div>
            <style>{`@keyframes av-spin{to{transform:rotate(360deg)}} @keyframes av-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: T.text }}>
            <style>{`
                @keyframes av-spin{to{transform:rotate(360deg)}}
                @keyframes av-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .av-card{transition:border-color .18s,box-shadow .18s;}
                .av-card:hover{border-color:#bfdbfe !important;box-shadow:0 2px 12px rgba(37,99,235,0.07) !important;}
                .av-hdr{cursor:pointer;transition:background .12s;}
                .av-hdr:hover{background:#f8fafc !important;}
                .av-row{animation:av-fadeUp .3s ease forwards;}
                .av-btn:hover{opacity:.85;}
                button:disabled{cursor:not-allowed;}
            `}</style>

            <Toast toast={toast} />

            {/* Modals */}
            {modal?.type === "approve" && <ApproveModal vendor={modal.vendor} onConfirm={handleApprove} onClose={() => setModal(null)} loading={actionLoading === modal.vendor._id} />}
            {modal?.type === "reject" && <RejectModal vendor={modal.vendor} onConfirm={handleReject} onClose={() => setModal(null)} loading={actionLoading === modal.vendor._id} />}
            {modal?.type === "commission" && <CommissionModal vendor={modal.vendor} onConfirm={handleCommission} onClose={() => setModal(null)} loading={actionLoading === modal.vendor._id} />}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Vendors</h1>
                    <p style={{ fontSize: 13, color: T.hint, marginTop: 3 }}>{total} total vendors</p>
                </div>
                <form onSubmit={handleSearch} style={{ display: "flex" }}>
                    <div style={{ position: "relative" }}>
                        <FiSearch size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.hint, pointerEvents: "none" }} />
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search shop, owner, phone..."
                            style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: T.white, border: `1px solid ${T.border}`, borderRight: "none", borderRadius: "8px 0 0 8px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220 }} />
                        {searchQuery && <button type="button" onClick={clearSearch} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.hint, cursor: "pointer" }}><FiX size={12} /></button>}
                    </div>
                    <button type="submit" style={{ padding: "8px 14px", background: T.blue, border: "none", borderRadius: "0 8px 8px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
                </form>
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

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: T.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiAlertCircle size={13} />{error}
                </div>
            )}

            {/* Vendor Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {vendors.length === 0 && !loading ? (
                    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "52px 0", textAlign: "center" }}>
                        <FiShoppingBag size={32} style={{ color: T.hint, marginBottom: 10 }} />
                        <p style={{ color: T.hint, fontSize: 14, fontWeight: 600 }}>No vendors found</p>
                    </div>
                ) : vendors.map((vendor, idx) => {
                    const isExpanded = expandedId === vendor._id;
                    const isActing = actionLoading === vendor._id;
                    const cfg = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.pending;

                    return (
                        <div key={vendor._id} className="av-card av-row"
                            style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", animationDelay: `${idx * 30}ms` }}>

                            {/* Row Header */}
                            <div className="av-hdr" onClick={() => setExpandedId(isExpanded ? null : vendor._id)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 3, height: 38, background: cfg.color, borderRadius: 3, flexShrink: 0 }} />
                                    {vendor.shopLogo ? (
                                        <img src={vendor.shopLogo} alt={vendor.shopName} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 40, height: 40, background: cfg.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <FiShoppingBag size={16} color={cfg.color} />
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>{vendor.shopName}</p>
                                        <p style={{ fontSize: 12, color: T.hint, marginTop: 1 }}>{vendor.ownerName} · {vendor.phone}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <StatusBadge status={vendor.status} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{vendor.commissionRate}% comm.</span>
                                    <div style={{ color: T.hint, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                                        <FiChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Panel */}
                            {isExpanded && (
                                <div style={{ borderTop: `1px solid ${T.borderLight}`, padding: 20, background: T.bg }}>

                                    {/* Info Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 8, marginBottom: 20 }}>
                                        {[
                                            { icon: FiUser, label: "Owner", value: vendor.ownerName },
                                            { icon: FiPhone, label: "Phone", value: vendor.phone },
                                            { icon: FiMail, label: "Email", value: vendor.email },
                                            { icon: FiMapPin, label: "City", value: vendor.address?.city || "—" },
                                            { icon: FiPercent, label: "Commission", value: `${vendor.commissionRate}%` },
                                            { icon: FiShoppingBag, label: "Category", value: vendor.shopCategory || "—" },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                                <Icon size={13} color={T.hint} style={{ marginTop: 2 }} />
                                                <div>
                                                    <div style={{ fontSize: 9, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                                                    <div style={{ fontSize: 13, color: T.sub, fontWeight: 500, marginTop: 1 }}>{value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subscription Info */}
                                    {vendor.subscription && (
                                        <div style={{ background: T.blueBg, border: `1px solid ${T.blueMid}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
                                            <div>
                                                <p style={{ fontSize: 9, color: T.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Plan</p>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: T.blue, textTransform: "capitalize" }}>{vendor.subscription.plan}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 9, color: T.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Active</p>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: vendor.subscription.isActive ? T.green : T.red }}>{vendor.subscription.isActive ? "Yes" : "No"}</p>
                                            </div>
                                            {vendor.subscription.expiryDate && (
                                                <div>
                                                    <p style={{ fontSize: 9, color: T.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Expires</p>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{new Date(vendor.subscription.expiryDate).toLocaleDateString("en-IN")}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Rejection reason */}
                                    {vendor.status === "rejected" && vendor.rejectionReason && (
                                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.red }}>
                                            <b>Rejection reason:</b> {vendor.rejectionReason}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <button onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: T.sub, cursor: "pointer" }}>
                                            <FiEye size={13} /> View Details
                                        </button>

                                        {vendor.status === "pending" || vendor.status === "under_review" ? (
                                            <>
                                                <button onClick={() => setModal({ type: "approve", vendor })} disabled={isActing}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: T.green, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                    {isActing ? <FiLoader size={12} style={{ animation: "av-spin 0.8s linear infinite" }} /> : <FiCheckCircle size={13} />}
                                                    Approve
                                                </button>
                                                <button onClick={() => setModal({ type: "reject", vendor })} disabled={isActing}
                                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: T.red, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                    <FiXCircle size={13} /> Reject
                                                </button>
                                            </>
                                        ) : null}

                                        {vendor.status === "approved" && (
                                            <button onClick={() => handleSuspend(vendor)} disabled={isActing}
                                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#f5f3ff", border: "1px solid #ddd6fe", color: T.violet, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                {isActing ? <FiLoader size={12} style={{ animation: "av-spin 0.8s linear infinite" }} /> : <FiPauseCircle size={13} />}
                                                Suspend
                                            </button>
                                        )}

                                        <button onClick={() => setModal({ type: "commission", vendor })}
                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: T.blueBg, border: `1px solid ${T.blueMid}`, color: T.blue, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                            <FiPercent size={13} /> Commission
                                        </button>

                                        <button onClick={() => handleDelete(vendor)} disabled={isActing}
                                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: T.white, border: `1px solid ${T.border}`, color: T.red, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
                                            <FiTrash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}`, flexWrap: "wrap", gap: 12 }}>
                    <p style={{ fontSize: 13, color: T.hint }}>Showing <b style={{ color: T.text }}>{(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, total)}</b> of <b style={{ color: T.text }}>{total}</b></p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                            style={{ padding: "6px 12px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === 1 ? 0.4 : 1 }}>← Prev</button>
                        {getPageNumbers().map((p, i) => p === "…" ? <span key={`d${i}`} style={{ padding: "0 4px", color: T.hint }}>…</span> : (
                            <button key={p} onClick={() => goToPage(p)}
                                style={{ width: 34, height: 34, background: currentPage === p ? T.blue : T.white, border: currentPage === p ? `1px solid ${T.blue}` : `1px solid ${T.border}`, borderRadius: 7, color: currentPage === p ? "#fff" : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
                        ))}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                            style={{ padding: "6px 12px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === totalPages ? 0.4 : 1 }}>Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVendors;