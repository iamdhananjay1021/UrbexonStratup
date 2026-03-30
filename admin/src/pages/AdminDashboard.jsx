import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import api from "../api/adminApi";
import {
    FiPackage, FiShoppingBag, FiPlusCircle, FiDollarSign,
    FiTruck, FiCheckCircle, FiClock, FiArrowRight,
    FiMail, FiPhone, FiTag, FiChevronDown, FiChevronRight,
    FiMapPin,
} from "react-icons/fi";

/* ── Design tokens ── */
const T = {
    blue: "#2563eb",
    blueBg: "#eff6ff",
    blueMid: "#dbeafe",
    text: "#1e293b",
    sub: "#334155",
    muted: "#475569",
    hint: "#94a3b8",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    bg: "#f8fafc",
    white: "#ffffff",
    green: "#10b981",
    amber: "#f59e0b",
    sky: "#0ea5e9",
    red: "#ef4444",
    violet: "#8b5cf6",
    orange: "#f97316",
};

/* ── India map helpers ── */
const SVG_W = 360, SVG_H = 260;
const PAD = { top: 12, right: 16, bottom: 12, left: 16 };
const BOUNDS = { minLat: 8.0, maxLat: 37.5, minLng: 68.0, maxLng: 97.5 };
const toPos = (lat, lng) => ({
    x: PAD.left + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (SVG_W - PAD.left - PAD.right),
    y: PAD.top + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (SVG_H - PAD.top - PAD.bottom),
});
const SHOP = toPos(26.8467, 80.9462);
const CITY_LABELS = [
    { name: "Delhi", lat: 28.6, lng: 77.2 },
    { name: "Mumbai", lat: 19.0, lng: 72.8 },
    { name: "Lucknow", lat: 26.8, lng: 80.9 },
    { name: "Kolkata", lat: 22.6, lng: 88.4 },
];

const STATUS_CFG = {
    PLACED: { label: "Placed", color: T.amber },
    CONFIRMED: { label: "Confirmed", color: T.blue },
    PACKED: { label: "Packed", color: T.violet },
    SHIPPED: { label: "Shipped", color: T.sky },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: T.orange },
    DELIVERED: { label: "Delivered", color: T.green },
};

