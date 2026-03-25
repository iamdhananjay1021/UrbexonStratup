import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl";
import {
    FiRefreshCw, FiUser, FiPhone, FiMapPin, FiPackage,
    FiChevronDown, FiChevronUp, FiSearch, FiX,
    FiCheckCircle, FiClock, FiEdit2, FiImage, FiFileText,
    FiTag, FiLoader, FiRotateCcw, FiXCircle, FiFileText as FiInvoice,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: "#f59e0b" },
    CONFIRMED: { label: "Confirmed", color: "#3b82f6" },
    PACKED: { label: "Packed", color: "#8b5cf6" },
    SHIPPED: { label: "Shipped", color: "#0ea5e9" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#f97316" },
    DELIVERED: { label: "Delivered", color: "#10b981" },
    CANCELLED: { label: "Cancelled", color: "#ef4444" },
};
const FLOW = {
    PLACED: "CONFIRMED", CONFIRMED: "PACKED", PACKED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED",
};
const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const PAGE_LIMIT = 20;

/* ── Skeleton ── */
const Sk = ({ h = 48 }) => (
    <div style={{ height: h, background: "#f1f5f9", borderRadius: 8, animation: "ux-pulse 1.5s ease-in-out infinite" }} />
);

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLACED;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, color: cfg.color,
            background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
            padding: "3px 10px", borderRadius: 20,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
            {cfg.label}
        </span>
    );
};

