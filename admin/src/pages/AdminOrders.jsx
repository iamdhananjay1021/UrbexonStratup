/**
 * AdminOrders.jsx — Production Ready
 *
 * FIXES:
 * ✅ Invoice URL: /api/invoice/:orderId/download (was /orders/:id/invoice — WRONG)
 * ✅ Label/Manifest: Mock mode → shows info toast instead of opening 404 URL
 * ✅ Shipment: Auto-suggest on CONFIRMED, manual create anytime
 * ✅ White/Blue theme — matches existing UI
 * ✅ Fully responsive
 * ✅ Shiprocket full panel: AWB, Courier, Track, Pickup, Label, Manifest
 */

import { useEffect, useState, useCallback } from "react";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl";
import {
    FiRefreshCw, FiUser, FiPhone, FiMapPin, FiPackage,
    FiChevronDown, FiSearch, FiX, FiCheckCircle, FiClock,
    FiFileText, FiLoader, FiRotateCcw, FiTruck, FiAlertCircle,
    FiExternalLink, FiPrinter, FiCalendar, FiNavigation,
    FiInfo,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

/* ── Tokens ── */
const T = {
    bg: "#f8fafc", white: "#ffffff", surfaceAlt: "#f1f5f9",
    border: "#e2e8f0", borderLight: "#f1f5f9",
    blue: "#2563eb", blueBg: "#eff6ff", blueMid: "#dbeafe",
    text: "#1e293b", sub: "#334155", muted: "#475569", hint: "#94a3b8",
    green: "#10b981", amber: "#f59e0b", sky: "#0ea5e9",
    red: "#ef4444", violet: "#8b5cf6", orange: "#f97316",
};

const STATUS_CONFIG = {
    PLACED: { label: "Placed", color: T.amber, bg: "#fef3c7" },
    CONFIRMED: { label: "Confirmed", color: T.blue, bg: T.blueBg },
    PACKED: { label: "Packed", color: T.violet, bg: "#f5f3ff" },
    SHIPPED: { label: "Shipped", color: T.sky, bg: "#f0f9ff" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: T.orange, bg: "#fff7ed" },
    DELIVERED: { label: "Delivered", color: T.green, bg: "#f0fdf4" },
    CANCELLED: { label: "Cancelled", color: T.red, bg: "#fef2f2" },
};

const FLOW = {
    PLACED: "CONFIRMED", CONFIRMED: "PACKED", PACKED: "SHIPPED",
    SHIPPED: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED",
};
const FLOW_STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const PAGE_LIMIT = 20;

/* ── Toast ── */
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
            maxWidth: 340, animation: "ao-fadeUp .2s ease",
        }}>
            {isErr ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
            {toast.msg}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLACED;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`, padding: "3px 10px", borderRadius: 99 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />{cfg.label}
        </span>
    );
};

/* ════════════════════════════════════════════
   SHIPROCKET PANEL
   KEY LOGIC:
   - Mock mode: label/manifest show info message (not fake URL)
   - Real mode: opens actual Shiprocket PDF
   - Shipment auto-suggested when order is CONFIRMED
════════════════════════════════════════════ */
const ShiprocketPanel = ({ order, onOrderUpdate, globalToast }) => {
    const shipping = order.shipping;
    const hasShipment = !!shipping?.shipmentId;
    const isMock = shipping?.mock;
    const isConfirmed = order.orderStatus === "CONFIRMED";
    const isPacked = order.orderStatus === "PACKED";
    const isShipped = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus);

    const [creating, setCreating] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState(false);
    const [loadingManifest, setLoadingManifest] = useState(false);
    const [tracking, setTracking] = useState(null);
    const [loadingTrack, setLoadingTrack] = useState(false);
    const [weight, setWeight] = useState(500);

    // ── Create Shipment ──────────────────────────
    const createShipment = async () => {
        try {
            setCreating(true);
            const { data } = await api.post(`/shiprocket/create/${order._id}`, { weight });
            onOrderUpdate(order._id, {
                ...order,
                shipping: {
                    shipmentId: String(data.shipment_id),
                    awbCode: data.awb_code,
                    courierName: data.courier_name,
                    trackingUrl: data.tracking_url,
                    labelUrl: data.label_url || "",
                    status: "CREATED",
                    mock: data.mock,
                },
                orderStatus: order.orderStatus === "CONFIRMED" || order.orderStatus === "PACKED" ? "SHIPPED" : order.orderStatus,
            });
            globalToast("success", `✅ Shipment created! AWB: ${data.awb_code}`);
        } catch (err) {
            globalToast("error", err.response?.data?.message || "Failed to create shipment");
        } finally { setCreating(false); }
    };

    // ── Schedule Pickup ──────────────────────────
    const schedulePickup = async () => {
        try {
            setScheduling(true);
            await api.post(`/shiprocket/pickup/${order._id}`);
            globalToast("success", "📦 Pickup scheduled successfully!");
        } catch (err) {
            globalToast("error", err.response?.data?.message || "Failed to schedule pickup");
        } finally { setScheduling(false); }
    };

    // ── Label: Mock → info toast, Real → open PDF ──
    const openLabel = async () => {
        try {
            setLoadingLabel(true);
            const { data } = await api.get(`/shiprocket/label/${order._id}`);
            if (data.mock || !data.label_url || data.label_url.includes("mock")) {
                globalToast("info", "🔧 Label available once Shiprocket account is connected. Currently in MOCK mode.");
                return;
            }
            window.open(data.label_url, "_blank");
        } catch (err) {
            globalToast("error", err.response?.data?.message || "Failed to get label");
        } finally { setLoadingLabel(false); }
    };

    // ── Manifest: Mock → info toast, Real → open PDF ──
    const openManifest = async () => {
        try {
            setLoadingManifest(true);
            const { data } = await api.get(`/shiprocket/manifest/${order._id}`);
            if (data.mock || !data.manifest_url || data.manifest_url.includes("mock")) {
                globalToast("info", "🔧 Manifest available once Shiprocket account is connected. Currently in MOCK mode.");
                return;
            }
            window.open(data.manifest_url, "_blank");
        } catch (err) {
            globalToast("error", err.response?.data?.message || "Failed to get manifest");
        } finally { setLoadingManifest(false); }
    };

    // ── Live Track ───────────────────────────────
    const fetchTracking = async () => {
        try {
            setLoadingTrack(true);
            const { data } = await api.get(`/shiprocket/track/${order._id}`);
            setTracking(data);
        } catch (err) {
            globalToast("error", err.response?.data?.message || "Tracking not available");
        } finally { setLoadingTrack(false); }
    };

    return (
        <div style={{ background: T.blueBg, border: `1px solid ${T.blueMid}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, background: T.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiTruck size={14} color="#fff" />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.blue, margin: 0 }}>Shiprocket Shipping</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            {isMock && <span style={{ fontSize: 9, fontWeight: 700, color: T.amber, background: "#fef3c7", padding: "1px 7px", borderRadius: 4, border: "1px solid #fde68a" }}>MOCK MODE — Connect account for live</span>}
                            {!isMock && hasShipment && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: "#f0fdf4", padding: "1px 7px", borderRadius: 4, border: "1px solid #bbf7d0" }}>LIVE MODE</span>}
                        </div>
                    </div>
                </div>
                {hasShipment && shipping?.trackingUrl && !isMock && (
                    <a href={shipping.trackingUrl} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: T.blue, textDecoration: "none", background: T.white, border: `1px solid ${T.blueMid}`, padding: "5px 10px", borderRadius: 7 }}>
                        <FiExternalLink size={11} /> Track on Shiprocket
                    </a>
                )}
            </div>

            {/* Suggestion: create shipment when CONFIRMED */}
            {!hasShipment && (isConfirmed || isPacked) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                    <FiInfo size={13} color={T.amber} />
                    <p style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>
                        Order is <b>{STATUS_CONFIG[order.orderStatus]?.label}</b>. Create shipment to assign AWB and notify courier.
                    </p>
                </div>
            )}

            {hasShipment ? (
                <>
                    {/* Info Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 8, marginBottom: 12 }}>
                        {[
                            { label: "AWB Code", value: shipping.awbCode || "Generating...", mono: true },
                            { label: "Courier", value: shipping.courierName || "Standard" },
                            { label: "Shipment ID", value: shipping.shipmentId || "—", mono: true },
                            { label: "Status", value: shipping.status || "CREATED" },
                        ].map(({ label, value, mono }) => (
                            <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: mono ? "'Courier New',monospace" : "inherit", wordBreak: "break-all" }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={schedulePickup} disabled={scheduling}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: scheduling ? 0.7 : 1 }}>
                            {scheduling ? <FiLoader size={11} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiCalendar size={11} />}
                            {scheduling ? "Scheduling..." : "Schedule Pickup"}
                        </button>
                        <button onClick={openLabel} disabled={loadingLabel}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: T.white, border: `1px solid ${T.border}`, color: T.sub, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {loadingLabel ? <FiLoader size={11} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiPrinter size={11} />}
                            Print Label {isMock && <span style={{ fontSize: 9, color: T.hint }}>(Mock)</span>}
                        </button>
                        <button onClick={openManifest} disabled={loadingManifest}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: T.white, border: `1px solid ${T.border}`, color: T.sub, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {loadingManifest ? <FiLoader size={11} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiFileText size={11} />}
                            Manifest {isMock && <span style={{ fontSize: 9, color: T.hint }}>(Mock)</span>}
                        </button>
                        <button onClick={fetchTracking} disabled={loadingTrack}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: T.white, border: `1px solid ${T.border}`, color: T.sub, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            {loadingTrack ? <FiLoader size={11} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiNavigation size={11} />}
                            Live Track
                        </button>
                    </div>

                    {/* Tracking Result */}
                    {tracking && (
                        <div style={{ marginTop: 12, background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Live Status</p>
                                <span style={{ fontSize: 11, fontWeight: 700, color: T.sky, background: "#f0f9ff", padding: "2px 8px", borderRadius: 6 }}>{tracking.label || tracking.status}</span>
                            </div>
                            {tracking.detail && <p style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{tracking.detail}</p>}
                            {isMock && <p style={{ fontSize: 11, color: T.amber, fontStyle: "italic" }}>⚠ Mock tracking data — real data available after Shiprocket connection</p>}
                            {tracking.activities?.length > 0 && !isMock && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {tracking.activities.slice(0, 4).map((act, i) => (
                                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? T.blue : T.border, marginTop: 5, flexShrink: 0 }} />
                                            <div>
                                                <p style={{ fontSize: 12, color: T.sub, fontWeight: 500 }}>{act.activity}</p>
                                                <p style={{ fontSize: 10, color: T.hint }}>{act.location} · {new Date(act.date).toLocaleString("en-IN")}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* No Shipment Yet — Create Form */
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, whiteSpace: "nowrap" }}>Weight (grams):</label>
                            <input type="number" value={weight} onChange={e => setWeight(Math.max(100, Number(e.target.value)))} min={100} step={50}
                                style={{ width: 90, padding: "7px 10px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, color: T.text, outline: "none", fontFamily: "inherit" }} />
                        </div>
                        <button onClick={createShipment} disabled={creating}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: creating ? 0.7 : 1 }}>
                            {creating ? <FiLoader size={11} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiTruck size={11} />}
                            {creating ? "Creating Shipment..." : "Create Shipment"}
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: T.hint, marginTop: 8 }}>
                        💡 <b>When to create:</b> After order is CONFIRMED or PACKED. Shipment creation assigns AWB number and notifies courier for pickup.
                    </p>
                </div>
            )}
        </div>
    );
};