/* ── Skeleton ── */
const Sk = ({ h = 40, w = "100%" }) => (
    <div style={{ height: h, width: w, background: T.borderLight, borderRadius: 8, animation: "ux-pulse 1.6s ease-in-out infinite" }} />
);

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, accent, loading }) => (
    <div style={{
        background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: "16px 18px", borderTop: `3px solid ${accent}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
        {loading ? <Sk h={52} /> : (
            <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: T.hint, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                    <div style={{ width: 30, height: 30, background: `${accent}18`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                        <Icon size={14} />
                    </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.5px" }}>{value}</div>
            </>
        )}
    </div>
);

/* ── Card wrapper ── */
const Card = ({ children, style = {} }) => (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", ...style }}>
        {children}
    </div>
);
const CardHeader = ({ children }) => (
    <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {children}
    </div>
);

/* ═══════════════════════════════════════════════ */
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [customerLocations, setCustomerLocations] = useState([]);
    const [cityStats, setCityStats] = useState([]);
    const [queries, setQueries] = useState([]);
    const [expandedQuery, setExpandedQuery] = useState(null);

    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingQueries, setLoadingQueries] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            const call = async (url) => {
                try { const res = await api.get(url); return res.data; }
                catch (e) {
                    if (e?.response?.status === 401 && mounted.current) setSessionExpired(true);
                    return null;
                }
            };

            const [ordersRes, products, users, contactData] = await Promise.all([
                call("/orders?limit=1000&page=1"),
                call("/products"),
                call("/auth/users"),
                call("/contact"),
            ]);

            if (!mounted.current) return;

            const orders = Array.isArray(ordersRes)
                ? ordersRes
                : Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
            const totalOrderCount = ordersRes?.total ?? orders.length;

            if (ordersRes !== null) {
                const delivered = orders.filter(o => o.orderStatus === "DELIVERED");
                const pending = orders.filter(o => o.orderStatus === "PLACED");
                const inTransit = orders.filter(o => ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus));
                const localDispatch = orders.filter(o => o.delivery?.type === "URBEXON_HOUR" && !["DELIVERED", "CANCELLED"].includes(o.orderStatus)).length;
                setStats({
                    totalOrders: totalOrderCount,
                    revenue: delivered.reduce((s, o) => s + (o.totalAmount || 0), 0),
                    pending: pending.length,
                    delivered: delivered.length,
                    inTransit: inTransit.length,
                    localDispatch,
                    totalProducts: Array.isArray(products) ? products.length : 0,
                });
                setRecentOrders(orders.slice(0, 6));
            } else {
                setStats(prev => prev ?? { totalOrders: 0, revenue: 0, pending: 0, delivered: 0, inTransit: 0, localDispatch: 0, totalProducts: 0 });
            }
            setLoadingOrders(false);

            if (Array.isArray(products)) {
                setStats(prev => prev
                    ? { ...prev, totalProducts: products.length }
                    : { totalOrders: 0, revenue: 0, pending: 0, delivered: 0, inTransit: 0, localDispatch: 0, totalProducts: products.length }
                );
            }
            setLoadingProducts(false);

            if (Array.isArray(users)) {
                const withLoc = users.filter(u => u.location?.latitude && u.location?.city);
                setCustomerLocations(withLoc);
                const cityMap = {};
                withLoc.forEach(u => { cityMap[u.location.city] = (cityMap[u.location.city] || 0) + 1; });
                setCityStats(
                    Object.entries(cityMap)
                        .map(([city, count]) => ({ city, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 6)
                );
            }
            setLoadingUsers(false);

            if (Array.isArray(contactData)) setQueries(contactData);
            setLoadingQueries(false);
        };

        fetchAll();
    }, []);

    const markAsRead = useCallback(async (id) => {
        const query = queries.find(q => q._id === id);
        if (!query || query.isRead) return;
        setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: true } : q));
        try { await api.patch(`/contact/${id}/read`); }
        catch { setQueries(prev => prev.map(q => q._id === id ? { ...q, isRead: false } : q)); }
    }, [queries]);

    const unreadCount = useMemo(() => queries.filter(q => !q.isRead).length, [queries]);
    const maxCityCount = useMemo(() => cityStats[0]?.count || 1, [cityStats]);
    const overallLoading = loadingOrders || loadingProducts;

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @keyframes ux-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                .ux-qrow:hover       { background: ${T.bg} !important; }
                .ux-order-row:hover  { background: ${T.bg} !important; }
                .ux-qa-card          { transition: all 0.18s; text-decoration: none; }
                .ux-qa-card:hover    { border-color: ${T.blueMid} !important; box-shadow: 0 4px 16px rgba(37,99,235,0.09) !important; transform: translateY(-2px); }

                /* ── Responsive ── */
                .ux-stat-grid   { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
                .ux-mini-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
                .ux-qa-grid     { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
                .ux-map-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: stretch; }

                @media (max-width: 900px) {
                    .ux-stat-grid  { grid-template-columns: repeat(2,1fr) !important; }
                    .ux-qa-grid    { grid-template-columns: repeat(2,1fr) !important; }
                }
                @media (max-width: 640px) {
                    .ux-stat-grid  { grid-template-columns: repeat(2,1fr) !important; }
                    .ux-mini-grid  { grid-template-columns: repeat(3,1fr) !important; }
                    .ux-qa-grid    { grid-template-columns: repeat(2,1fr) !important; }
                    .ux-map-grid   { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 400px) {
                    .ux-stat-grid  { grid-template-columns: 1fr !important; }
                    .ux-mini-grid  { grid-template-columns: 1fr !important; }
                    .ux-qa-grid    { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* ── Page header ── */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 21, fontWeight: 700, color: T.text, margin: 0 }}>Dashboard</h1>
                <p style={{ fontSize: 12, color: T.hint, marginTop: 3 }}>
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {/* ── Session expired ── */}
            {sessionExpired && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: T.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>⚠ Session expired. Please login again.</span>
                    <Link to="/admin/login" style={{ background: T.red, color: T.white, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>LOGIN</Link>
                </div>
            )}

            {/* ── Stat cards ── */}
            <div className="ux-stat-grid" style={{ marginBottom: 10 }}>
                <StatCard icon={FiDollarSign} label="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString("en-IN")}`} accent={T.green} loading={loadingOrders} />
                <StatCard icon={FiShoppingBag} label="Total Orders" value={stats?.totalOrders ?? 0} accent={T.blue} loading={loadingOrders} />
                <StatCard icon={FiPackage} label="Products" value={stats?.totalProducts ?? 0} accent={T.amber} loading={loadingProducts} />
                <StatCard icon={FiClock} label="Pending" value={stats?.pending ?? 0} accent={T.red} loading={loadingOrders} />
            </div>

            {/* ── Mini status row ── */}
            {!overallLoading && stats && (
                <div className="ux-mini-grid" style={{ marginBottom: 16 }}>
                    {[
                        { label: "Delivered", value: stats.delivered, icon: FiCheckCircle, accent: T.green },
                        { label: "In Transit", value: stats.inTransit, icon: FiTruck, accent: T.sky },
                        { label: "Local Dispatch", value: stats.localDispatch, icon: FiTruck, accent: T.orange },
                    ].map(({ label, value, icon: Icon, accent }) => (
                        <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                            <div>
                                <div style={{ fontSize: 10, color: T.hint, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 3 }}>{value}</div>
                            </div>
                            <div style={{ color: accent, opacity: 0.8 }}><Icon size={20} /></div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Quick actions ── */}
            <div className="ux-qa-grid" style={{ marginBottom: 20 }}>
                {[
                    { to: "/admin/orders", icon: FiShoppingBag, label: "Orders", desc: "Update status", accent: T.blue },
                    { to: "/admin/products/new", icon: FiPlusCircle, label: "Add Product", desc: "Upload & price", accent: T.green },
                    { to: "/admin/local-delivery", icon: FiTruck, label: "Local Delivery", desc: "Assign riders", accent: T.orange },
                    { to: "/admin/banners", icon: FiTag, label: "Banners", desc: "Homepage banners", accent: "#ec4899" },
                ].map(({ to, icon: Icon, label, desc, accent }) => (
                    <Link key={to} to={to} className="ux-qa-card" style={{
                        display: "flex", flexDirection: "column", padding: "14px 13px", gap: 8,
                        background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
                        borderTop: `3px solid ${accent}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}>
                        <div style={{ width: 32, height: 32, background: `${accent}18`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                            <Icon size={15} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{label}</div>
                            <div style={{ fontSize: 11, color: T.hint, marginTop: 1 }}>{desc}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: accent }}>
                            Open <FiArrowRight size={10} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── City stats + Map — align-items: start prevents height stretching ── */}
            <div className="ux-map-grid" style={{ marginBottom: 16 }}>

                {/* City stats */}
                <Card style={{ display: "flex", flexDirection: "column" }}>
                    <CardHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <FiMapPin size={13} color={T.amber} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Customers by City</span>
                        </div>
                        <span style={{ fontSize: 11, color: T.hint }}>{customerLocations.length} tracked</span>
                    </CardHeader>
                    <div style={{ padding: "10px 18px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: cityStats.length === 0 ? "center" : "flex-start" }}>
                        {loadingUsers ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {[0, 1, 2, 3].map(i => <Sk key={i} h={24} />)}
                            </div>
                        ) : cityStats.length === 0 ? (
                            <div style={{ textAlign: "center", color: T.hint, fontSize: 13 }}>
                                <FiMapPin size={22} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                                No location data yet
                            </div>
                        ) : cityStats.map(({ city, count }) => (
                            <div key={city} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: T.sub }}>{city}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>{count}</span>
                                </div>
                                <div style={{ height: 4, background: T.borderLight, borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        background: `linear-gradient(90deg, ${T.blue}, ${T.violet})`,
                                        width: `${(count / maxCityCount) * 100}%`,
                                        borderRadius: 4,
                                        transition: "width 0.6s ease"
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Map */}
                <Card>
                    <CardHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <FiMapPin size={13} color={T.red} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Customer Map</span>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            {[{ color: T.amber, label: "Shop" }, { color: T.blue, label: "Customer" }].map(({ color, label }) => (
                                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.hint }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} /> {label}
                                </span>
                            ))}
                        </div>
                    </CardHeader>
                    <div style={{ padding: "10px 12px 12px" }}>
                        {loadingUsers ? <Sk h={220} /> : (
                            <svg
                                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                                preserveAspectRatio="xMidYMid meet"
                                style={{ width: "100%", maxHeight: 260, display: "block", borderRadius: 8, background: T.bg }}
                            >
                                {/* India outline */}
                                <path
                                    d="M160,16 L200,12 L240,22 L270,36 L290,62 L300,90 L308,118 L316,146 L312,172 L306,198 L295,222 L280,244 L262,262 L248,282 L238,304 L226,326 L215,348 L205,368 L196,350 L185,328 L173,305 L160,280 L146,255 L130,232 L115,208 L103,183 L92,156 L86,128 L86,100 L92,75 L108,54 L130,36 L160,16 Z"
                                    fill="rgba(37,99,235,0.05)"
                                    stroke="rgba(37,99,235,0.18)"
                                    strokeWidth="1"
                                />
                                {/* Grid lines */}
                                {[0, 1, 2, 3].map(i => (
                                    <line key={`h${i}`} x1={PAD.left} y1={PAD.top + i * 65} x2={SVG_W - PAD.right} y2={PAD.top + i * 65} stroke={T.border} strokeWidth="0.5" />
                                ))}
                                {/* City labels */}
                                {CITY_LABELS.map(({ name, lat, lng }) => {
                                    const p = toPos(lat, lng);
                                    return <text key={name} x={p.x} y={p.y + 12} textAnchor="middle" fontSize="7" fill={T.hint} fontWeight="500">{name}</text>;
                                })}
                                {/* Customer dots */}
                                {customerLocations.slice(0, 40).map((user, i) => {
                                    const p = toPos(user.location.latitude, user.location.longitude);
                                    return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={T.blue} stroke="rgba(37,99,235,0.25)" strokeWidth="2" opacity="0.7" />;
                                })}
                                {/* Shop marker */}
                                <circle cx={SHOP.x} cy={SHOP.y} r="7" fill={T.amber} stroke={T.white} strokeWidth="1.5" />
                                <text x={SHOP.x} y={SHOP.y + 3.5} textAnchor="middle" fontSize="6.5" fill={T.white} fontWeight="bold">S</text>
                            </svg>
                        )}
                    </div>
                </Card>
            </div>

            {/* ── Customer Queries ── */}
            <Card style={{ marginBottom: 16 }}>
                <CardHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <FiMail size={13} color={T.blue} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Customer Queries</span>
                        {unreadCount > 0 && (
                            <span style={{ background: T.red, color: T.white, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 11, color: T.hint }}>{queries.length} total</span>
                </CardHeader>
                {loadingQueries ? (
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        {[0, 1, 2].map(i => <Sk key={i} h={48} />)}
                    </div>
                ) : queries.length === 0 ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: T.hint, fontSize: 13 }}>
                        <FiMail size={22} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                        No queries yet
                    </div>
                ) : queries.slice(0, 10).map(query => {
                    const isExpanded = expandedQuery === query._id;
                    return (
                        <div key={query._id} className="ux-qrow" style={{ borderBottom: `1px solid ${T.borderLight}`, background: query.isRead ? "transparent" : T.blueBg, transition: "background 0.15s" }}>
                            <div
                                onClick={() => { setExpandedQuery(isExpanded ? null : query._id); if (!query.isRead) markAsRead(query._id); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", cursor: "pointer" }}
                            >
                                <div style={{ width: 32, height: 32, background: query.isRead ? T.bg : T.blueMid, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <FiMail size={13} color={query.isRead ? T.hint : T.blue} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{query.name}</span>
                                        {!query.isRead && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, display: "inline-block" }} />}
                                        {query.subject && (
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "#92400e", background: "#fef3c7", padding: "1px 7px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                                                <FiTag size={8} /> {query.subject}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 11.5, color: T.hint, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 }}>
                                        {query.message}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, color: T.hint }}>
                                        {new Date(query.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </div>
                                    {isExpanded
                                        ? <FiChevronDown size={12} style={{ color: T.hint, marginTop: 3 }} />
                                        : <FiChevronRight size={12} style={{ color: T.hint, marginTop: 3 }} />}
                                </div>
                            </div>
                            {isExpanded && (
                                <div style={{ margin: "0 18px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 8 }}>
                                        <a href={`mailto:${query.email}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.blue, textDecoration: "none", fontWeight: 600 }}>
                                            <FiMail size={11} /> {query.email}
                                        </a>
                                        {query.phone && (
                                            <a href={`tel:${query.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.green, textDecoration: "none", fontWeight: 600 }}>
                                                <FiPhone size={11} /> {query.phone}
                                            </a>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: 0 }}>{query.message}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </Card>

            {/* ── Recent Orders ── */}
            <Card>
                <CardHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <FiShoppingBag size={13} color={T.blue} />
                        <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>Recent Orders</span>
                    </div>
                    <Link to="/admin/orders" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: T.blue, textDecoration: "none" }}>
                        View All <FiArrowRight size={11} />
                    </Link>
                </CardHeader>
                {loadingOrders ? (
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        {[0, 1, 2].map(i => <Sk key={i} h={48} />)}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: T.hint, fontSize: 13 }}>
                        <FiShoppingBag size={22} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                        No orders yet
                    </div>
                ) : recentOrders.map(order => {
                    const cfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.PLACED;
                    return (
                        <div key={order._id} className="ux-order-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${T.borderLight}`, transition: "background 0.12s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 34, height: 34, background: T.blueBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiShoppingBag size={13} color={T.blue} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>#{order._id.slice(-6).toUpperCase()}</div>
                                    <div style={{ fontSize: 11, color: T.hint, marginTop: 1 }}>{order.customerName}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}28`, padding: "3px 9px", borderRadius: 20 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} /> {cfg.label}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: 13, color: T.green }}>
                                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </Card>
        </div>
    );
};

export default AdminDashboard;