/* ── Customization Card ── */
const CustomizationCard = ({ customization }) => {
    const hasText = customization?.text?.trim();
    const hasImage = customization?.imageUrl?.trim();
    const hasNote = customization?.note?.trim();
    if (!hasText && !hasImage && !hasNote) return null;
    return (
        <div style={{ marginTop: 10, background: "#fef3c7", border: "1px solid #fde68a", padding: "10px 12px", borderRadius: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Customization Required</p>
            {hasText && (
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <FiEdit2 size={10} style={{ color: "#d97706", marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 10, color: "#d97706", fontWeight: 700, marginBottom: 2 }}>Print Text:</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{customization.text}</p>
                    </div>
                </div>
            )}
            {hasImage && (
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <FiImage size={10} style={{ color: "#d97706", marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 10, color: "#d97706", fontWeight: 700, marginBottom: 4 }}>Customer Image:</p>
                        <a href={customization.imageUrl} target="_blank" rel="noreferrer">
                            <img src={customization.imageUrl} alt="customer upload" style={{ width: 64, height: 64, objectFit: "cover", border: "1px solid #fde68a", borderRadius: 6 }} />
                        </a>
                    </div>
                </div>
            )}
            {hasNote && (
                <div style={{ display: "flex", gap: 8 }}>
                    <FiFileText size={10} style={{ color: "#d97706", marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 10, color: "#d97706", fontWeight: 700, marginBottom: 2 }}>Instructions:</p>
                        <p style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{customization.note}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Refund Card ── */
const RefundCard = ({ order, onRefundUpdate }) => {
    const [processing, setProcessing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [error, setError] = useState("");
    const refund = order.refund;
    if (!refund || refund.status === "NONE") return null;

    const statusColor = { REQUESTED: "#f59e0b", PROCESSING: "#3b82f6", PROCESSED: "#10b981", REJECTED: "#ef4444", FAILED: "#ef4444" };
    const sc = statusColor[refund.status] || "#94a3b8";

    const handleApprove = async () => {
        try {
            setProcessing(true); setError("");
            await api.put(`/orders/${order._id}/refund/process`, { action: "approve" });
            onRefundUpdate(order._id, { ...order, refund: { ...refund, status: "PROCESSED", processedAt: new Date().toISOString() } });
        } catch (err) { setError(err.response?.data?.message || "Refund failed"); }
        finally { setProcessing(false); }
    };

    const handleReject = async () => {
        try {
            setRejecting(true); setError("");
            await api.put(`/orders/${order._id}/refund/process`, { action: "reject", rejectionReason: rejectNote });
            onRefundUpdate(order._id, { ...order, refund: { ...refund, status: "REJECTED", rejectionReason: rejectNote, processedAt: new Date().toISOString() } });
            setShowRejectInput(false);
        } catch (err) { setError(err.response?.data?.message || "Failed to reject"); }
        finally { setRejecting(false); }
    };

    return (
        <div style={{ background: `${sc}08`, border: `1px solid ${sc}25`, padding: "12px 14px", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: sc, display: "flex", alignItems: "center", gap: 6 }}>
                    <FiRotateCcw size={11} /> Refund — {refund.status}
                </p>
                <span style={{ fontSize: 13, fontWeight: 700, color: sc }}>₹{Number(refund.amount || order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
            {refund.reason && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Reason: {refund.reason}</p>}
            {refund.requestedAt && <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Requested: {new Date(refund.requestedAt).toLocaleString("en-IN")}</p>}
            {error && <p style={{ color: "#ef4444", fontSize: 12, background: "#fef2f2", padding: "4px 8px", borderRadius: 6, marginBottom: 8 }}>⚠ {error}</p>}
            {refund.status === "REQUESTED" && (
                showRejectInput ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input type="text" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                            placeholder="Rejection reason (optional)"
                            style={{ width: "100%", padding: "8px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={handleReject} disabled={rejecting}
                                style={{ flex: 1, padding: "8px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                {rejecting ? <FiLoader size={10} style={{ animation: "ux-spin 0.8s linear infinite" }} /> : <FiXCircle size={10} />} Confirm
                            </button>
                            <button onClick={() => setShowRejectInput(false)}
                                style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Back</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleApprove} disabled={processing}
                            style={{ flex: 1, padding: "8px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            {processing ? <FiLoader size={10} style={{ animation: "ux-spin 0.8s linear infinite" }} /> : <FiRotateCcw size={10} />}
                            {processing ? "Processing..." : "Approve & Refund"}
                        </button>
                        <button onClick={() => setShowRejectInput(true)}
                            style={{ flex: 1, padding: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <FiXCircle size={10} /> Reject
                        </button>
                    </div>
                )
            )}
        </div>
    );
};

/* ══════════════════ MAIN ══════════════════ */
const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [expandedId, setExpandedId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async ({ page = 1, status = "ALL", search = "" } = {}) => {
        try {
            setError(""); setLoading(true);
            const params = { page, limit: PAGE_LIMIT };
            if (status && status !== "ALL") params.status = status;
            if (search.trim()) params.search = search.trim();
            const { data } = await api.get("/orders", { params });
            const list = Array.isArray(data?.orders) ? data.orders : [];
            setOrders(list);
            setTotalOrders(data?.total || 0);
            setTotalPages(data?.totalPages || 1);
            setCurrentPage(data?.page || 1);
        } catch (err) {
            setError(err.response?.status === 403 ? "Access denied." : "Failed to load orders.");
            setOrders([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrders({ page: 1, status: filterStatus, search: searchQuery }); }, []);

    const goToPage = useCallback((page) => {
        setExpandedId(null); window.scrollTo(0, 0);
        fetchOrders({ page, status: filterStatus, search: searchQuery });
    }, [fetchOrders, filterStatus, searchQuery]);

    const handleFilterChange = useCallback((key) => {
        setFilterStatus(key); setExpandedId(null); setCurrentPage(1);
        fetchOrders({ page: 1, status: key, search: searchQuery });
    }, [fetchOrders, searchQuery]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        setSearchQuery(searchInput); setFilterStatus("ALL"); setCurrentPage(1);
        fetchOrders({ page: 1, status: "ALL", search: searchInput });
    }, [fetchOrders, searchInput]);

    const clearSearch = useCallback(() => {
        setSearchInput(""); setSearchQuery("");
        fetchOrders({ page: 1, status: filterStatus, search: "" });
    }, [fetchOrders, filterStatus]);

    const refreshOrders = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
        setRefreshing(false);
    }, [fetchOrders, currentPage, filterStatus, searchQuery]);

    const updateStatus = useCallback(async (orderId, nextStatus) => {
        if (!nextStatus) return;
        try {
            setUpdatingId(orderId);
            const { data: updated } = await api.put(`/orders/${orderId}`, { status: nextStatus });
            if (updated?._id) setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
            else await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status");
            await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
        } finally { setUpdatingId(null); }
    }, [fetchOrders, currentPage, filterStatus, searchQuery]);

    const handleRefundUpdate = useCallback((orderId, updatedOrder) => {
        setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
    }, []);

    const handleDownloadInvoice = useCallback(async (orderId, e) => {
        e.stopPropagation();
        try {
            setDownloadingId(orderId);
            const response = await api.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url; link.setAttribute("download", `Invoice_${orderId.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch { alert("Failed to download invoice."); }
        finally { setDownloadingId(null); }
    }, []);

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
        if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
    };

    if (loading && orders.length === 0) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "ux-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#64748b", fontSize: 13 }}>Loading orders...</p>
            </div>
            <style>{`@keyframes ux-spin{to{transform:rotate(360deg)}} @keyframes ux-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
        @keyframes ux-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ux-spin { to{transform:rotate(360deg)} }
        .ux-order-card { transition: border-color 0.18s, box-shadow 0.18s; }
        .ux-order-card:hover { border-color: #bfdbfe !important; box-shadow: 0 2px 12px rgba(37,99,235,0.06) !important; }
        .ux-order-header { cursor: pointer; transition: background 0.15s; }
        .ux-order-header:hover { background: #f8fafc !important; }
        .ux-filter-btn { transition: all 0.15s; }
        .ux-filter-btn:hover { border-color: #93c5fd !important; color: #1e40af !important; }
      `}</style>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Orders</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>{totalOrders} total orders</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                            <FiSearch size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                            <input
                                type="text" value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search name, phone..."
                                style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#1e293b", fontSize: 13, fontFamily: "inherit", outline: "none", width: 200, transition: "border-color 0.2s" }}
                                onFocus={e => e.currentTarget.style.borderColor = "#93c5fd"}
                                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                            />
                        </div>
                        {searchQuery && (
                            <button type="button" onClick={clearSearch} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                                <FiX size={13} /> Clear
                            </button>
                        )}
                    </form>
                    <button onClick={refreshOrders} disabled={refreshing}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                        <FiRefreshCw size={13} style={{ animation: refreshing ? "ux-spin 0.8s linear infinite" : "none" }} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
                {[
                    { key: "ALL", label: "All" },
                    ...FLOW_STEPS.map(s => ({ key: s, label: STATUS_CONFIG[s]?.label, dot: STATUS_CONFIG[s]?.color })),
                    { key: "CANCELLED", label: "Cancelled", dot: STATUS_CONFIG.CANCELLED.color },
                ].map(({ key, label, dot }) => (
                    <button key={key} onClick={() => handleFilterChange(key)} className="ux-filter-btn"
                        style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 14px", fontSize: 12, fontWeight: 600,
                            border: filterStatus === key ? "1px solid #2563eb" : "1px solid #e2e8f0",
                            background: filterStatus === key ? "#eff6ff" : "#fff",
                            color: filterStatus === key ? "#2563eb" : "#64748b",
                            cursor: "pointer", fontFamily: "inherit", borderRadius: 8,
                        }}>
                        {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}
                        {label}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                    ⚠ {error}
                </div>
            )}

            {loading && orders.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                    <div style={{ width: 24, height: 24, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "ux-spin 0.8s linear infinite" }} />
                </div>
            )}

            {/* Orders List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.length === 0 && !loading ? (
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        No orders found
                    </div>
                ) : orders.map(order => {
                    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                    const next = FLOW[order.orderStatus];
                    const isCancelled = order.orderStatus === "CANCELLED";
                    const isExpanded = expandedId === order._id;
                    const isUpdating = updatingId === order._id;

                    return (
                        <div key={order._id} className="ux-order-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                            {/* Row header */}
                            <div className="ux-order-header" onClick={() => setExpandedId(isExpanded ? null : order._id)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 38, height: 38, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <FiPackage size={16} color="#2563eb" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>#{order._id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{order.customerName} · {order.phone}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <StatusBadge status={order.orderStatus} />
                                    <span style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                                    <button onClick={(e) => handleDownloadInvoice(order._id, e)}
                                        disabled={downloadingId === order._id}
                                        style={{ padding: "5px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                        {downloadingId === order._id ? <FiLoader size={10} style={{ animation: "ux-spin 0.8s linear infinite" }} /> : "PDF"}
                                    </button>
                                    {isExpanded ? <FiChevronUp size={16} color="#94a3b8" /> : <FiChevronDown size={16} color="#94a3b8" />}
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div style={{ borderTop: "1px solid #f1f5f9", padding: "20px", background: "#fafbfc" }}>
                                    {/* Customer Info */}
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>Customer Info</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10 }}>
                                            {[
                                                { icon: FiUser, label: "Name", value: order.customerName },
                                                { icon: FiPhone, label: "Phone", value: order.phone },
                                                { icon: FiMapPin, label: "Address", value: order.address },
                                            ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                                    <Icon size={13} color="#94a3b8" style={{ marginTop: 2 }} />
                                                    <div>
                                                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                                                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, marginTop: 1 }}>{value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status progress */}
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>Order Progress</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
                                            {FLOW_STEPS.map((step, idx) => {
                                                const stepIdx = FLOW_STEPS.indexOf(order.orderStatus);
                                                const done = idx <= stepIdx;
                                                const cfg2 = STATUS_CONFIG[step];
                                                return (
                                                    <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#2563eb" : "#f1f5f9", border: done ? "none" : "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                {done ? <FiCheckCircle size={14} color="#fff" /> : <FiClock size={12} color="#94a3b8" />}
                                                            </div>
                                                            <span style={{ fontSize: 9, fontWeight: 600, color: done ? "#2563eb" : "#94a3b8", textAlign: "center", maxWidth: 52, lineHeight: 1.3 }}>{cfg2.label}</span>
                                                        </div>
                                                        {idx < FLOW_STEPS.length - 1 && (
                                                            <div style={{ width: 24, height: 2, background: idx < stepIdx ? "#2563eb" : "#e2e8f0", margin: "0 2px", marginBottom: 18 }} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            {!isCancelled && next && (
                                                <button onClick={() => updateStatus(order._id, next)} disabled={isUpdating}
                                                    style={{ padding: "9px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: isUpdating ? 0.7 : 1 }}>
                                                    {isUpdating ? <FiLoader size={12} style={{ animation: "ux-spin 0.8s linear infinite" }} /> : null}
                                                    Mark as {STATUS_CONFIG[next]?.label}
                                                </button>
                                            )}
                                            {!isCancelled && order.orderStatus !== "DELIVERED" && (
                                                <button onClick={() => updateStatus(order._id, "CANCELLED")} disabled={isUpdating}
                                                    style={{ padding: "9px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                                    Cancel Order
                                                </button>
                                            )}
                                            {isCancelled && <div style={{ color: "#ef4444", fontWeight: 600, fontSize: 13 }}>Order Cancelled</div>}
                                            {order.orderStatus === "DELIVERED" && <div style={{ color: "#10b981", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><FiCheckCircle /> Delivered</div>}
                                            {!isCancelled && (
                                                <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your order #${order._id.slice(-6).toUpperCase()} is now ${cfg.label}. Thank you for shopping with UrbeXon!`)}`}
                                                    target="_blank" rel="noreferrer"
                                                    style={{ padding: "9px 14px", background: "#dcfce7", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                                                    <FaWhatsapp size={14} /> WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Refund */}
                                    {order.refund?.status && order.refund.status !== "NONE" && (
                                        <div style={{ marginBottom: 20 }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 8 }}>Refund</p>
                                            <RefundCard order={order} onRefundUpdate={handleRefundUpdate} />
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 10 }}>Order Items</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                        <div style={{ width: 48, height: 48, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            {item.image
                                                                ? <img src={imgUrl.thumbnail(item.image)} alt={item.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} onError={e => { e.target.style.display = "none"; }} />
                                                                : <FiPackage size={16} color="#94a3b8" />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                                                <span style={{ fontSize: 12, color: "#64748b" }}>Qty: {item.qty}</span>
                                                                {item.selectedSize && (
                                                                    <span style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>
                                                                        {item.selectedSize}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", flexShrink: 0 }}>
                                                            ₹{(item.price * item.qty).toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                    <CustomizationCard customization={item.customization} />
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total</span>
                                            <span style={{ fontWeight: 800, fontSize: 20, color: "#10b981" }}>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0", flexWrap: "wrap", gap: 12 }}>
                    <p style={{ fontSize: 13, color: "#64748b" }}>
                        Showing <b style={{ color: "#1e293b" }}>{(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, totalOrders)}</b> of <b style={{ color: "#1e293b" }}>{totalOrders}</b>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                            style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === 1 ? 0.4 : 1 }}>
                            ← Prev
                        </button>
                        {getPageNumbers().map((p, i) =>
                            p === "…" ? <span key={`dot-${i}`} style={{ padding: "0 4px", color: "#94a3b8", fontSize: 13 }}>…</span> : (
                                <button key={p} onClick={() => goToPage(p)}
                                    style={{ width: 34, height: 34, background: currentPage === p ? "#2563eb" : "#fff", border: currentPage === p ? "1px solid #2563eb" : "1px solid #e2e8f0", borderRadius: 7, color: currentPage === p ? "#fff" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    {p}
                                </button>
                            )
                        )}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                            style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;