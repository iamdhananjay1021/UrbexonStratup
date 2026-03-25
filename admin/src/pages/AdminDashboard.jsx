import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import api from "../api/adminApi";
import {
    FiPackage, FiShoppingBag, FiPlusCircle, FiDollarSign,
    FiTruck, FiCheckCircle, FiClock, FiArrowRight,
    FiMail, FiPhone, FiTag, FiChevronDown, FiChevronRight,
    FiMapPin, FiUsers, FiTrendingUp,
} from "react-icons/fi";

/* ── India map helpers ── */
const SVG_W = 360, SVG_H = 400;
const PAD = { top: 16, right: 16, bottom: 16, left: 16 };
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
    PLACED: { label: "Placed", color: "#f59e0b" },
    CONFIRMED: { label: "Confirmed", color: "#3b82f6" },
    PACKED: { label: "Packed", color: "#8b5cf6" },
    SHIPPED: { label: "Shipped", color: "#0ea5e9" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#f97316" },
    DELIVERED: { label: "Delivered", color: "#10b981" },
};

/* ── Skeleton ── */
const Sk = ({ h = 40, w = "100%" }) => (
    <div style={{ height: h, width: w, background: "#f1f5f9", borderRadius: 8, animation: "ux-pulse 1.6s ease-in-out infinite" }} />
);

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, accent, loading }) => (
    <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: "18px 20px", borderTop: `3px solid ${accent}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
        {loading ? <Sk h={56} /> : (
            <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                    <div style={{ width: 32, height: 32, background: `${accent}15`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                        <Icon size={15} />
                    </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.5px" }}>{value}</div>
            </>
        )}
    </div>
);

/* ── Card wrapper ── */
const Card = ({ children, style = {} }) => (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", ...style }}>
        {children}
    </div>
);
const CardHeader = ({ children }) => (
    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

    // ── FIX: separate, correct loading flags ──
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

            // ── Helper: safe GET, returns null on error ──
            const call = async (url) => {
                try {
                    const res = await api.get(url);
                    return res.data;
                } catch (e) {
                    if (e?.response?.status === 401 && mounted.current) setSessionExpired(true);
                    return null;
                }
            };

            // ── Fetch all in parallel ──
            // getAllOrders is PAGINATED: returns { orders:[], total, page, totalPages }
            // Pass limit=1000 to get all orders for dashboard stats
            const [ordersRes, products, users, contactData] = await Promise.all([
                call("/orders?limit=1000&page=1"),
                call("/products"),
                call("/auth/users"),
                call("/contact"),
            ]);

            if (!mounted.current) return;

            // ──────────────────────────────
            // ORDERS — unwrap paginated { orders:[], total } response
            // ──────────────────────────────
            const orders = Array.isArray(ordersRes)
                ? ordersRes
                : Array.isArray(ordersRes?.orders)
                    ? ordersRes.orders
                    : [];

            const totalOrderCount = ordersRes?.total ?? orders.length;

            if (ordersRes !== null) {
                const delivered = orders.filter(o => o.orderStatus === "DELIVERED");
                const pending = orders.filter(o => o.orderStatus === "PLACED");
                const inTransit = orders.filter(o => ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus));

                setStats({
                    totalOrders: totalOrderCount,
                    revenue: delivered.reduce((s, o) => s + (o.totalAmount || 0), 0),
                    pending: pending.length,
                    delivered: delivered.length,
                    inTransit: inTransit.length,
                    totalProducts: Array.isArray(products) ? products.length : 0,
                });

                setRecentOrders(orders.slice(0, 6));
            } else {
                setStats(prev => prev ?? {
                    totalOrders: 0, revenue: 0, pending: 0,
                    delivered: 0, inTransit: 0, totalProducts: 0,
                });
            }
            setLoadingOrders(false);

            // ──────────────────────────────
            // PRODUCTS count
            // ──────────────────────────────
            if (Array.isArray(products)) {
                setStats(prev => prev
                    ? { ...prev, totalProducts: products.length }
                    : { totalOrders: 0, revenue: 0, pending: 0, delivered: 0, inTransit: 0, totalProducts: products.length }
                );
            }
            setLoadingProducts(false);

            // ──────────────────────────────
            // USERS / locations
            // ──────────────────────────────
            if (Array.isArray(users)) {
                const withLoc = users.filter(u => u.location?.latitude && u.location?.city);
                setCustomerLocations(withLoc);

                const cityMap = {};
                withLoc.forEach(u => {
                    cityMap[u.location.city] = (cityMap[u.location.city] || 0) + 1;
                });
                setCityStats(
                    Object.entries(cityMap)
                        .map(([city, count]) => ({ city, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                );
            }
            setLoadingUsers(false);    // ← users done

            // ──────────────────────────────
            // CONTACT QUERIES
            // ──────────────────────────────
            if (Array.isArray(contactData)) setQueries(contactData);
            setLoadingQueries(false);  // ← queries done
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

    // ── FIX: overallLoading is true only while BOTH are still loading ──
    const overallLoading = loadingOrders || loadingProducts;

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
        @keyframes ux-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ux-qrow:hover       { background: #f8fafc !important; }
        .ux-order-row:hover  { background: #f8fafc !important; }
        .ux-quick-card:hover { border-color: #bfdbfe !important; box-shadow: 0 4px 16px rgba(37,99,235,0.08) !important; transform: translateY(-2px); }
        .ux-quick-card       { transition: all 0.2s; text-decoration: none; }
      `}</style>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Dashboard</h1>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Link to="/admin/products" style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                        border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569",
                        fontWeight: 600, fontSize: 13, textDecoration: "none", background: "#fff",
                    }}>
                        <FiPackage size={14} /> Products
                    </Link>
                    <Link to="/admin/products/new" style={{
                        display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                        background: "#2563eb", color: "#fff", borderRadius: 8,
                        fontWeight: 600, fontSize: 13, textDecoration: "none",
                    }}>
                        <FiPlusCircle size={14} /> Add Product
                    </Link>
                </div>
            </div>

            {/* ── Session expired alert ── */}
            {sessionExpired && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>⚠ Session expired. Please login again.</span>
                    <Link to="/admin/login" style={{ background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>LOGIN</Link>
                </div>
            )}

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
                <StatCard icon={FiDollarSign} label="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString("en-IN")}`} accent="#10b981" loading={loadingOrders} />
                <StatCard icon={FiShoppingBag} label="Total Orders" value={stats?.totalOrders ?? 0} accent="#2563eb" loading={loadingOrders} />
                <StatCard icon={FiPackage} label="Products" value={stats?.totalProducts ?? 0} accent="#f59e0b" loading={loadingProducts} />
                <StatCard icon={FiClock} label="Pending" value={stats?.pending ?? 0} accent="#ef4444" loading={loadingOrders} />
            </div>

            {/* ── Mini status row ── */}
            {!overallLoading && stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Delivered", value: stats.delivered, icon: FiCheckCircle, accent: "#10b981" },
                        { label: "In Transit", value: stats.inTransit, icon: FiTruck, accent: "#0ea5e9" },
                        { label: "Total Users", value: customerLocations.length, icon: FiUsers, accent: "#8b5cf6" },
                    ].map(({ label, value, icon: Icon, accent }) => (
                        <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                            <div>
                                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
                            </div>
                            <div style={{ color: accent, opacity: 0.85 }}><Icon size={22} /></div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Quick Actions ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                    { to: "/admin/products", icon: FiPackage, label: "Products", desc: "Manage all products", accent: "#f59e0b" },
                    { to: "/admin/orders", icon: FiShoppingBag, label: "Orders", desc: "Update order status", accent: "#2563eb" },
                    { to: "/admin/products/new", icon: FiPlusCircle, label: "Add Product", desc: "Upload & set pricing", accent: "#10b981" },
                ].map(({ to, icon: Icon, label, desc, accent }) => (
                    <Link key={to} to={to} className="ux-quick-card" style={{
                        display: "flex", flexDirection: "column", padding: "18px 16px", gap: 12,
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
                        borderTop: `3px solid ${accent}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                    }}>
                        <div style={{ width: 36, height: 36, background: `${accent}15`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{label}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{desc}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: accent }}>
                            Open <FiArrowRight size={12} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── City Stats + Map ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Card>
                    <CardHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FiMapPin size={14} color="#f59e0b" />
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Customers by City</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{customerLocations.length} tracked</span>
                    </CardHeader>
                    <div style={{ padding: "16px 20px" }}>
                        {loadingUsers ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {[0, 1, 2, 3].map(i => <Sk key={i} h={28} />)}
                            </div>
                        ) : cityStats.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8", fontSize: 13 }}>
                                <FiMapPin size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.3 }} />
                                No location data yet
                            </div>
                        ) : cityStats.map(({ city, count }) => (
                            <div key={city} style={{ marginBottom: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{city}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{count}</span>
                                </div>
                                <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", background: "linear-gradient(90deg,#2563eb,#7c3aed)", width: `${(count / maxCityCount) * 100}%`, borderRadius: 4, transition: "width 0.6s ease" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <FiMapPin size={14} color="#ef4444" />
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Customer Map</span>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            {[{ color: "#f59e0b", label: "Shop" }, { color: "#2563eb", label: "Customer" }].map(({ color, label }) => (
                                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} /> {label}
                                </span>
                            ))}
                        </div>
                    </CardHeader>
                    <div style={{ padding: 12 }}>
                        {loadingUsers ? <Sk h={300} /> : (
                            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", display: "block", borderRadius: 8, background: "#f8fafc" }}>
                                <path d="M160,20 L200,15 L240,25 L270,40 L290,70 L300,100 L310,130 L320,160 L315,190 L310,220 L300,250 L285,275 L265,295 L250,320 L240,345 L230,370 L220,390 L210,410 L200,425 L190,410 L180,390 L170,365 L158,340 L145,315 L130,290 L115,265 L105,240 L95,210 L88,180 L85,150 L88,120 L95,95 L110,70 L130,50 L160,20 Z"
                                    fill="rgba(37,99,235,0.05)" stroke="rgba(37,99,235,0.2)" strokeWidth="1" />
                                {[0, 1, 2, 3, 4].map(i => (
                                    <line key={`h${i}`} x1={PAD.left} y1={PAD.top + i * 80} x2={SVG_W - PAD.right} y2={PAD.top + i * 80} stroke="#e2e8f0" strokeWidth="0.5" />
                                ))}
                                {CITY_LABELS.map(({ name, lat, lng }) => {
                                    const p = toPos(lat, lng);
                                    return <text key={name} x={p.x} y={p.y + 13} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="500">{name}</text>;
                                })}
                                {customerLocations.slice(0, 40).map((user, i) => {
                                    const p = toPos(user.location.latitude, user.location.longitude);
                                    return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" stroke="rgba(37,99,235,0.3)" strokeWidth="2" opacity="0.7" />;
                                })}
                                <circle cx={SHOP.x} cy={SHOP.y} r="8" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                                <text x={SHOP.x} y={SHOP.y + 4} textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">S</text>
                            </svg>
                        )}
                    </div>
                </Card>
            </div>

            {/* ── Customer Queries ── */}
            <Card style={{ marginBottom: 20 }}>
                <CardHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FiMail size={14} color="#2563eb" />
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Customer Queries</span>
                        {unreadCount > 0 && (
                            <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{queries.length} total</span>
                </CardHeader>
                {loadingQueries ? (
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {[0, 1, 2].map(i => <Sk key={i} h={52} />)}
                    </div>
                ) : queries.length === 0 ? (
                    <div style={{ padding: "36px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        <FiMail size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                        No queries yet
                    </div>
                ) : queries.slice(0, 10).map(query => {
                    const isExpanded = expandedQuery === query._id;
                    return (
                        <div key={query._id} className="ux-qrow" style={{ borderBottom: "1px solid #f1f5f9", background: query.isRead ? "transparent" : "#eff6ff", transition: "background 0.15s" }}>
                            <div
                                onClick={() => { setExpandedQuery(isExpanded ? null : query._id); if (!query.isRead) markAsRead(query._id); }}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer" }}
                            >
                                <div style={{ width: 34, height: 34, background: query.isRead ? "#f8fafc" : "#dbeafe", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <FiMail size={14} color={query.isRead ? "#94a3b8" : "#2563eb"} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{query.name}</span>
                                        {!query.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />}
                                        {query.subject && (
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "#f59e0b", background: "#fef3c7", padding: "1px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                                                <FiTag size={8} /> {query.subject}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 }}>
                                        {query.message}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                        {new Date(query.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </div>
                                    {isExpanded
                                        ? <FiChevronDown size={12} style={{ color: "#94a3b8", marginTop: 4 }} />
                                        : <FiChevronRight size={12} style={{ color: "#94a3b8", marginTop: 4 }} />}
                                </div>
                            </div>
                            {isExpanded && (
                                <div style={{ margin: "0 20px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 10 }}>
                                        <a href={`mailto:${query.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                                            <FiMail size={12} /> {query.email}
                                        </a>
                                        {query.phone && (
                                            <a href={`tel:${query.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", textDecoration: "none", fontWeight: 600 }}>
                                                <FiPhone size={12} /> {query.phone}
                                            </a>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{query.message}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </Card>

            {/* ── Recent Orders ── */}
            <Card>
                <CardHeader>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FiShoppingBag size={14} color="#2563eb" />
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>Recent Orders</span>
                    </div>
                    <Link to="/admin/orders" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                        View All <FiArrowRight size={12} />
                    </Link>
                </CardHeader>
                {loadingOrders ? (
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {[0, 1, 2].map(i => <Sk key={i} h={52} />)}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div style={{ padding: "36px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        <FiShoppingBag size={24} style={{ display: "block", margin: "0 auto 8px", opacity: 0.25 }} />
                        No orders yet
                    </div>
                ) : recentOrders.map(order => {
                    const cfg = STATUS_CFG[order.orderStatus] || STATUS_CFG.PLACED;
                    return (
                        <div key={order._id} className="ux-order-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #f1f5f9", transition: "background 0.12s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 36, height: 36, background: "#eff6ff", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiShoppingBag size={14} color="#2563eb" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>#{order._id.slice(-6).toUpperCase()}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{order.customerName}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`, padding: "3px 10px", borderRadius: 20 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} /> {cfg.label}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: 13, color: "#10b981" }}>
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