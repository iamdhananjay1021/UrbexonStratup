/**
 * OrderDetails.jsx — Production Ready
 * ✅ Invoice URL FIXED: /api/invoice/:orderId/download
 * ✅ Shiprocket tracking (user-facing, mock-aware)
 * ✅ White/Blue theme, responsive, animated
 */

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import {
    FaArrowLeft, FaBoxOpen, FaMapMarkerAlt, FaPhone, FaUser,
    FaShoppingBag, FaTimesCircle, FaGift, FaUndo, FaInfoCircle,
    FaSpinner, FaFileInvoice, FaCheckCircle, FaTruck, FaExternalLinkAlt,
} from "react-icons/fa";
import LiveTrackingMap from "../components/LiveTrackingMap";

const C = {
    bg: "#f8fafc", white: "#ffffff", border: "#e2e8f0", borderL: "#f1f5f9",
    blue: "#2563eb", blueBg: "#eff6ff", blueMid: "#dbeafe",
    text: "#1e293b", sub: "#334155", muted: "#475569", hint: "#94a3b8",
    green: "#10b981", red: "#ef4444", amber: "#f59e0b",
    sky: "#0ea5e9", violet: "#8b5cf6", orange: "#f97316",
};

const STATUS_CFG = {
    PLACED: { label: "Placed", color: C.amber, bg: "#fef3c7", dot: "#f59e0b" },
    CONFIRMED: { label: "Confirmed", color: C.blue, bg: C.blueBg, dot: C.blue },
    PACKED: { label: "Packed", color: C.violet, bg: "#f5f3ff", dot: C.violet },
    READY_FOR_PICKUP: { label: "Ready for Pickup", color: "#854d0e", bg: "#fef9c3", dot: "#854d0e" },
    SHIPPED: { label: "Shipped", color: C.sky, bg: "#f0f9ff", dot: C.sky },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: C.orange, bg: "#fff7ed", dot: C.orange },
    DELIVERED: { label: "Delivered", color: C.green, bg: "#f0fdf4", dot: C.green },
    CANCELLED: { label: "Cancelled", color: C.red, bg: "#fef2f2", dot: C.red },
};

const REFUND_STATUS = {
    NONE: null,
    REQUESTED: { label: "Refund Requested", color: C.amber, desc: "Under review. Will be processed within 1-2 business days." },
    PROCESSING: { label: "Refund Processing", color: C.blue, desc: "Being processed. Please wait 24-48 hours." },
    PROCESSED: { label: "Refund Processed", color: C.green, desc: "Amount will reflect within 5-7 business days." },
    FAILED: { label: "Refund Failed", color: C.red, desc: "There was an issue. Admin will retry shortly." },
    REJECTED: { label: "Refund Rejected", color: C.red, desc: null },
};

const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const UH_FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];
const CANCELLABLE = ["PLACED", "CONFIRMED"];
const getItemImage = (item) => item.images?.[0]?.url || item.image || null;

const Card = ({ children, style = {} }) => (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", ...style }}>{children}</div>
);

