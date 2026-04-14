/**
 * AdminDeliveryBoys.jsx — Manage delivery partners
 * ✅ Fixed: uses d.name (not d.fullName)
 * ✅ Document viewer modal with per-doc approval/rejection
 * ✅ Online/Offline status indicator
 * ✅ Location display
 * ✅ Responsive card + table view
 */
import { useEffect, useState } from "react";
import adminApi from "../api/adminApi";

const STATUS_CFG = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
    suspended: { bg: "#ede9fe", color: "#5b21b6", label: "Suspended" },
};

const Badge = ({ status }) => {
    const cfg = STATUS_CFG[status] || { bg: "#f1f5f9", color: "#475569", label: status };
    return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>{cfg.label}</span>;
};

const OnlineDot = ({ isOnline }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isOnline ? "#059669" : "#94a3b8" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#22c55e" : "#cbd5e1", boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,.3)" : "none" }} />
        {isOnline ? "Online" : "Offline"}
    </span>
);

/* Document Viewer Modal — per-doc approval/rejection */
const DOC_FIELDS = [
    { key: "aadhaarPhoto", label: "Aadhaar Card" },
    { key: "licensePhoto", label: "Driving License" },
    { key: "vehicleRc", label: "Vehicle RC" },
    { key: "selfie", label: "Selfie" },
];

const DOC_STATUS = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending", border: "#fcd34d" },
    approved: { bg: "#d1fae5", color: "#065f46", label: "Approved", border: "#86efac" },
    rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected", border: "#fca5a5" },
};