/* ── Refund Card ── */
const RefundCard = ({ order, onRefundUpdate, globalToast }) => {
    const [processing, setProcessing] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const refund = order.refund;
    if (!refund || refund.status === "NONE") return null;
    const statusColor = { REQUESTED: T.amber, PROCESSING: T.blue, PROCESSED: T.green, REJECTED: T.red, FAILED: T.red };
    const sc = statusColor[refund.status] || T.hint;

    const handleApprove = async () => {
        try {
            setProcessing(true);
            await api.put(`/orders/${order._id}/refund/process`, { action: "approve" });
            onRefundUpdate(order._id, { ...order, refund: { ...refund, status: "PROCESSED" } });
            globalToast("success", "Refund approved and processed!");
        } catch (err) { globalToast("error", err.response?.data?.message || "Refund failed"); }
        finally { setProcessing(false); }
    };
    const handleReject = async () => {
        try {
            setRejecting(true);
            await api.put(`/orders/${order._id}/refund/process`, { action: "reject", rejectionReason: rejectNote });
            onRefundUpdate(order._id, { ...order, refund: { ...refund, status: "REJECTED", rejectionReason: rejectNote } });
            setShowRejectInput(false);
            globalToast("success", "Refund rejected.");
        } catch (err) { globalToast("error", err.response?.data?.message || "Failed to reject"); }
        finally { setRejecting(false); }
    };

    return (
        <div style={{ background: `${sc}08`, border: `1px solid ${sc}25`, padding: "12px 14px", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: sc, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5 }}>
                    <FiRotateCcw size={10} /> Refund · {refund.status}
                </span>
                <span style={{ fontWeight: 800, fontSize: 14, color: sc }}>₹{Number(refund.amount || order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
            {refund.reason && <p style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Reason: {refund.reason}</p>}
            {refund.status === "REQUESTED" && (
                showRejectInput ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input type="text" value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Rejection reason (optional)"
                            style={{ width: "100%", padding: "8px 10px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={handleReject} disabled={rejecting} style={{ flex: 1, padding: "8px", background: T.red, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{rejecting ? "..." : "Confirm Reject"}</button>
                            <button onClick={() => setShowRejectInput(false)} style={{ padding: "8px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, fontSize: 12, cursor: "pointer" }}>Back</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleApprove} disabled={processing} style={{ flex: 1, padding: "8px", background: T.green, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{processing ? "Processing..." : "✓ Approve Refund"}</button>
                        <button onClick={() => setShowRejectInput(true)} style={{ flex: 1, padding: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: T.red, borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕ Reject</button>
                    </div>
                )
            )}
        </div>
    );
};

const CustomizationCard = ({ customization }) => {
    const hasText = customization?.text?.trim(), hasImage = customization?.imageUrl?.trim(), hasNote = customization?.note?.trim();
    if (!hasText && !hasImage && !hasNote) return null;
    return (
        <div style={{ marginTop: 10, background: "#fef3c7", border: "1px solid #fde68a", padding: "10px 12px", borderRadius: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#92400e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>⚡ Customization Required</p>
            {hasText && <p style={{ fontSize: 12, color: T.text }}><span style={{ color: "#d97706", fontWeight: 700 }}>Print: </span>{customization.text}</p>}
            {hasNote && <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}><span style={{ color: "#d97706", fontWeight: 700 }}>Note: </span>{customization.note}</p>}
            {hasImage && <a href={customization.imageUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6 }}><img src={customization.imageUrl} alt="custom" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 7, border: "1px solid #fde68a" }} /></a>}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
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

    const { toast, show: showToast } = useToast();

    /* ── Toast variants ── */
    const toastInfo = useCallback((msg) => showToast("info", msg, 5000), [showToast]);
    const toastSuccess = useCallback((msg) => showToast("success", msg), [showToast]);
    const toastError = useCallback((msg) => showToast("error", msg), [showToast]);

    const globalToast = useCallback((type, msg) => {
        if (type === "info") toastInfo(msg);
        else if (type === "success") toastSuccess(msg);
        else toastError(msg);
    }, [toastInfo, toastSuccess, toastError]);

    const fetchOrders = useCallback(async ({ page = 1, status = "ALL", search = "" } = {}) => {
        try {
            setError(""); setLoading(true);
            const params = { page, limit: PAGE_LIMIT };
            if (status && status !== "ALL") params.status = status;
            if (search.trim()) params.search = search.trim();
            const { data } = await api.get("/orders", { params });
            const list = Array.isArray(data?.orders) ? data.orders : [];
            setOrders(list); setTotalOrders(data?.total || 0);
            setTotalPages(data?.totalPages || 1); setCurrentPage(data?.page || 1);
        } catch (err) {
            setError(err.response?.status === 403 ? "Access denied." : "Failed to load orders.");
            setOrders([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrders({ page: 1, status: filterStatus, search: searchQuery }); }, []);

    const goToPage = useCallback((page) => { setExpandedId(null); window.scrollTo(0, 0); fetchOrders({ page, status: filterStatus, search: searchQuery }); }, [fetchOrders, filterStatus, searchQuery]);
    const handleFilterChange = useCallback((key) => { setFilterStatus(key); setExpandedId(null); setCurrentPage(1); fetchOrders({ page: 1, status: key, search: searchQuery }); }, [fetchOrders, searchQuery]);
    const handleSearch = useCallback((e) => { e.preventDefault(); setSearchQuery(searchInput); setFilterStatus("ALL"); setCurrentPage(1); fetchOrders({ page: 1, status: "ALL", search: searchInput }); }, [fetchOrders, searchInput]);
    const clearSearch = useCallback(() => { setSearchInput(""); setSearchQuery(""); fetchOrders({ page: 1, status: filterStatus, search: "" }); }, [fetchOrders, filterStatus]);
    const refreshOrders = useCallback(async () => { setRefreshing(true); await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery }); setRefreshing(false); }, [fetchOrders, currentPage, filterStatus, searchQuery]);
    const handleOrderUpdate = useCallback((orderId, updatedOrder) => { setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o)); }, []);

    const updateStatus = useCallback(async (orderId, nextStatus) => {
        if (!nextStatus) return;
        try {
            setUpdatingId(orderId);
            const { data: updated } = await api.put(`/orders/${orderId}`, { status: nextStatus });
            if (updated?._id) setOrders(prev => prev.map(o => o._id === orderId ? updated : o));
            else await fetchOrders({ page: currentPage, status: filterStatus, search: searchQuery });
            toastSuccess(`Order marked as ${STATUS_CONFIG[nextStatus]?.label}`);
        } catch (err) { toastError(err.response?.data?.message || "Failed to update status"); }
        finally { setUpdatingId(null); }
    }, [fetchOrders, currentPage, filterStatus, searchQuery, toastSuccess, toastError]);

    /* ── INVOICE DOWNLOAD ──────────────────────────────────────────────────────
     * ✅ FIXED: Correct URL is /api/invoice/:orderId/download
     * Previously was /orders/:id/invoice which doesn't exist in backend
     * ─────────────────────────────────────────────────────────────────────── */
    const handleDownloadInvoice = useCallback(async (orderId, e) => {
        e.stopPropagation();
        try {
            setDownloadingId(orderId);
            // ✅ CORRECT route: /invoice/:orderId/download
            const response = await api.get(`/invoice/${orderId}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url; link.setAttribute("download", `Urbexon_Invoice_${orderId.slice(-8).toUpperCase()}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
            toastSuccess("Invoice downloaded!");
        } catch (err) {
            const msg = err.response?.status === 404 ? "Invoice route not found — check server.js mounts /api/invoice" : err.response?.data?.message || "Failed to download invoice";
            toastError(msg);
        }
        finally { setDownloadingId(null); }
    }, [toastSuccess, toastError]);

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
        if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
    };

    if (loading && orders.length === 0) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${T.blueMid}`, borderTopColor: T.blue, borderRadius: "50%", animation: "ao-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: T.hint, fontSize: 13 }}>Loading orders...</p>
            </div>
            <style>{`@keyframes ao-spin{to{transform:rotate(360deg)}} @keyframes ao-pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes ao-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );

    const filters = [
        { key: "ALL", label: "All" },
        ...FLOW_STEPS.map(s => ({ key: s, label: STATUS_CONFIG[s]?.label, dot: STATUS_CONFIG[s]?.color })),
        { key: "CANCELLED", label: "Cancelled", dot: STATUS_CONFIG.CANCELLED.color },
    ];

    return (
        <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: T.text }}>
            <style>{`
                @keyframes ao-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
                @keyframes ao-spin{to{transform:rotate(360deg)}}
                @keyframes ao-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .ao-card{transition:border-color .18s,box-shadow .18s;}
                .ao-card:hover{border-color:#bfdbfe !important;box-shadow:0 2px 12px rgba(37,99,235,0.07) !important;}
                .ao-hdr{cursor:pointer;transition:background .12s;}
                .ao-hdr:hover{background:#f8fafc !important;}
                .ao-filter{transition:all .15s;cursor:pointer;}
                .ao-filter:hover{border-color:#93c5fd !important;color:#1d4ed8 !important;}
                .ao-btn{transition:all .15s;}
                .ao-btn:hover{opacity:.85;transform:translateY(-1px);}
                .ao-row{animation:ao-fadeUp .3s ease forwards;}
                button:disabled{cursor:not-allowed;}
            `}</style>

            {/* Toast */}
            <Toast toast={toast} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Orders</h1>
                    <p style={{ fontSize: 13, color: T.hint, marginTop: 3 }}>{totalOrders} total orders</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: 0 }}>
                        <div style={{ position: "relative" }}>
                            <FiSearch size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.hint, pointerEvents: "none" }} />
                            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search name, phone..."
                                style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: T.white, border: `1px solid ${T.border}`, borderRight: "none", borderRadius: "8px 0 0 8px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200 }}
                                onFocus={e => e.currentTarget.style.borderColor = "#93c5fd"} onBlur={e => e.currentTarget.style.borderColor = T.border} />
                            {searchQuery && <button type="button" onClick={clearSearch} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.hint, cursor: "pointer" }}><FiX size={12} /></button>}
                        </div>
                        <button type="submit" style={{ padding: "8px 14px", background: T.blue, border: "none", borderRadius: "0 8px 8px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Search</button>
                    </form>
                    <button onClick={refreshOrders} disabled={refreshing}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        <FiRefreshCw size={13} style={{ animation: refreshing ? "ao-spin 0.8s linear infinite" : "none" }} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
                {filters.map(({ key, label, dot }) => {
                    const active = filterStatus === key;
                    return (
                        <button key={key} onClick={() => handleFilterChange(key)} className="ao-filter"
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, border: active ? `1px solid ${T.blue}` : `1px solid ${T.border}`, background: active ? T.blueBg : T.white, color: active ? T.blue : T.muted, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>
                            {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}{label}
                        </button>
                    );
                })}
            </div>

            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: T.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FiAlertCircle size={13} />{error}</div>}

            {/* Orders */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.length === 0 && !loading ? (
                    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "52px 0", textAlign: "center" }}>
                        <FiPackage size={32} style={{ color: T.hint, marginBottom: 10 }} />
                        <p style={{ color: T.hint, fontSize: 14, fontWeight: 600 }}>No orders found</p>
                    </div>
                ) : orders.map((order, rowIdx) => {
                    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                    const next = FLOW[order.orderStatus];
                    const isCancelled = order.orderStatus === "CANCELLED";
                    const isDelivered = order.orderStatus === "DELIVERED";
                    const isExpanded = expandedId === order._id;
                    const isUpdating = updatingId === order._id;
                    const hasShipping = !!order.shipping?.shipmentId;

                    return (
                        <div key={order._id} className="ao-card ao-row"
                            style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", animationDelay: `${rowIdx * 30}ms` }}>

                            {/* Row Header */}
                            <div className="ao-hdr" onClick={() => setExpandedId(isExpanded ? null : order._id)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", flexWrap: "wrap", gap: 10, background: T.white }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 3, height: 38, background: cfg.color, borderRadius: 3, flexShrink: 0 }} />
                                    <div style={{ width: 38, height: 38, background: cfg.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <FiPackage size={16} color={cfg.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                                            #{order._id.slice(-6).toUpperCase()}
                                            {hasShipping && (
                                                <span style={{ fontSize: 9, fontWeight: 700, color: order.shipping.mock ? T.amber : T.green, background: order.shipping.mock ? "#fef3c7" : "#f0fdf4", padding: "1px 6px", borderRadius: 4, border: `1px solid ${order.shipping.mock ? "#fde68a" : "#bbf7d0"}` }}>
                                                    {order.shipping.mock ? "SR MOCK" : "SR LIVE"}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: T.hint, marginTop: 1 }}>{order.customerName} · {order.phone}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <StatusBadge status={order.orderStatus} />
                                    <span style={{ fontWeight: 800, fontSize: 14, color: T.green }}>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                                    <button onClick={(e) => handleDownloadInvoice(order._id, e)} disabled={downloadingId === order._id}
                                        style={{ padding: "5px 10px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: T.muted, cursor: "pointer" }}>
                                        {downloadingId === order._id ? <FiLoader size={10} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : "PDF"}
                                    </button>
                                    <div style={{ color: T.hint, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}><FiChevronDown size={16} /></div>
                                </div>
                            </div>

                            {/* Expanded Panel */}
                            {isExpanded && (
                                <div style={{ borderTop: `1px solid ${T.borderLight}`, padding: "20px", background: T.bg }}>

                                    {/* Customer Info */}
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.hint, marginBottom: 10 }}>Customer Info</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 8, marginBottom: 20 }}>
                                        {[{ icon: FiUser, label: "Name", value: order.customerName }, { icon: FiPhone, label: "Phone", value: order.phone }, { icon: FiMapPin, label: "Address", value: order.address }].map(({ icon: Icon, label, value }) => (
                                            <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                                                <Icon size={13} color={T.hint} style={{ marginTop: 2 }} />
                                                <div>
                                                    <div style={{ fontSize: 9, color: T.hint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                                                    <div style={{ fontSize: 13, color: T.sub, fontWeight: 500, marginTop: 1 }}>{value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shiprocket Panel */}
                                    <ShiprocketPanel order={order} onOrderUpdate={handleOrderUpdate} globalToast={globalToast} />

                                    {/* Progress */}
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.hint, marginBottom: 12 }}>Order Progress</p>
                                    <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
                                        {FLOW_STEPS.map((step, idx) => {
                                            const stepIdx = FLOW_STEPS.indexOf(order.orderStatus);
                                            const done = idx <= stepIdx, active = idx === stepIdx;
                                            const cfg2 = STATUS_CONFIG[step];
                                            return (
                                                <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? (active ? T.blue : T.blueMid) : T.borderLight, border: done ? `2px solid ${T.blue}` : `2px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: active ? `0 0 0 3px ${T.blueBg}` : "none" }}>
                                                            {done ? <FiCheckCircle size={13} color={active ? "#fff" : T.blue} /> : <FiClock size={11} color={T.hint} />}
                                                        </div>
                                                        <span style={{ fontSize: 8, fontWeight: 600, color: done ? T.blue : T.hint, textAlign: "center", maxWidth: 52, lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{cfg2.label.split(" ")[0]}</span>
                                                    </div>
                                                    {idx < FLOW_STEPS.length - 1 && <div style={{ width: 24, height: 2, background: idx < FLOW_STEPS.indexOf(order.orderStatus) ? T.blue : T.border, margin: "0 2px", marginBottom: 18, borderRadius: 2 }} />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                                        {!isCancelled && next && (
                                            <button onClick={() => updateStatus(order._id, next)} disabled={isUpdating} className="ao-btn"
                                                style={{ padding: "9px 18px", background: T.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                                {isUpdating ? <FiLoader size={12} style={{ animation: "ao-spin 0.8s linear infinite" }} /> : <FiTruck size={13} />}
                                                Mark as {STATUS_CONFIG[next]?.label}
                                            </button>
                                        )}
                                        {!isCancelled && !isDelivered && (
                                            <button onClick={() => updateStatus(order._id, "CANCELLED")} disabled={isUpdating}
                                                style={{ padding: "9px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: T.red, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                                Cancel Order
                                            </button>
                                        )}
                                        {isDelivered && <span style={{ padding: "9px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: T.green, borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><FiCheckCircle size={13} /> Delivered</span>}
                                        {isCancelled && <span style={{ color: T.red, fontWeight: 600, fontSize: 13 }}>Order Cancelled</span>}
                                        {!isCancelled && (
                                            <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your order #${order._id.slice(-6).toUpperCase()} is now ${cfg.label}. Thank you for shopping with UrbeXon! 🛍️`)}`}
                                                target="_blank" rel="noreferrer"
                                                style={{ padding: "9px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                                                <FaWhatsapp size={14} /> WhatsApp
                                            </a>
                                        )}
                                    </div>

                                    {/* Refund */}
                                    {order.refund?.status && order.refund.status !== "NONE" && <RefundCard order={order} onRefundUpdate={handleOrderUpdate} globalToast={globalToast} />}

                                    {/* Items */}
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.hint, marginBottom: 10 }}>Order Items</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <div style={{ width: 48, height: 48, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        {item.image ? <img src={imgUrl.thumbnail(item.image)} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} onError={e => { e.target.style.display = "none"; }} /> : <FiPackage size={16} color={T.hint} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                                            <span style={{ fontSize: 12, color: T.muted }}>Qty: {item.qty}</span>
                                                            {item.selectedSize && <span style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>{item.selectedSize}</span>}
                                                        </div>
                                                    </div>
                                                    <p style={{ fontWeight: 700, fontSize: 14, color: T.text, flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                                                </div>
                                                <CustomizationCard customization={item.customization} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>Total</span>
                                        <span style={{ fontWeight: 800, fontSize: 20, color: T.green }}>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
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
                    <p style={{ fontSize: 13, color: T.hint }}>Showing <b style={{ color: T.text }}>{(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, totalOrders)}</b> of <b style={{ color: T.text }}>{totalOrders}</b></p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ padding: "6px 12px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === 1 ? 0.4 : 1 }}>← Prev</button>
                        {getPageNumbers().map((p, i) => p === "…" ? <span key={`d${i}`} style={{ padding: "0 4px", color: T.hint }}>…</span> : (
                            <button key={p} onClick={() => goToPage(p)} style={{ width: 34, height: 34, background: currentPage === p ? T.blue : T.white, border: currentPage === p ? `1px solid ${T.blue}` : `1px solid ${T.border}`, borderRadius: 7, color: currentPage === p ? "#fff" : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
                        ))}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: "6px 12px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: currentPage === totalPages ? 0.4 : 1 }}>Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;