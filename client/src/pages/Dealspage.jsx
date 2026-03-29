import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
    FaShoppingCart, FaBolt, FaCheckCircle,
    FaStar, FaRegStar, FaFire,
} from "react-icons/fa";
import { useCart } from "../hooks/useCart";

/* ════════════════════════════════════
   COUNTDOWN HOOK
════════════════════════════════════ */
const useCountdown = (dealEndsAt) => {
    const calc = () => {
        const diff = new Date(dealEndsAt) - new Date();
        if (diff <= 0) return null;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return { d, h, m, s };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        if (!dealEndsAt) return;
        const t = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(t);
    }, [dealEndsAt]);
    return time;
};

/* ════════════════════════════════════
   DEAL CARD
════════════════════════════════════ */
const DealCard = ({ product }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const [hovered, setHovered] = useState(false);
    const [flash, setFlash] = useState(false);

    const inCart = cartItems.some(i => i._id === product._id);
    const isOOS = product.inStock === false || Number(product.stock ?? 0) === 0;
    const hasDisc = product.mrp && Number(product.mrp) > Number(product.price);
    const discPct = hasDisc ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : null;
    const imgSrc = product.images?.[0]?.url || "";
    const countdown = useCountdown(product.dealEndsAt);

    const handleCart = (e) => {
        e.stopPropagation();
        if (inCart || isOOS) return;
        addItem(product);
        setFlash(true);
        setTimeout(() => setFlash(false), 1400);
    };

    return (
        <div onClick={() => navigate(`/products/${product.slug || product._id}`)}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
                background: "#fff",
                border: `1px solid ${hovered ? "#c9a84c" : "#e8e4d9"}`,
                cursor: "pointer",
                transform: hovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: hovered ? "0 12px 36px rgba(28,25,23,.12)" : "0 2px 8px rgba(0,0,0,.04)",
                transition: "all .28s cubic-bezier(.22,1,.36,1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}>
            {/* Image */}
            <div style={{ position: "relative", background: "#f7f4ee", overflow: "hidden", aspectRatio: "3/4", flexShrink: 0 }}>
                {imgSrc
                    ? <img src={imgSrc} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform .5s cubic-bezier(.34,1.1,.64,1)", filter: isOOS ? "grayscale(.7) opacity(.6)" : "none" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 40 }}>📦</div>
                }
                {discPct && !isOOS && <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px" }}>{discPct}% OFF</span>}
                {isOOS && <span style={{ position: "absolute", top: 8, left: 8, background: "#1c1917", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px" }}>SOLD OUT</span>}
                <span style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px" }}>🔥 DEAL</span>

                {/* Hover Buttons */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.97)", borderTop: "1px solid #e8e4d9", padding: "8px 10px", display: "flex", gap: 6, transform: hovered ? "translateY(0)" : "translateY(100%)", transition: "transform .25s cubic-bezier(.22,1,.36,1)" }}>
                    <button onClick={handleCart} disabled={inCart || isOOS}
                        style={{ flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: inCart || isOOS ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: inCart ? "#f0fdf4" : flash ? "#22c55e" : isOOS ? "#f4f4f5" : "#1c1917", color: inCart ? "#16a34a" : flash ? "#fff" : isOOS ? "#a1a1aa" : "#fff", fontFamily: "inherit" }}>
                        {inCart ? <><FaCheckCircle size={9} /> In Cart</> : flash ? <>✓ Added!</> : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigate(`/products/${product.slug || product._id}`); }}
                        style={{ flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "#c9a84c", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                        <FaBolt size={9} /> Buy Now
                    </button>
                </div>
            </div>

            {/* Info */}
            <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>{product.category}</p>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: "#1c1917", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</p>
                {product.numReviews > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map(s => s <= Math.round(product.rating || 0)
                            ? <FaStar key={s} size={9} style={{ color: "#f59e0b" }} />
                            : <FaRegStar key={s} size={9} style={{ color: "#d6d3d1" }} />
                        )}
                        <span style={{ fontSize: 10, color: "#a8a29e", marginLeft: 2 }}>({product.numReviews})</span>
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 600, color: isOOS ? "#a8a29e" : "#1c1917" }}>
                        ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>
                    {hasDisc && !isOOS && <span style={{ fontSize: 11, color: "#a8a29e", textDecoration: "line-through" }}>₹{Number(product.mrp).toLocaleString("en-IN")}</span>}
                </div>
                {hasDisc && !isOOS && (
                    <p style={{ fontSize: 9.5, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
                        Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}
                    </p>
                )}

                {/* Countdown */}
                {countdown && (
                    <div style={{ marginTop: 10, padding: "6px 8px", background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 800, letterSpacing: ".05em" }}>⏱ Ends in:</span>
                        <div style={{ display: "flex", gap: 3 }}>
                            {[
                                { val: countdown.d, label: "d" },
                                { val: countdown.h, label: "h" },
                                { val: countdown.m, label: "m" },
                                { val: countdown.s, label: "s" },
                            ].filter(({ val, label }) => label !== "d" || val > 0).map(({ val, label }) => (
                                <span key={label} style={{ background: "#1c1917", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 3, minWidth: 24, textAlign: "center" }}>
                                    {String(val).padStart(2, "0")}{label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ════════════════════════════════════
   SKELETON
════════════════════════════════════ */
const SkeletonCard = () => (
    <div style={{ overflow: "hidden", border: "1px solid #e8e4d9" }}>
        <div style={{ aspectRatio: "3/4", background: "linear-gradient(90deg,#f0ece4 25%,#e8e4da 50%,#f0ece4 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ height: 10, width: "40%", background: "#f0ede8", marginBottom: 8, borderRadius: 2 }} />
            <div style={{ height: 13, width: "80%", background: "#f0ede8", marginBottom: 6, borderRadius: 2 }} />
            <div style={{ height: 20, width: "35%", background: "#f0ede8", borderRadius: 2 }} />
        </div>
    </div>
);

/* ════════════════════════════════════
   MAIN DEALS PAGE
════════════════════════════════════ */
const Deals = () => {
    const navigate = useNavigate();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/products/deals");
                setDeals(Array.isArray(data) ? data : []);
            } catch {
                setError("Failed to load deals. Please try again.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", background: "#faf9f7" }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* Header Banner */}
            <div style={{ background: "linear-gradient(135deg, #1c1917 0%, #1a1740 60%, #c9a84c22 100%)", padding: "48px clamp(16px,5vw,80px)" }}>
                <div style={{ maxWidth: 1440, margin: "0 auto" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 10 }}>
                        ✦ Limited Time
                    </p>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 700, color: "#fff", lineHeight: 1.15, margin: 0 }}>
                        Hot <span style={{ color: "#c9a84c" }}>Deals</span>
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginTop: 10, maxWidth: 480 }}>
                        Best discounts on top products — grab them before they expire!
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1440, margin: "0 auto", padding: "48px clamp(16px,5vw,80px) 80px" }}>

                {/* Loading */}
                {loading && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 16 }}>{error}</p>
                        <button onClick={() => window.location.reload()}
                            style={{ padding: "10px 24px", background: "#1c1917", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && deals.length === 0 && (
                    <div style={{ textAlign: "center", padding: "100px 20px" }}>
                        <p style={{ fontSize: 52, marginBottom: 16 }}>🔥</p>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", color: "#1a1740", marginBottom: 8 }}>
                            No Active Deals
                        </h3>
                        <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 28 }}>
                            Check back soon — new deals drop regularly!
                        </p>
                        <button onClick={() => navigate("/")}
                            style={{ padding: "12px 28px", background: "#1c1917", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "inherit" }}>
                            Browse All Products
                        </button>
                    </div>
                )}

                {/* Deals Grid */}
                {!loading && !error && deals.length > 0 && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                            <FaFire style={{ color: "#f59e0b" }} />
                            <p style={{ fontSize: 14, color: "#78716c", fontWeight: 500 }}>
                                <b style={{ color: "#1c1917" }}>{deals.length}</b> active deal{deals.length !== 1 ? "s" : ""} — hurry, limited time!
                            </p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                            {deals.map(p => <DealCard key={p._id} product={p} />)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Deals;