const DocModal = ({ rider, onClose, onUpdate }) => {
    const [fullscreen, setFullscreen] = useState(null);
    const [noteInputs, setNoteInputs] = useState({});
    const [updating, setUpdating] = useState({});

    if (!rider) return null;
    const docs = rider.documents || {};
    const docStatuses = rider.documentStatus || {};
    const docNotes = rider.documentNotes || {};

    const handleDocAction = async (docKey, status) => {
        setUpdating(p => ({ ...p, [docKey]: true }));
        try {
            await adminApi.patch(`/admin/delivery-boys/${rider._id}/document-status`, {
                docKey, status, note: noteInputs[docKey] || "",
            });
            if (onUpdate) onUpdate();
        } catch { /* silent */ }
        finally { setUpdating(p => ({ ...p, [docKey]: false })); }
    };

    return (
        <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>{rider.name || "Rider"}</h3>
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{rider.phone} · {rider.city || "No city"}</p>
                        </div>
                        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", padding: 4 }}>✕</button>
                    </div>
                    {/* Rider details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .5 }}>Vehicle</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2, textTransform: "capitalize" }}>{rider.vehicleType || "—"}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{rider.vehicleNumber || "No number"}</div>
                        </div>
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .5 }}>Stats</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2 }}>{rider.totalDeliveries || 0} deliveries</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>₹{rider.totalEarnings || 0} earned</div>
                        </div>
                    </div>
                    {/* Documents with per-doc approval */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Documents</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {DOC_FIELDS.map(doc => {
                            const url = docs[doc.key];
                            const status = docStatuses[doc.key] || "pending";
                            const note = docNotes[doc.key] || "";
                            const cfg = DOC_STATUS[status] || DOC_STATUS.pending;
                            const busy = updating[doc.key];

                            return (
                                <div key={doc.key} style={{ border: `1px solid ${cfg.border}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                                    <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "flex-start" }}>
                                        {/* Thumbnail */}
                                        {url ? (
                                            <div style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", cursor: "pointer", flexShrink: 0 }}
                                                onClick={() => setFullscreen({ url, label: doc.label })}>
                                                <img src={url} alt={doc.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                                            </div>
                                        ) : (
                                            <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f8fafc", border: "1px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                                                <span style={{ fontSize: 20, opacity: .3 }}>📄</span>
                                                <span style={{ fontSize: 9, color: "#cbd5e1" }}>Not uploaded</span>
                                            </div>
                                        )}
                                        {/* Info + actions */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{doc.label}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                            </div>
                                            {note && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Note: {note}</div>}
                                            {url && (
                                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                                    Open full size ↗
                                                </a>
                                            )}
                                            {/* Action buttons */}
                                            {url && (
                                                <div style={{ marginTop: 8 }}>
                                                    {/* Rejection note input */}
                                                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                                        {status !== "approved" && (
                                                            <button disabled={busy} onClick={() => handleDocAction(doc.key, "approved")}
                                                                style={{ padding: "4px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#d1fae5", color: "#065f46", opacity: busy ? .5 : 1 }}>
                                                                {busy ? "…" : "✓ Approve"}
                                                            </button>
                                                        )}
                                                        {status !== "rejected" && (
                                                            <button disabled={busy} onClick={() => handleDocAction(doc.key, "rejected")}
                                                                style={{ padding: "4px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#fee2e2", color: "#b91c1c", opacity: busy ? .5 : 1 }}>
                                                                {busy ? "…" : "✕ Reject"}
                                                            </button>
                                                        )}
                                                        {status === "approved" && (
                                                            <button disabled={busy} onClick={() => handleDocAction(doc.key, "pending")}
                                                                style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#fff", color: "#64748b", opacity: busy ? .5 : 1 }}>
                                                                Reset
                                                            </button>
                                                        )}
                                                    </div>
                                                    {status !== "approved" && (
                                                        <input
                                                            type="text" placeholder="Rejection note (optional)"
                                                            value={noteInputs[doc.key] || ""}
                                                            onChange={e => setNoteInputs(p => ({ ...p, [doc.key]: e.target.value }))}
                                                            style={{ marginTop: 6, width: "100%", padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, outline: "none", boxSizing: "border-box" }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {rider.adminNote && (
                        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#92400e" }}>
                            <strong>Admin Note:</strong> {rider.adminNote}
                        </div>
                    )}
                </div>
            </div>
            {/* Fullscreen doc viewer */}
            {fullscreen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setFullscreen(null)}>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{fullscreen.label}</div>
                    <img src={fullscreen.url} alt={fullscreen.label} style={{ maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
                    <button onClick={() => setFullscreen(null)} style={{ marginTop: 16, padding: "8px 24px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
                </div>
            )}
        </>
    );
};

const AdminDeliveryBoys = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [msg, setMsg] = useState("");
    const [docRider, setDocRider] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await adminApi.get("/admin/delivery-boys");
            setList(data.deliveryBoys || []);
        } catch { setMsg("Failed to load"); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await adminApi.patch(`/admin/delivery-boys/${id}/status`, { status });
            setMsg(`Status updated to ${status}`);
            load();
            setTimeout(() => setMsg(""), 3000);
        } catch { setMsg("Failed to update"); }
    };

    const filtered = list.filter(d => {
        const matchStatus = filter === "all" || d.status === filter;
        const displayName = d.name || d.userId?.name || "";
        const matchSearch = !search || displayName.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search);
        return matchStatus && matchSearch;
    });

    const counts = {};
    list.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });

    const S = {
        root: { padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 },
        title: { fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 },
        filters: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
        filterBtn: (active) => ({ padding: "6px 14px", border: `1.5px solid ${active ? "#1a1740" : "#e2e8f0"}`, background: active ? "#1a1740" : "#fff", color: active ? "#c9a84c" : "#64748b", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer" }),
        searchInp: { padding: "8px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 220, outline: "none" },
        table: { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
        th: { padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
        td: { padding: "13px 14px", fontSize: 13, color: "#1e293b", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
        actionBtn: (col) => ({ padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: col === "green" ? "#d1fae5" : col === "red" ? "#fee2e2" : col === "blue" ? "#dbeafe" : "#f1f5f9", color: col === "green" ? "#065f46" : col === "red" ? "#b91c1c" : col === "blue" ? "#1d4ed8" : "#475569" }),
    };

    return (
        <div style={S.root}>
            {docRider && <DocModal rider={docRider} onClose={() => setDocRider(null)} onUpdate={load} />}

            <div style={S.header}>
                <div>
                    <h1 style={S.title}>🏍️ Delivery Partners</h1>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                        Total: {list.length} · Online: {list.filter(d => d.isOnline).length} · Pending: {counts.pending || 0}
                    </p>
                </div>
                <div style={S.filters}>
                    {["all", "pending", "approved", "rejected", "suspended"].map(f => (
                        <button key={f} style={S.filterBtn(filter === f)} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)} {f !== "all" && counts[f] ? `(${counts[f]})` : ""}
                        </button>
                    ))}
                    <input style={S.searchInp} placeholder="Search name / phone…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {msg && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{msg}</div>}

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading…</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No delivery partners found</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {["Name", "Phone", "City", "Vehicle", "Status", "Online", "Rating", "Actions"].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => {
                                const displayName = d.name || d.userId?.name || "Unknown";
                                return (
                                    <tr key={d._id}>
                                        <td style={S.td}>
                                            <div style={{ fontWeight: 700 }}>{displayName}</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.vehicleNumber || "—"}</div>
                                        </td>
                                        <td style={S.td}>{d.phone}</td>
                                        <td style={S.td}>{d.city || "—"}</td>
                                        <td style={{ ...S.td, textTransform: "capitalize" }}>{d.vehicleType || "—"}</td>
                                        <td style={S.td}><Badge status={d.status} /></td>
                                        <td style={S.td}><OnlineDot isOnline={d.isOnline} /></td>
                                        <td style={S.td}>⭐ {d.rating?.toFixed(1) || "5.0"}</td>
                                        <td style={S.td}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <button style={S.actionBtn("blue")} onClick={() => setDocRider(d)}>View</button>
                                                {d.status !== "approved" && d.status !== "rejected" && (
                                                    <button style={S.actionBtn("green")} onClick={() => updateStatus(d._id, "approved")}>Approve</button>
                                                )}
                                                {d.status === "pending" && (
                                                    <button style={S.actionBtn("red")} onClick={() => updateStatus(d._id, "rejected")}>Reject</button>
                                                )}
                                                {d.status === "approved" && (
                                                    <button style={S.actionBtn("red")} onClick={() => updateStatus(d._id, "suspended")}>Suspend</button>
                                                )}
                                                {(d.status === "suspended" || d.status === "rejected") && (
                                                    <button style={S.actionBtn("green")} onClick={() => updateStatus(d._id, "approved")}>Restore</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export default AdminDeliveryBoys;