const STitle = ({ children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: C.blue, borderRadius: 2 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</h2>
    </div>
);

/* Shiprocket Tracking (user-facing) */
const ShiprocketTrackCard = ({ orderId, shipping }) => {
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const isMock = shipping?.mock;
    if (!shipping?.awbCode) return null;

    const fetchTracking = async () => {
        try { setLoading(true); setError(""); const { data } = await api.get(`/shiprocket/track/${orderId}`); setTracking(data); }
        catch (err) { setError(err.response?.data?.message || "Live tracking not available right now."); }
        finally { setLoading(false); }
    };

    return (
        <Card style={{ border: `1px solid ${C.blueMid}`, background: C.blueBg }}>
            <STitle>Shipment Tracking</STitle>
            {isMock && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>🔧</span>
                    <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                        <b>Test shipment.</b> Real AWB tracking will be live once Shiprocket account is connected.
                    </p>
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
                {[{ label: "Tracking ID (AWB)", value: shipping.awbCode, mono: true }, { label: "Courier Partner", value: shipping.courierName || "Standard" }, { label: "Shipment ID", value: shipping.shipmentId, mono: true }].map(({ label, value, mono }) => (
                    <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: C.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: mono ? "'Courier New',monospace" : "inherit", wordBreak: "break-all" }}>{value || "—"}</p>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!isMock && <button onClick={fetchTracking} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.blue, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {loading ? <FaSpinner size={11} style={{ animation: "od-spin 0.8s linear infinite" }} /> : <FaTruck size={11} />}{loading ? "Fetching..." : "Get Live Status"}
                </button>}
                {!isMock && shipping.trackingUrl && <a href={shipping.trackingUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.white, border: `1px solid ${C.border}`, color: C.blue, borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none" }}><FaExternalLinkAlt size={10} /> Track on Shiprocket</a>}
            </div>
            {error && <p style={{ fontSize: 12, color: C.red, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, marginTop: 10 }}>{error}</p>}
            {tracking && !isMock && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Current Status</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.sky, background: "#f0f9ff", border: "1px solid #bae6fd", padding: "3px 10px", borderRadius: 20 }}>{tracking.label || tracking.status}</span>
                    </div>
                    {tracking.detail && <p style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{tracking.detail}</p>}
                    {tracking.activities?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {tracking.activities.slice(0, 5).map((act, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? C.blue : C.border, marginTop: 4, flexShrink: 0 }} />
                                    <div><p style={{ fontSize: 13, color: C.sub, fontWeight: i === 0 ? 600 : 400 }}>{act.activity}</p><p style={{ fontSize: 11, color: C.hint, marginTop: 1 }}>{act.location && `${act.location} · `}{new Date(act.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

/* MAIN */
const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [requestingRefund, setRequestingRefund] = useState(false);
    const [refundError, setRefundError] = useState("");
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [liveStatus, setLiveStatus] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null); // {lat, lng, riderName}
    const [deliveryStatus, setDeliveryStatus] = useState(null); // granular: ASSIGNED, ARRIVING_VENDOR, PICKED_UP, etc.
    const [deliveryOtp, setDeliveryOtp] = useState(null); // OTP for delivery confirmation

    // ── Get auth token for WebSocket ──────────────────────────
    const authToken = (() => { try { return JSON.parse(localStorage.getItem("auth") || "{}")?.token; } catch { return null; } })();

    // ── WebSocket: real-time order updates ───────────────────
    const { send: wsSend } = useWebSocket(authToken, {
        onMessage: (msg) => {
            if (msg.type === "order_status_updated" && msg.payload?.orderId === id) {
                setLiveStatus(msg.payload.status);
                setOrder(prev => prev ? { ...prev, orderStatus: msg.payload.status } : prev);
            }
            // Delivery controller sends "order_status" with OTP
            if (msg.type === "order_status" && msg.payload?.orderId === id) {
                if (msg.payload.status) {
                    setLiveStatus(msg.payload.status);
                    setOrder(prev => prev ? { ...prev, orderStatus: msg.payload.status } : prev);
                }
                if (msg.payload.otp) {
                    setDeliveryOtp(msg.payload.otp);
                }
            }
            if (msg.type === "rider_location" && msg.payload?.orderId === id) {
                setRiderLocation({
                    lat: msg.payload.lat,
                    lng: msg.payload.lng,
                    riderName: msg.payload.riderName,
                    at: msg.payload.at,
                });
            }
            // Granular delivery status (from assignment engine)
            if (msg.type === "delivery:status_update" && msg.payload?.orderId === id) {
                setDeliveryStatus(msg.payload.status);
            }
        },
        onConnect: () => {
            // Join order room for targeted updates
            if (id) wsSend("join_room", { room: `order:${id}` });
        },
    });

    // ── Polling fallback: fetch rider location if WS has no data ──
    useEffect(() => {
        if (order?.orderStatus !== "OUT_FOR_DELIVERY" || riderLocation) return;
        const poll = async () => {
            try {
                const { data } = await api.get(`/delivery/orders/${id}/rider-location`);
                if (data.available && data.rider?.lat) {
                    setRiderLocation({
                        lat: data.rider.lat, lng: data.rider.lng,
                        riderName: data.rider.name, at: data.rider.updatedAt,
                    });
                }
            } catch { /* silent */ }
        };
        poll();
        const t = setInterval(poll, 15000);
        return () => clearInterval(t);
    }, [order?.orderStatus, id, riderLocation]);

    // ── SSE fallback: also listen via EventSource ─────────────
    useOrderRealtime({
        enabled: !!authToken,
        onStatusUpdate: (payload) => {
            if (payload?.orderId === id) {
                setLiveStatus(payload.status);
                setOrder(prev => prev ? { ...prev, orderStatus: payload.status } : prev);
            }
        },
    });

    useEffect(() => {
        if (!id) return;
        (async () => { try { setLoading(true); const { data } = await api.get(`/orders/${id}`); setOrder(data); if (data.deliveryOtp?.code) setDeliveryOtp(data.deliveryOtp.code); } catch { setError("Order not found or you don't have access."); } finally { setLoading(false); } })();
    }, [id]);

    const handleCancel = async () => {
        try { setCancelling(true); setCancelError(""); const { data } = await api.patch(`/orders/${id}/cancel`); setOrder(data.order); setConfirmCancel(false); }
        catch (err) { setCancelError(err.response?.data?.message || "Failed to cancel order"); } finally { setCancelling(false); }
    };

    const handleRefundRequest = async () => {
        try { setRequestingRefund(true); setRefundError(""); const { data } = await api.post(`/payment/refund/${id}`, { reason: refundReason || "Requested by customer" }); setOrder(prev => ({ ...prev, refund: data.refund })); setShowRefundForm(false); }
        catch (err) { setRefundError(err.response?.data?.message || "Failed to submit refund request"); } finally { setRequestingRefund(false); }
    };

    // ✅ FIXED: Correct route /api/invoice/:orderId/download
    const handleDownloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            const response = await api.get(`/invoice/${id}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a"); link.href = url;
            link.setAttribute("download", `Urbexon_Invoice_${id.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
        } catch (err) {
            const s = err.response?.status;
            if (s === 403) alert("Access denied.");
            else if (s === 404) alert("Invoice not found. Please contact support.");
            else alert("Failed to download invoice.");
        } finally { setDownloadingInvoice(false); }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`@keyframes od-spin{to{transform:rotate(360deg)}} @keyframes od-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes od-slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}`}</style>
            <div style={{ textAlign: "center" }}><div style={{ width: 40, height: 40, border: `3px solid ${C.blueMid}`, borderTopColor: C.blue, borderRadius: "50%", animation: "od-spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: C.hint, fontSize: 13 }}>Loading your order...</p></div>
        </div>
    );

    if (!order) return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ width: 72, height: 72, background: C.blueBg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><FaBoxOpen size={28} color={C.blue} /></div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Order Not Found</h2>
            <p style={{ color: C.hint, fontSize: 14, marginBottom: 24 }}>{error}</p>
            <Link to="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", background: C.blue, color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}><FaArrowLeft size={12} /> Back to Orders</Link>
        </div>
    );

    const cfg = STATUS_CFG[order?.orderStatus] || STATUS_CFG.PLACED;
    const isUH = order?.orderMode === "URBEXON_HOUR";
    const activeFlowSteps = isUH ? UH_FLOW_STEPS : FLOW_STEPS;
    const stepIdx = activeFlowSteps.indexOf(order?.orderStatus);
    const isCancelled = order?.orderStatus === "CANCELLED";
    const isDelivered = order?.orderStatus === "DELIVERED";
    const isShipped = ["SHIPPED", "OUT_FOR_DELIVERY"].includes(order?.orderStatus);
    const canCancel = CANCELLABLE.includes(order?.orderStatus);
    const isRazorpay = order?.payment?.method === "RAZORPAY";
    const isPaid = order?.payment?.status === "PAID";
    const refundStatus = order?.refund?.status || "NONE";
    const refundInfo = REFUND_STATUS[refundStatus] || null;
    const canRequestRefund = isCancelled && isRazorpay && isPaid && refundStatus === "NONE";
    const hasShipping = !!order?.shipping?.awbCode;
    const showInvoiceBtn = (isDelivered || (isPaid && !isCancelled));

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif", color: C.text }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes od-spin    { to{transform:rotate(360deg)} }
                @keyframes od-fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes od-slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
                .od-anim { animation:od-fadeUp .4s ease forwards; }
                .od-item { animation:od-slideIn .35s ease forwards; }
                .od-btn  { transition:all .18s; cursor:pointer; }
                .od-btn:hover  { transform:translateY(-1px); opacity:.9; }
                .od-btn:active { transform:scale(.98); }
                .od-back { transition:color .15s; text-decoration:none; display:inline-flex; align-items:center; gap:6px; color:${C.hint}; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
                .od-back:hover { color:${C.blue} !important; }
                button:disabled { cursor:not-allowed; opacity:.6; }
                .od-grid2 { display:grid; grid-template-columns:1fr; gap:14px; }
                @media(min-width:640px){ .od-grid2{grid-template-columns:1fr 1fr;} }
                .od-header-wrap { display:flex; flex-direction:column; gap:12px; }
                @media(min-width:640px){ .od-header-wrap { flex-direction:row; align-items:flex-start; justify-content:space-between; } }
                .od-header-badges { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:8px; }
                .od-header-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
                .od-tracking-map { height: clamp(180px, 30vw, 240px); }
            `}</style>

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px clamp(12px, 4vw, 16px) 60px" }}>

                {/* Header */}
                <div className="od-anim" style={{ marginBottom: 24 }}>
                    <Link to="/orders" className="od-back" style={{ marginBottom: 16, display: "inline-flex" }}><FaArrowLeft size={9} /> Back to Orders</Link>
                    <div className="od-header-wrap" style={{ marginTop: 12 }}>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>Order Details</h1>
                            <div className="od-header-badges">
                                <span style={{ fontFamily: "'Courier New',monospace", background: C.blueBg, color: C.blue, padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${C.blueMid}` }}>#{order._id.slice(-8).toUpperCase()}</span>
                                {order.invoiceNumber && <span style={{ background: "#f0fdf4", color: C.green, padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "1px solid #bbf7d0" }}>{order.invoiceNumber}</span>}
                                {isUH && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ede9fe", color: "#7c3aed", padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "1px solid #ddd6fe" }}>⚡ Urbexon Hour</span>}
                                <span style={{ color: C.hint, fontSize: 11 }}>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                        </div>
                        <div className="od-header-actions">
                            {showInvoiceBtn && <button onClick={handleDownloadInvoice} disabled={downloadingInvoice} className="od-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: C.white, border: `1px solid ${C.border}`, color: C.blue, borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                                {downloadingInvoice ? <FaSpinner size={11} style={{ animation: "od-spin 0.8s linear infinite" }} /> : <FaFileInvoice size={11} />}
                                {downloadingInvoice ? "…" : "Invoice"}
                            </button>}
                            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />{cfg.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cancelled */}
                {isCancelled && <div className="od-anim" style={{ animationDelay: "50ms", marginBottom: 14 }}><Card style={{ border: "1px solid #fecaca", background: "#fef2f2", padding: "14px 18px" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 38, height: 38, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FaTimesCircle size={16} color={C.red} /></div><div><p style={{ fontWeight: 700, color: C.red, fontSize: 14, marginBottom: 2 }}>Order Cancelled</p><p style={{ color: "#f87171", fontSize: 12 }}>{order.cancellationReason || "This order has been cancelled."}</p></div></div></Card></div>}

                {/* Refund Status */}
                {refundInfo && <div className="od-anim" style={{ animationDelay: "70ms", marginBottom: 14 }}><Card style={{ border: `1px solid ${refundInfo.color}30`, background: `${refundInfo.color}08`, padding: "14px 18px" }}><div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><FaUndo size={13} color={refundInfo.color} style={{ marginTop: 2, flexShrink: 0 }} /><div><p style={{ fontWeight: 700, color: refundInfo.color, fontSize: 14, marginBottom: 4 }}>{refundInfo.label}</p>{refundInfo.desc && <p style={{ fontSize: 13, color: C.muted }}>{refundInfo.desc}</p>}{refundStatus === "PROCESSED" && order.refund?.amount && <p style={{ fontSize: 13, fontWeight: 800, color: C.green, marginTop: 6 }}>₹{Number(order.refund.amount).toLocaleString("en-IN")} refunded</p>}{refundStatus === "REJECTED" && order.refund?.adminNote && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Reason: {order.refund.adminNote}</p>}</div></div></Card></div>}

                {/* Order Tracking */}
                {!isCancelled && stepIdx >= 0 && (
                    <div className="od-anim" style={{ animationDelay: "100ms", marginBottom: 14 }}>
                        <Card>
                            <STitle>Order Tracking</STitle>
                            <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ position: "absolute", left: "4%", right: "4%", top: 14, height: 3, background: C.borderL, borderRadius: 2, zIndex: 0 }} />
                                <div style={{ position: "absolute", left: "4%", top: 14, height: 3, background: isUH ? "linear-gradient(90deg,#7c3aed,#a78bfa)" : `linear-gradient(90deg,${C.blue},#60a5fa)`, borderRadius: 2, zIndex: 0, width: stepIdx > 0 ? `${(stepIdx / (activeFlowSteps.length - 1)) * 92}%` : "0%", transition: "width 0.8s ease" }} />
                                {activeFlowSteps.map((step, i) => {
                                    const done = i <= stepIdx, active = i === stepIdx;
                                    const accentColor = isUH ? "#7c3aed" : C.blue;
                                    const accentBg = isUH ? "#ede9fe" : C.blueMid;
                                    const accentLight = isUH ? "#faf5ff" : C.blueBg;
                                    return (
                                        <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1, flex: 1 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? (active ? accentColor : accentBg) : C.borderL, border: `2px solid ${done ? accentColor : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: active ? `0 0 0 4px ${accentLight}` : "none", transition: "all 0.3s" }}>
                                                {i < stepIdx ? <FaCheckCircle size={12} color={accentColor} /> : active ? <FaTruck size={11} color="#fff" /> : <span style={{ fontSize: 9, fontWeight: 700, color: C.hint }}>{i + 1}</span>}
                                            </div>
                                            <p style={{ fontSize: 9, fontWeight: done ? 700 : 500, color: done ? accentColor : C.hint, textAlign: "center", lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.04em", maxWidth: 56 }}>{STATUS_CFG[step]?.label.split(" ").slice(0, 2).join(" ")}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: 20, padding: "10px 14px", background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                                <p style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                                    {isDelivered ? "Your order has been delivered! 🎉" : order.orderStatus === "OUT_FOR_DELIVERY" ? "Out for delivery today 🛵" : isShipped ? `Shipped via ${order.shipping?.courierName || "courier"}` : cfg.label}
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Shiprocket — ecommerce only */}
                {!isUH && hasShipping && !isCancelled && <div className="od-anim" style={{ animationDelay: "130ms", marginBottom: 14 }}><ShiprocketTrackCard orderId={id} shipping={order.shipping} /></div>}

                {/* Urbexon Hour Express Info */}
                {isUH && !isCancelled && !isDelivered && (
                    <div className="od-anim" style={{ animationDelay: "130ms", marginBottom: 14 }}>
                        <Card style={{ border: "1px solid #ddd6fe", background: "#faf5ff" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 38, height: 38, background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: "#5b21b6" }}>Urbexon Hour Express</p>
                                    <p style={{ fontSize: 12, color: "#7c3aed" }}>Estimated delivery: 45-120 minutes</p>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                <div style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: C.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Delivery</p>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6" }}>{order.delivery?.provider === "LOCAL_RIDER" ? "Local Rider" : order.delivery?.provider === "VENDOR_SELF" ? "Vendor" : "Express"}</p>
                                </div>
                                <div style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: C.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Distance</p>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6" }}>{order.delivery?.distanceKm ? `${order.delivery.distanceKm.toFixed(1)} km` : "—"}</p>
                                </div>
                                <div style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: C.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>ETA</p>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6" }}>{order.delivery?.eta ? `${order.delivery.eta} min` : "45-120 min"}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Delivery OTP — shown to customer when OUT_FOR_DELIVERY */}
                {order?.orderStatus === "OUT_FOR_DELIVERY" && deliveryOtp && (
                    <div className="od-anim" style={{ animationDelay: "135ms", marginBottom: 14 }}>
                        <Card style={{ border: "2px dashed #f59e0b", background: "#fffbeb", textAlign: "center", padding: "24px 20px" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                                🔐 Delivery OTP
                            </div>
                            <div style={{ fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 900, color: "#1e293b", letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", margin: "10px 0", wordBreak: "break-all" }}>
                                {deliveryOtp}
                            </div>
                            <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
                                Share this OTP with the delivery partner to confirm delivery. <strong>Do not share before receiving your order.</strong>
                            </p>
                        </Card>
                    </div>
                )}

                {/* Items */}
                <div className="od-anim" style={{ animationDelay: "160ms", marginBottom: 14 }}>
                    <Card>
                        <STitle>Ordered Items</STitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {order.items.map((item, idx) => {
                                const img = getItemImage(item);
                                return (
                                    <div key={idx} className="od-item" style={{ animationDelay: `${160 + idx * 50}ms`, display: "flex", alignItems: "center", gap: 12, background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${C.borderL}` }}>
                                        <div style={{ width: 56, height: 56, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {img ? <img src={img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} onError={e => { e.target.style.display = "none"; }} /> : <FaGift size={18} color={C.hint} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                            <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Qty: <b style={{ color: C.text }}>{item.qty}</b> × <b style={{ color: C.text }}>₹{item.price.toLocaleString("en-IN")}</b></p>
                                            {item.selectedSize && <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#d97706", padding: "2px 9px", borderRadius: 99, border: "1px solid #fde68a", textTransform: "uppercase" }}>Size: {item.selectedSize}</span>}
                                        </div>
                                        <p style={{ fontWeight: 800, fontSize: 15, color: C.text, flexShrink: 0 }}>₹{(item.qty * item.price).toLocaleString("en-IN")}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Price + Delivery */}
                <div className="od-anim od-grid2" style={{ animationDelay: "200ms", marginBottom: 14 }}>
                    <Card>
                        <STitle>Price Summary</STitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}><span>Items Total</span><span style={{ fontWeight: 600, color: C.text }}>₹{order.items.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString("en-IN")}</span></div>
                            {Number(order.platformFee) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}><span>Platform Fee</span><span style={{ fontWeight: 600, color: C.text }}>₹{Number(order.platformFee).toLocaleString("en-IN")}</span></div>}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}><span>Delivery</span>{Number(order.deliveryCharge) > 0 ? <span style={{ fontWeight: 600, color: C.text }}>₹{Number(order.deliveryCharge).toLocaleString("en-IN")}</span> : <span style={{ fontWeight: 700, color: C.green }}>FREE</span>}</div>
                            <div style={{ height: 1, background: C.border }} />
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>Total</span><span style={{ fontWeight: 900, fontSize: 20, color: C.blue }}>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.hint }}><span>Payment</span><span style={{ fontWeight: 600, color: C.muted }}>{isRazorpay ? "Online Paid" : "Cash on Delivery"}</span></div>
                        </div>
                    </Card>
                    <Card>
                        <STitle>Delivery Info</STitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[{ icon: <FaUser size={10} />, text: order.customerName }, { icon: <FaPhone size={10} />, text: order.phone }, { icon: <FaMapMarkerAlt size={10} />, text: order.address }].map(({ icon, text }, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                    <div style={{ width: 26, height: 26, background: C.blueBg, border: `1px solid ${C.blueMid}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.blue, marginTop: 1 }}>{icon}</div>
                                    <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Live Rider Location — shows when OUT_FOR_DELIVERY via WebSocket */}
                {riderLocation && order?.orderStatus === "OUT_FOR_DELIVERY" && (
                    <div className="od-anim" style={{ animationDelay: "200ms", marginBottom: 14 }}>
                        <Card style={{ border: `1px solid ${C.blueMid}`, background: C.blueBg }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <STitle style={{ color: C.blue }}>🛵 Rider Live Location</STitle>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#dcfce7", border: "1px solid #86efac", padding: "3px 10px", borderRadius: 20, animation: "pulse 2s infinite" }}>LIVE</span>
                            </div>
                            <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}"}</style>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏍️</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{riderLocation.riderName || "Delivery Partner"}</div>
                                    <div style={{ fontSize: 11, color: C.muted }}>
                                        {(deliveryStatus || order?.delivery?.status) === "ARRIVING_VENDOR" ? "Heading to store" :
                                            (deliveryStatus || order?.delivery?.status) === "PICKED_UP" ? "Picked up your order" :
                                                "On the way to you"}
                                    </div>
                                </div>
                            </div>

                            <LiveTrackingMap
                                riderLat={riderLocation.lat}
                                riderLng={riderLocation.lng}
                                riderName={riderLocation.riderName || "Delivery Partner"}
                                destLat={order?.latitude}
                                destLng={order?.longitude}
                                destLabel={order?.address || "Delivery Address"}
                                height="clamp(180px, 30vw, 240px)"
                                lastUpdated={riderLocation.at}
                            />

                            <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: "center" }}>
                                Last updated: {riderLocation.at ? new Date(riderLocation.at).toLocaleTimeString("en-IN") : "Just now"}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Delivery Status Tracker — granular rider progress */}
                {order?.delivery?.assignedTo && ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order?.orderStatus) && (() => {
                    const ds = deliveryStatus || order?.delivery?.status;
                    const steps = [
                        { key: "ASSIGNED", label: "Rider Assigned", icon: "✓" },
                        { key: "ARRIVING_VENDOR", label: "Heading to Store", icon: "🏪" },
                        { key: "PICKED_UP", label: "Order Picked Up", icon: "📦" },
                        { key: "OUT_FOR_DELIVERY", label: "On the Way", icon: "🛵" },
                    ];
                    const currentIdx = steps.findIndex(s => s.key === ds);
                    return (
                        <div className="od-anim" style={{ animationDelay: "220ms", marginBottom: 14 }}>
                            <Card>
                                <STitle>Delivery Progress</STitle>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {steps.map((step, i) => (
                                        <div key={step.key} style={{
                                            flex: 1, minWidth: 70, padding: "8px 6px", textAlign: "center",
                                            background: i < currentIdx ? "#d1fae5" : i === currentIdx ? C.blueBg : "#f8fafc",
                                            border: `1px solid ${i === currentIdx ? C.blue : i < currentIdx ? "#86efac" : C.border}`,
                                            borderRadius: 8, fontSize: 10, fontWeight: 700,
                                            color: i < currentIdx ? "#065f46" : i === currentIdx ? C.blue : C.hint,
                                        }}>
                                            <div style={{ fontSize: 16, marginBottom: 2 }}>{step.icon}</div>
                                            {step.label}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    );
                })()}

                {/* Rider contact info when OUT_FOR_DELIVERY */}
                {order?.orderStatus === "OUT_FOR_DELIVERY" && order?.delivery?.riderPhone && (
                    <div style={{ marginBottom: 14 }}>
                        <Card style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>Your Delivery Partner</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{order.delivery.riderName}</div>
                                </div>
                                <a
                                    href={`tel:${order.delivery.riderPhone}`}
                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#16a34a", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                                >
                                    📞 Call Rider
                                </a>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Cancel */}
                {canCancel && (
                    <div className="od-anim" style={{ animationDelay: "240ms", marginBottom: 14 }}>
                        <Card style={{ border: "1px solid #fecaca" }}>
                            <STitle>Cancel Order</STitle>
                            <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>You can cancel this order since it hasn't been packed yet.{isRazorpay && isPaid && <span style={{ display: "block", marginTop: 6, color: C.amber, fontWeight: 600, fontSize: 12 }}>⚡ Refund will be automatically requested after cancellation.</span>}</p>
                            {cancelError && <p style={{ color: C.red, fontSize: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>{cancelError}</p>}
                            {confirmCancel ? (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={handleCancel} disabled={cancelling} className="od-btn" style={{ flex: 1, padding: "12px", background: C.red, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                        {cancelling ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "od-spin 0.8s linear infinite", display: "inline-block" }} />Cancelling...</> : "Yes, Cancel Order"}
                                    </button>
                                    <button onClick={() => { setConfirmCancel(false); setCancelError(""); }} className="od-btn" style={{ flex: 1, padding: "12px", background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>Keep Order</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmCancel(true)} className="od-btn" style={{ width: "100%", padding: "12px", background: "transparent", border: "2px solid #fecaca", color: C.red, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>Cancel Order</button>
                            )}
                        </Card>
                    </div>
                )}

                {/* Refund */}
                {canRequestRefund && (
                    <div className="od-anim" style={{ animationDelay: "270ms", marginBottom: 14 }}>
                        <Card style={{ border: `1px solid ${C.blueMid}` }}>
                            <STitle>Request Refund</STitle>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.blueBg, border: `1px solid ${C.blueMid}`, borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
                                <FaInfoCircle size={12} color={C.blue} style={{ marginTop: 1, flexShrink: 0 }} />
                                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Your payment of <b style={{ color: C.blue }}>₹{Number(order.totalAmount).toLocaleString("en-IN")}</b> will be refunded within <b style={{ color: C.blue }}>5-7 business days</b> after admin approval.</p>
                            </div>
                            {refundError && <p style={{ color: C.red, fontSize: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>{refundError}</p>}
                            {showRefundForm ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Reason for refund (optional)..." rows={3} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={handleRefundRequest} disabled={requestingRefund} className="od-btn" style={{ flex: 1, padding: "12px", background: C.blue, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                            {requestingRefund ? <><FaSpinner size={11} style={{ animation: "od-spin 0.8s linear infinite" }} />Submitting...</> : <><FaUndo size={11} />Submit Request</>}
                                        </button>
                                        <button onClick={() => { setShowRefundForm(false); setRefundError(""); }} className="od-btn" style={{ padding: "12px 20px", background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowRefundForm(true)} className="od-btn" style={{ width: "100%", padding: "12px", background: "transparent", border: `2px solid ${C.blueMid}`, color: C.blue, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    <FaUndo size={11} /> Request Refund
                                </button>
                            )}
                        </Card>
                    </div>
                )}

                {/* CTA */}
                <div className="od-anim" style={{ animationDelay: "300ms" }}>
                    <Link to="/" className="od-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "15px 0", background: C.blue, color: "#fff", borderRadius: 16, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: `0 4px 20px ${C.blue}30` }}>
                        <FaShoppingBag size={14} /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;