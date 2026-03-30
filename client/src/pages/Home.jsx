import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { fetchActiveBanners } from "../api/bannerApi";
import { fetchActiveCategories } from "../api/categoryApi";
import {
    FaArrowRight,
    FaTruck, FaUndo, FaShieldAlt, FaTag,
    FaShoppingCart, FaBolt, FaCheckCircle,
    FaStar, FaRegStar, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { useCart } from "../hooks/useCart";

/* ════════════════════════════════════════
   FALLBACK CONSTANTS
════════════════════════════════════════ */
const FALLBACK_SLIDES = [
    { _id: "1", title: "Shop The", subtitle: "Live The Trend.", tag: "New Season", highlight: "Trend.", desc: "Discover fashion, electronics, and lifestyle products handpicked for you.", cta: "Shop Now", ctaLink: "/category/mens-fashion", secondary: "Explore Deals", secondaryLink: "/deals", bg: "#f0ece4", accent: "#c9a84c", imgCategory: "mens-fashion", image: null },
    { _id: "2", title: "Redefine", subtitle: "Curated for You.", tag: "Women's Edit", highlight: "Elegance.", desc: "Explore our exclusive women's fashion collection.", cta: "Explore Women's", ctaLink: "/category/womens-fashion", secondary: "View Ethnic Wear", secondaryLink: "/category/ethnic-wear", bg: "#f5eee8", accent: "#b5865a", imgCategory: "womens-fashion", image: null },
    { _id: "3", title: "Celebrate", subtitle: "Festive Styles Await.", tag: "Ethnic & Festive", highlight: "Culture.", desc: "From vibrant kurtas to elegant ethnic ensembles.", cta: "Shop Ethnic", ctaLink: "/category/ethnic-wear", secondary: "View Collections", secondaryLink: "/category/ethnic-wear", bg: "#f5ede4", accent: "#8b4513", imgCategory: "ethnic-wear", image: null },
];

const FALLBACK_CATEGORIES = [
    { _id: "1", name: "Men's Fashion", slug: "mens-fashion", emoji: "👔", color: "#1a1740", lightColor: "#f0eefb" },
    { _id: "2", name: "Women's Fashion", slug: "womens-fashion", emoji: "👗", color: "#7c2d5e", lightColor: "#fdf0f7" },
    { _id: "3", name: "Ethnic Wear", slug: "ethnic-wear", emoji: "🥻", color: "#8b4513", lightColor: "#fef5ec" },
    { _id: "4", name: "Bags & Wallets", slug: "bags-wallets", emoji: "👜", color: "#2d5a27", lightColor: "#f0fdf0" },
    { _id: "5", name: "Electronics", slug: "electronics", emoji: "📱", color: "#1e3a5f", lightColor: "#eff6ff" },
    { _id: "6", name: "Lifestyle", slug: "lifestyle", emoji: "✨", color: "#5b2c6f", lightColor: "#fdf4ff" },
];

const TRUST_ITEMS = [
    { icon: <FaTruck size={22} />, title: "Free Delivery", desc: "On orders above ₹499", color: "#c9a84c" },
    { icon: <FaUndo size={22} />, title: "7-Day Returns", desc: "Hassle-free returns", color: "#22c55e" },
    { icon: <FaShieldAlt size={22} />, title: "Secure Payments", desc: "100% safe checkout", color: "#3b82f6" },
    { icon: <FaTag size={22} />, title: "Best Prices", desc: "Unbeatable deals daily", color: "#ef4444" },
];

/* ════════════════════════════════════════
   HELPERS
════════════════════════════════════════ */
const slugify = (s) =>
    s?.toLowerCase()
        .replace(/['''`]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-") || "";

const getHeroImage = (allProducts, imgCategory) => {
    if (!imgCategory || !allProducts.length) return allProducts[0] || null;
    const matched = allProducts.filter(p => slugify(p.category) === slugify(imgCategory));
    return (matched.length ? matched : allProducts)[0] || null;
};

/* ════════════════════════════════════════
   HOOKS
════════════════════════════════════════ */
const useInView = () => {
    const ref = useRef(null);
    const [inView, setInView] = useState(true);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold: 0.05, rootMargin: "0px 0px 120px 0px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
};

/* ════════════════════════════════════════
   PRODUCT CARD (search results)
════════════════════════════════════════ */
const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const [hovered, setHovered] = useState(false);
    const [flash, setFlash] = useState(false);

    const inCart = cartItems.some(i => i._id === product._id);
    const isOOS = product.inStock === false || Number(product.stock ?? 0) === 0;
    const hasDisc = product.mrp && Number(product.mrp) > Number(product.price);
    const discPct = hasDisc ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : null;
    const imgSrc = product.images?.[0]?.url || "";

    const handleCart = (e) => {
        e.stopPropagation();
        if (inCart || isOOS) return;
        addItem(product);
        setFlash(true);
        setTimeout(() => setFlash(false), 1400);
    };

    return (
        <div
            onClick={() => navigate(`/products/${product.slug || product._id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ background: "#fff", border: `1px solid ${hovered ? "#c9a84c" : "#e8e4d9"}`, cursor: "pointer", transform: hovered ? "translateY(-4px)" : "translateY(0)", boxShadow: hovered ? "0 12px 36px rgba(28,25,23,.12)" : "0 2px 8px rgba(0,0,0,.04)", transition: "all .28s cubic-bezier(.22,1,.36,1)", overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
            <div style={{ position: "relative", background: "#f7f4ee", overflow: "hidden", aspectRatio: "3/4", flexShrink: 0 }}>
                {imgSrc
                    ? <img src={imgSrc} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform .5s cubic-bezier(.34,1.1,.64,1)", filter: isOOS ? "grayscale(.7) opacity(.6)" : "none" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 40 }}>📦</div>
                }
                {discPct && !isOOS && <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px" }}>{discPct}% OFF</span>}
                {isOOS && <span style={{ position: "absolute", top: 8, left: 8, background: "#1c1917", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px" }}>SOLD OUT</span>}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.97)", borderTop: "1px solid #e8e4d9", padding: "8px 10px", display: "flex", gap: 6, transform: hovered ? "translateY(0)" : "translateY(100%)", transition: "transform .25s cubic-bezier(.22,1,.36,1)" }}>
                    <button onClick={handleCart} disabled={inCart || isOOS} style={{ flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", border: "none", cursor: inCart || isOOS ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: inCart ? "#f0fdf4" : flash ? "#22c55e" : isOOS ? "#f4f4f5" : "#1c1917", color: inCart ? "#16a34a" : flash ? "#fff" : isOOS ? "#a1a1aa" : "#fff", fontFamily: "inherit" }}>
                        {inCart ? <><FaCheckCircle size={9} /> In Cart</> : flash ? <>✓ Added!</> : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigate(`/products/${product.slug || product._id}`); }} style={{ flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", background: "#c9a84c", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                        <FaBolt size={9} /> Buy Now
                    </button>
                </div>
            </div>
            <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>{product.category}</p>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: "#1c1917", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</p>
                {product.numReviews > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map(s => s <= Math.round(product.rating || 0) ? <FaStar key={s} size={9} style={{ color: "#f59e0b" }} /> : <FaRegStar key={s} size={9} style={{ color: "#d6d3d1" }} />)}
                        <span style={{ fontSize: 10, color: "#a8a29e", marginLeft: 2 }}>({product.numReviews})</span>
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 600, color: isOOS ? "#a8a29e" : "#1c1917" }}>₹{Number(product.price).toLocaleString("en-IN")}</span>
                    {hasDisc && !isOOS && <span style={{ fontSize: 11, color: "#a8a29e", textDecoration: "line-through" }}>₹{Number(product.mrp).toLocaleString("en-IN")}</span>}
                </div>
                {hasDisc && !isOOS && <p style={{ fontSize: 9.5, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}</p>}
            </div>
        </div>
    );
};

/* ════════════════════════════════════════
   DEAL COUNTDOWN HOOK
════════════════════════════════════════ */
const useCountdown = (dealEndsAt) => {
    const calc = useCallback(() => {
        if (!dealEndsAt) return null;
        const diff = new Date(dealEndsAt) - new Date();
        if (diff <= 0) return null;
        return {
            h: Math.floor(diff / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
        };
    }, [dealEndsAt]);

    const [time, setTime] = useState(calc);
    useEffect(() => {
        if (!dealEndsAt) return;
        const t = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(t);
    }, [dealEndsAt, calc]);
    return time;
};

/* ════════════════════════════════════════
   MINI CARD
════════════════════════════════════════ */
const MiniCard = ({ product }) => {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
    const discPct = hasDiscount ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : null;
    const imgSrc = product.images?.[0]?.url || product.image || "";
    const isDeal = product.isDeal && product.dealEndsAt;
    const countdown = useCountdown(isDeal ? product.dealEndsAt : null);

    return (
        <div
            onClick={() => navigate(`/products/${product.slug || product._id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ background: "#fff", border: `1px solid ${hovered ? "#c9a84c" : "#e8e4d9"}`, cursor: "pointer", transform: hovered ? "translateY(-4px)" : "translateY(0)", boxShadow: hovered ? "0 12px 36px rgba(28,25,23,.12)" : "0 2px 8px rgba(0,0,0,.04)", transition: "all .28s cubic-bezier(.22,1,.36,1)", overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
            <div style={{ position: "relative", background: "#f7f4ee", overflow: "hidden", aspectRatio: "3/4", flexShrink: 0 }}>
                {imgSrc
                    ? <img src={imgSrc} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform .5s cubic-bezier(.34,1.1,.64,1)" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 40 }}>📦</div>
                }
                {discPct && <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px" }}>{discPct}% OFF</span>}
                {isDeal && <span style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 6px" }}>🔥 DEAL</span>}
            </div>
            <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>{product.category}</p>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: "#1c1917", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 600, color: "#1c1917" }}>₹{Number(product.price).toLocaleString("en-IN")}</span>
                    {hasDiscount && <span style={{ fontSize: 11, color: "#a8a29e", textDecoration: "line-through" }}>₹{Number(product.mrp).toLocaleString("en-IN")}</span>}
                </div>
                {isDeal && countdown && (
                    <div style={{ marginTop: 8, display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>Ends in:</span>
                        {[{ val: countdown.h, label: "h" }, { val: countdown.m, label: "m" }, { val: countdown.s, label: "s" }].map(({ val, label }) => (
                            <span key={label} style={{ background: "#1c1917", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 3, minWidth: 22, textAlign: "center" }}>
                                {String(val).padStart(2, "0")}{label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ════════════════════════════════════════
   SUGGESTED FOR YOU — ✅ Backend se fetch
════════════════════════════════════════ */
const SuggestedForYou = () => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Backend se fetch karo
    useEffect(() => {
        let cancelled = false;
        api.get("/products/suggested")
            .then(({ data }) => {
                if (!cancelled) setProducts(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Suggested fetch error:", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    // Skeleton while loading
    if (loading) {
        return (
            <section style={{ padding: "64px 0", background: "#fff", borderTop: "1px solid #e8e4d9" }}>
                <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px,5vw,80px)" }}>
                    <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} style={{ flexShrink: 0, width: 196, border: "1px solid #e8e4d9", background: "#fff", overflow: "hidden" }}>
                                <div style={{ aspectRatio: "3/4", background: "linear-gradient(90deg,#f0ece4 25%,#e8e4da 50%,#f0ece4 75%)", backgroundSize: "200% 100%", animation: "hp-shimmer 1.5s ease-in-out infinite" }} />
                                <div style={{ padding: "10px 12px 14px" }}>
                                    <div style={{ height: 9, width: "40%", background: "#f0ede8", marginBottom: 6, borderRadius: 2 }} />
                                    <div style={{ height: 12, width: "80%", background: "#f0ede8", marginBottom: 8, borderRadius: 2 }} />
                                    <div style={{ height: 18, width: "35%", background: "#f0ede8", borderRadius: 2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!products.length) return null;

    return (
        <section style={{ padding: "64px 0", background: "#fff", borderTop: "1px solid #e8e4d9" }}>
            <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px,5vw,80px)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>✦ Curated For You</p>
                        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#1a1740", lineHeight: 1.2 }}>
                            Suggested <span style={{ color: "#c9a84c" }}>For You</span>
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {[{ dir: -1, can: canLeft }, { dir: 1, can: canRight }].map(({ dir, can }, idx) => (
                            <button key={idx} onClick={() => scroll(dir)} disabled={!can}
                                style={{ width: 40, height: 40, border: `1.5px solid ${can ? "#1a1740" : "#e8e4d9"}`, background: can ? "#1a1740" : "#f7f4ee", color: can ? "#fff" : "#c9c5be", cursor: can ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                                {dir === -1 ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 4 }}
                >
                    {products.map(p => {
                        const imgSrc = p.images?.[0]?.url || p.image || "";
                        const hasDisc = p.mrp && Number(p.mrp) > Number(p.price);
                        const discPct = hasDisc ? Math.round(((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100) : null;
                        return (
                            <div key={p._id}
                                onClick={() => navigate(`/products/${p.slug || p._id}`)}
                                style={{ flexShrink: 0, width: 196, cursor: "pointer", border: "1px solid #e8e4d9", background: "#fff", overflow: "hidden", transition: "all .25s cubic-bezier(.22,1,.36,1)" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(28,25,23,.1)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e4d9"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <div style={{ position: "relative", background: "#f7f4ee", aspectRatio: "3/4", overflow: "hidden" }}>
                                    {imgSrc
                                        ? <img src={imgSrc} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
                                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 32 }}>📦</div>
                                    }
                                    {discPct && <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px" }}>{discPct}% OFF</span>}
                                    {p.isDeal && p.dealEndsAt && new Date(p.dealEndsAt) > new Date() && (
                                        <span style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px" }}>🔥</span>
                                    )}
                                </div>
                                <div style={{ padding: "10px 12px 14px" }}>
                                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#c9a84c", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{p.category}</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: "#1c1917", lineHeight: 1.4, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</p>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", fontWeight: 600, color: "#1c1917" }}>₹{Number(p.price).toLocaleString("en-IN")}</span>
                                        {hasDisc && <span style={{ fontSize: 10, color: "#a8a29e", textDecoration: "line-through" }}>₹{Number(p.mrp).toLocaleString("en-IN")}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/* ════════════════════════════════════════
   SECTION HEADER
════════════════════════════════════════ */
const SectionHeader = ({ tag, title, highlight, desc, cta, ctaLink }) => {
    const navigate = useNavigate();
    return (
        <div style={{ marginBottom: 40 }}>
            {tag && <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 10 }}>✦ {tag}</p>}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#1a1740", lineHeight: 1.2, margin: 0 }}>
                    {title} <span style={{ color: "#c9a84c" }}>{highlight}</span>
                </h2>
                {cta && (
                    <button onClick={() => navigate(ctaLink)}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#1a1740", background: "none", border: "1.5px solid #1a1740", padding: "8px 18px", cursor: "pointer", transition: "all .18s", fontFamily: "inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#1a1740"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#1a1740"; }}>
                        {cta} <FaArrowRight size={10} />
                    </button>
                )}
            </div>
            {desc && <p style={{ fontSize: 13, color: "#78716c", marginTop: 8, maxWidth: 500 }}>{desc}</p>}
        </div>
    );
};

/* ════════════════════════════════════════
   SKELETON
════════════════════════════════════════ */
const SkeletonCard = () => (
    <div style={{ overflow: "hidden", border: "1px solid #e8e4d9" }}>
        <div style={{ aspectRatio: "3/4", background: "linear-gradient(90deg,#f0ece4 25%,#e8e4da 50%,#f0ece4 75%)", backgroundSize: "200% 100%", animation: "hp-shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ height: 10, width: "40%", background: "#f0ede8", marginBottom: 8, borderRadius: 2 }} />
            <div style={{ height: 13, width: "80%", background: "#f0ede8", marginBottom: 6, borderRadius: 2 }} />
            <div style={{ height: 13, width: "60%", background: "#f0ede8", marginBottom: 12, borderRadius: 2 }} />
            <div style={{ height: 20, width: "35%", background: "#f0ede8", borderRadius: 2 }} />
        </div>
    </div>
);

/* ════════════════════════════════════════
   FEATURED PLACEHOLDER
════════════════════════════════════════ */
const FeatPlaceholder = ({ label }) => {
    const emoji = label.includes("Men") ? "👔" : label.includes("Women") ? "👗" : label.includes("Ethnic") ? "🥻" : "👜";
    return (
        <div style={{ height: 320, width: "100%", background: "linear-gradient(135deg,#1a1740 0%,#2a2560 50%,#c9a84c22 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 52, opacity: 0.4 }}>{emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>Coming Soon</span>
        </div>
    );
};

/* ════════════════════════════════════════
   SEARCH RESULTS
════════════════════════════════════════ */
const SearchResults = ({ query }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!query.trim()) return;
        const controller = new AbortController();
        (async () => {
            try {
                setLoading(true); setError("");
                const { data } = await api.get(`/products?search=${encodeURIComponent(query)}`, { signal: controller.signal });
                setResults(Array.isArray(data) ? data : (data?.products || []));
            } catch (e) {
                if (e.name !== "AbortError") setError("Search failed. Please try again.");
            } finally { setLoading(false); }
        })();
        return () => controller.abort();
    }, [query]);

    return (
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "40px clamp(16px,5vw,80px) 80px" }}>
            <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>✦ Search Results</p>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#1a1740", margin: 0 }}>
                    Results for <span style={{ color: "#c9a84c" }}>"{query}"</span>
                </h2>
                {!loading && <p style={{ fontSize: 13, color: "#78716c", marginTop: 6 }}>{results.length} products found</p>}
            </div>
            {loading && <div className="sr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>{Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>}
            {error && <div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ fontSize: 14, color: "#dc2626" }}>{error}</p></div>}
            {!loading && !error && results.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: "#1a1740", marginBottom: 8 }}>No products found</h3>
                    <p style={{ fontSize: 13, color: "#a8a29e" }}>Try different keywords or browse our categories</p>
                </div>
            )}
            {!loading && !error && results.length > 0 && (
                <div className="sr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                    {results.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
            )}
        </div>
    );
};

/* ════════════════════════════════════════
   MAIN HOMEPAGE
════════════════════════════════════════ */


const UrbexonHourSection = () => {
    const navigate = useNavigate();

    const cards = [
        { title: "Urbexon Hour", desc: "Local express delivery in 45–120 mins (up to 15 km).", chip: "0–15 KM", bg: "#ecfeff", border: "#a5f3fc" },
        { title: "Vendor Self Delivery", desc: "Within 2 km, vendor can self-deliver for faster handoff.", chip: "0–2 KM", bg: "#f0fdf4", border: "#bbf7d0" },
        { title: "E-commerce Standard", desc: "Shiprocket managed delivery in 3–5 business days.", chip: "3–5 DAYS", bg: "#eff6ff", border: "#bfdbfe" },
    ];

    return (
        <section style={{ padding: "52px clamp(16px,5vw,80px)", background: "#fff", borderTop: "1px solid #e8e4d9", borderBottom: "1px solid #e8e4d9" }}>
            <div style={{ maxWidth: 1440, margin: "0 auto" }}>
                <SectionHeader tag="Delivery" title="Urbexon" highlight="Hour" desc="Choose fast local delivery or standard national shipping." />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
                    {cards.map((c) => (
                        <div key={c.title} style={{ border: `1px solid ${c.border}`, background: c.bg, padding: 16 }}>
                            <div style={{ display: "inline-flex", padding: "4px 9px", background: "#1a1740", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", marginBottom: 8 }}>{c.chip}</div>
                            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#1a1740" }}>{c.title}</h3>
                            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{c.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/checkout")} style={{ padding: "11px 16px", border: "none", background: "#1a1740", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                        Try Quick Checkout
                    </button>
                    <button onClick={() => navigate("/contact")} style={{ padding: "11px 16px", border: "1px solid #1a1740", background: "#fff", color: "#1a1740", fontWeight: 700, cursor: "pointer" }}>
                        Connect Local Riders
                    </button>
                </div>
            </div>
        </section>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";

    const [heroIdx, setHeroIdx] = useState(0);
    const [heroAnim, setHeroAnim] = useState(true);
    const heroTimer = useRef(null);

    const [allProducts, setAllProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { val: "0+", label: "Products" },
        { val: "0+", label: "Categories" },
        { val: "7 Day", label: "Returns" },
        { val: "Pan India", label: "Delivery" },
    ]);

    const [heroSlides, setHeroSlides] = useState(FALLBACK_SLIDES);
    const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

    const [catRef] = useInView();
    const [newRef] = useInView();
    const [dealsRef] = useInView();
    const [featRef] = useInView();
    const [statsRef] = useInView();
    const [bannerRef] = useInView();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchActiveBanners();
                const banners = Array.isArray(res.data) ? res.data : [];
                if (banners.length > 0) setHeroSlides(banners);
            } catch { /* keep fallback */ }

            try {
                const res = await fetchActiveCategories();
                const cats = Array.isArray(res.data) ? res.data : [];
                if (cats.length > 0) setCategories(cats);
            } catch { /* keep fallback */ }
        })();

        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/products/homepage");
                const all = data?.featured || [];
                const arrivals = data?.newArrivals || [];
                const dealProds = data?.deals || [];
                const cats = data?.categories || [];
                const s = data?.stats || {};

                setAllProducts(all);
                setNewArrivals(arrivals);
                setDeals(dealProds);
                setStats([
                    { val: `${s.totalProducts || 0}+`, label: "Products" },
                    { val: `${s.totalCategories || cats.length || 0}+`, label: "Categories" },
                    { val: "7 Day", label: "Returns" },
                    { val: "Pan India", label: "Delivery" },
                ]);
            } catch {
                try {
                    const { data } = await api.get("/products");
                    const prods = Array.isArray(data) ? data : (data?.products || []);
                    const sorted = [...prods].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    const cats = [...new Set(prods.map(p => p.category).filter(Boolean))];
                    setAllProducts(prods);
                    setNewArrivals(sorted.slice(0, 8));
                    setDeals(prods.filter(p => p.mrp && Number(p.mrp) > Number(p.price)).slice(0, 8));
                    setStats([
                        { val: `${prods.length}+`, label: "Products" },
                        { val: `${cats.length}+`, label: "Categories" },
                        { val: "7 Day", label: "Returns" },
                        { val: "Pan India", label: "Delivery" },
                    ]);
                } catch (e2) { console.error("Home fetch error:", e2); }
            } finally { setLoading(false); }
        })();
    }, []);

    const goSlide = useCallback((idxOrFn) => {
        setHeroAnim(false);
        setTimeout(() => {
            setHeroIdx(prev => typeof idxOrFn === "function" ? idxOrFn(prev) : idxOrFn);
            setHeroAnim(true);
        }, 120);
    }, []);

    useEffect(() => {
        heroTimer.current = setInterval(() => goSlide(prev => (prev + 1) % heroSlides.length), 5000);
        return () => clearInterval(heroTimer.current);
    }, [goSlide, heroSlides.length]);

    const slide = heroSlides[heroIdx] || heroSlides[0];
    const heroBannerImg = slide?.image?.url || "";
    const heroProduct = !heroBannerImg ? getHeroImage(allProducts, slide?.imgCategory) : null;
    const heroImgSrc = heroBannerImg || heroProduct?.images?.[0]?.url || "";

    if (searchQuery) {
        return (
            <>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
                    :root{--hp-gold:#c9a84c;--hp-navy:#1a1740;--hp-border:#e8e4d9;--hp-muted:#78716c;--hp-cream:#f7f4ee;}
                    .hp{font-family:'DM Sans',sans-serif;background:var(--hp-cream);min-height:100vh;}
                    @keyframes hp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                    @media(max-width:1024px){.sr-grid{grid-template-columns:repeat(3,1fr)!important;}}
                    @media(max-width:640px){.sr-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}}
                `}</style>
                <div className="hp"><SearchResults query={searchQuery} /></div>
            </>
        );
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
                :root{--hp-gold:#c9a84c;--hp-gold2:#e8d49a;--hp-navy:#1a1740;--hp-cream:#f7f4ee;--hp-border:#e8e4d9;--hp-muted:#78716c;}
                .hp{font-family:'DM Sans',sans-serif;}
                .hp*,.hp*::before,.hp*::after{box-sizing:border-box;}
                @keyframes hp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                @keyframes hp-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

                .hp-ticker-wrap{overflow:hidden;background:var(--hp-navy);height:36px;display:flex;align-items:center;position:relative;z-index:10;}
                .hp-ticker-inner{display:flex;animation:hp-ticker 22s linear infinite;white-space:nowrap;}
                .hp-ticker-item{padding:0 32px;font-size:10.5px;font-weight:600;color:rgba(255,255,255,.7);letter-spacing:.12em;text-transform:uppercase;}
                .hp-ticker-item span{color:var(--hp-gold);margin-right:8px;}

                .hp-hero{position:relative;min-height:clamp(520px,76vh,780px);display:flex;align-items:stretch;overflow:hidden;}
                .hp-hero-content{position:relative;z-index:3;display:flex;flex-direction:column;justify-content:center;padding:72px clamp(24px,6vw,100px);width:52%;flex-shrink:0;}
                @media(max-width:768px){.hp-hero-content{width:100%;padding:48px 24px 220px;}}
                .hp-hero-imgpane{position:absolute;right:0;top:0;bottom:0;width:56%;overflow:hidden;}
                @media(max-width:768px){.hp-hero-imgpane{width:100%;opacity:.22;}}
                .hp-hero-imgpane img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:opacity .5s ease;}

                .hp-hero-tag{font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--hp-gold);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
                .hp-hero-tag::before{content:'';width:32px;height:1.5px;background:var(--hp-gold);display:inline-block;}
                .hp-hero-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2.8rem,5.5vw,5.2rem);font-weight:700;line-height:1.05;color:var(--hp-navy);margin-bottom:4px;}
                .hp-hero-highlight{font-family:'Cormorant Garamond',serif;font-size:clamp(2.8rem,5.5vw,5.2rem);font-weight:700;font-style:italic;line-height:1.05;margin-bottom:12px;}
                .hp-hero-sub{font-family:'Cormorant Garamond',serif;font-size:clamp(1rem,2vw,1.3rem);font-style:italic;color:rgba(26,23,64,.38);margin-bottom:16px;}
                .hp-hero-desc{font-size:clamp(12px,1.4vw,13.5px);color:var(--hp-muted);line-height:1.75;max-width:400px;margin-bottom:32px;}
                .hp-hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px;}
                .hp-btn-primary{padding:14px 32px;background:var(--hp-navy);color:#fff;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s;}
                .hp-btn-primary:hover{background:var(--hp-gold);}
                .hp-btn-outline{padding:14px 28px;background:transparent;color:var(--hp-navy);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;border:1.5px solid rgba(26,23,64,.3);cursor:pointer;transition:all .2s;}
                .hp-btn-outline:hover{border-color:var(--hp-navy);background:var(--hp-navy);color:#fff;}
                .hp-hero-stats{display:flex;flex-wrap:nowrap;gap:0;}
                .hp-hero-stat{flex-shrink:0;padding-right:20px;margin-right:20px;border-right:1px solid rgba(26,23,64,.14);}
                .hp-hero-stat:last-child{border-right:none;}
                .hp-dots{position:absolute;bottom:24px;left:clamp(24px,6vw,100px);display:flex;gap:8px;z-index:5;}
                .hp-dot{width:28px;height:3px;border-radius:0;cursor:pointer;transition:all .3s;border:none;padding:0;}

                .hp-section{padding:64px clamp(16px,5vw,80px);max-width:1440px;margin:0 auto;}
                .hp-section-full{padding:64px 0;background:#fff;}
                .hp-section-full-inner{max-width:1440px;margin:0 auto;padding:0 clamp(16px,5vw,80px);}

                .hp-cat-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;}
                @media(max-width:900px){.hp-cat-grid{grid-template-columns:repeat(3,1fr);}}
                @media(max-width:480px){.hp-cat-grid{grid-template-columns:repeat(2,1fr);}}
                .hp-cat-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 12px;border:1px solid var(--hp-border);cursor:pointer;transition:all .22s;text-align:center;background:#fff;}
                .hp-cat-card:hover{border-color:var(--hp-gold);transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.08);}
                .hp-cat-emoji{font-size:28px;transition:transform .2s;}
                .hp-cat-card:hover .hp-cat-emoji{transform:scale(1.15);}
                .hp-cat-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}

                .hp-prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
                @media(max-width:1024px){.hp-prod-grid{grid-template-columns:repeat(3,1fr);}}
                @media(max-width:640px){.hp-prod-grid{grid-template-columns:repeat(2,1fr);gap:10px;}}

                .hp-feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
                @media(max-width:640px){.hp-feat-grid{grid-template-columns:1fr;}}
                .hp-feat-card{position:relative;overflow:hidden;cursor:pointer;min-height:320px;}
                .hp-feat-card-img{width:100%;height:100%;object-fit:cover;object-position:top center;transition:transform .5s cubic-bezier(.34,1.1,.64,1);display:block;}
                .hp-feat-card:hover .hp-feat-card-img{transform:scale(1.06);}
                .hp-feat-card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,30,.75) 0%,transparent 65%);}
                .hp-feat-card-body{position:absolute;bottom:0;left:0;right:0;padding:24px;}

                .hp-promo{background:var(--hp-navy);padding:48px clamp(20px,5vw,80px);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}

                .hp-trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--hp-border);}
                @media(max-width:768px){.hp-trust-grid{grid-template-columns:repeat(2,1fr);}}
                .hp-trust-item{display:flex;align-items:center;gap:14px;padding:24px 20px;border-right:1px solid var(--hp-border);}
                .hp-trust-item:last-child{border-right:none;}
                @media(max-width:768px){.hp-trust-item:nth-child(2n){border-right:none;}}

                .hp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--hp-cream);border:1px solid var(--hp-border);}
                @media(max-width:600px){.hp-stats{grid-template-columns:repeat(2,1fr);}}
                .hp-stat{padding:32px 24px;border-right:1px solid var(--hp-border);text-align:center;}
                .hp-stat:last-child{border-right:none;}
                .hp-stat-val{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:700;color:var(--hp-navy);line-height:1;margin-bottom:6px;}
                .hp-stat-label{font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--hp-muted);}

                .hp-skel{background:linear-gradient(90deg,#f0ece4 25%,#e8e4da 50%,#f0ece4 75%);background-size:200% 100%;animation:hp-shimmer 1.5s ease-in-out infinite;}
                @media(max-width:1024px){.sr-grid{grid-template-columns:repeat(3,1fr)!important;}}
                @media(max-width:640px){.sr-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}}
            `}</style>

            <div className="hp">

                {/* TICKER */}
                <div className="hp-ticker-wrap">
                    <div className="hp-ticker-inner">
                        {[...Array(2)].map((_, ri) =>
                            ["NEW ARRIVALS EVERY WEEK", "FREE DELIVERY ON ORDERS ABOVE ₹499", "EASY 7-DAY RETURNS", "SECURE PAYMENTS", "PAN-INDIA DELIVERY", "EXCLUSIVE MEMBER OFFERS"].map((t, i) => (
                                <span key={`${ri}-${i}`} className="hp-ticker-item"><span>·</span>{t}</span>
                            ))
                        )}
                    </div>
                </div>

                {/* HERO */}
                <section className="hp-hero" style={{ background: slide.bg || "#f0ece4" }}>
                    <div className="hp-hero-imgpane">
                        {heroImgSrc
                            ? <img src={heroImgSrc} alt={heroProduct?.name || "hero"} style={{ opacity: heroAnim ? 1 : 0 }} />
                            : <div className="hp-skel" style={{ width: "100%", height: "100%" }} />
                        }
                        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: `linear-gradient(to right,${slide.bg || "#f0ece4"} 0%,${slide.bg || "#f0ece4"}cc 6%,${slide.bg || "#f0ece4"}55 20%,transparent 42%),linear-gradient(to top,${slide.bg || "#f0ece4"}44 0%,transparent 25%)` }} />
                    </div>

                    <div className="hp-hero-content">
                        <div className="hp-hero-tag" style={{ opacity: heroAnim ? 1 : 0, transition: "opacity .3s" }}>{slide.tag}</div>
                        <h1 className="hp-hero-h1" style={{ opacity: heroAnim ? 1 : 0, transform: heroAnim ? "none" : "translateY(12px)", transition: "all .4s .08s" }}>{slide.title || slide.headline}</h1>
                        <h1 className="hp-hero-highlight" style={{ color: slide.accent || "#c9a84c", opacity: heroAnim ? 1 : 0, transform: heroAnim ? "none" : "translateY(12px)", transition: "all .4s .14s" }}>{slide.highlight}</h1>
                        <p className="hp-hero-sub" style={{ opacity: heroAnim ? 1 : 0, transition: "opacity .4s .2s" }}>{slide.subtitle || slide.sub}</p>
                        <p className="hp-hero-desc" style={{ opacity: heroAnim ? 1 : 0, transition: "opacity .4s .24s" }}>{slide.desc}</p>
                        <div className="hp-hero-btns" style={{ opacity: heroAnim ? 1 : 0, transform: heroAnim ? "none" : "translateY(8px)", transition: "all .4s .28s" }}>
                            <button className="hp-btn-primary" onClick={() => navigate(slide.link || slide.ctaLink || "/")}>{slide.cta || "Shop Now"} <FaArrowRight size={11} /></button>
                            {slide.secondaryLink && (
                                <button className="hp-btn-outline" onClick={() => navigate(slide.secondaryLink)}>⚡ {slide.secondary}</button>
                            )}
                        </div>
                        <div className="hp-hero-stats" style={{ opacity: heroAnim ? 1 : 0, transition: "opacity .4s .32s" }}>
                            {stats.map(s => (
                                <div key={s.label} className="hp-hero-stat">
                                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.2rem,2.5vw,1.6rem)", fontWeight: 700, color: "#1a1740", whiteSpace: "nowrap" }}>{s.val}</p>
                                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#a8a29e", marginTop: 2, whiteSpace: "nowrap" }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hp-dots">
                        {heroSlides.map((s, i) => (
                            <button key={s._id || s.id || i} className="hp-dot"
                                onClick={() => { clearInterval(heroTimer.current); goSlide(i); }}
                                style={{ background: i === heroIdx ? (slide.accent || "#c9a84c") : "rgba(26,23,64,.2)" }} />
                        ))}
                    </div>
                </section>

                {/* TRUST BAR */}
                <div style={{ padding: "0 clamp(16px,5vw,80px)", background: "#fff", borderBottom: "1px solid var(--hp-border)" }}>
                    <div className="hp-trust-grid" style={{ maxWidth: 1440, margin: "0 auto" }}>
                        {TRUST_ITEMS.map(t => (
                            <div key={t.title} className="hp-trust-item">
                                <div style={{ color: t.color, flexShrink: 0 }}>{t.icon}</div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1740", marginBottom: 2 }}>{t.title}</p>
                                    <p style={{ fontSize: 11, color: "#a8a29e" }}>{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CATEGORIES */}
                <section className="hp-section-full" ref={catRef}>
                    <div className="hp-section-full-inner">
                        <SectionHeader tag="Browse" title="Shop by" highlight="Category" />
                        <div className="hp-cat-grid">
                            {categories.map(cat => (
                                <div key={cat._id || cat.slug} className="hp-cat-card" onClick={() => navigate(`/category/${cat.slug}`)}>
                                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: cat.lightColor || cat.light || "#f0eefb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                        {cat.image?.url
                                            ? <img src={cat.image.url} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                            : <span className="hp-cat-emoji">{cat.emoji || "🏷️"}</span>
                                        }
                                    </div>
                                    <span className="hp-cat-label" style={{ color: cat.color || "#1a1740" }}>{cat.name || cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* NEW ARRIVALS */}
                {(loading || newArrivals.length > 0) && (
                    <section className="hp-section" ref={newRef} style={{ background: "var(--hp-cream)" }}>
                        <SectionHeader tag="Just In" title="New" highlight="Arrivals" desc="Fresh styles added every week — be the first to shop." cta="View All" ctaLink="/" />
                        {loading
                            ? <div className="hp-prod-grid">{Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
                            : <div className="hp-prod-grid">{newArrivals.map(p => <MiniCard key={p._id} product={p} />)}</div>
                        }
                    </section>
                )}

                {/* FEATURED COLLECTIONS */}
                <section className="hp-section" ref={featRef} style={{ background: "#fff" }}>
                    <SectionHeader tag="Explore" title="Featured" highlight="Collections" />
                    <div className="hp-feat-grid">
                        {[
                            { label: "Men's Fashion", sub: "Trending Styles", path: "/category/mens-fashion", catKey: "mens-fashion" },
                            { label: "Women's Fashion", sub: "New Season Edit", path: "/category/womens-fashion", catKey: "womens-fashion" },
                            { label: "Ethnic Wear", sub: "Festive Collection", path: "/category/ethnic-wear", catKey: "ethnic-wear" },
                            { label: "Bags & Wallets", sub: "Carry in Style", path: "/category/bags-wallets", catKey: "bags-wallets" },
                        ].map(f => {
                            const prod = allProducts.find(p => slugify(p.category) === slugify(f.label) || slugify(p.category) === f.catKey || slugify(p.category).includes(f.catKey.replace(/-/g, "")));
                            const imgSrc = prod?.images?.[0]?.url || "";
                            return (
                                <div key={f.path} className="hp-feat-card" onClick={() => navigate(f.path)}>
                                    {imgSrc ? <img src={imgSrc} alt={f.label} className="hp-feat-card-img" style={{ height: 320 }} /> : <FeatPlaceholder label={f.label} />}
                                    <div className="hp-feat-card-overlay" />
                                    <div className="hp-feat-card-body">
                                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginBottom: 4 }}>{f.sub}</p>
                                        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 12 }}>{f.label}</p>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--hp-gold)", border: "1px solid rgba(201,168,76,.5)", padding: "5px 12px" }}>
                                            Explore <FaArrowRight size={8} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ✅ SUGGESTED FOR YOU — backend se fetch */}
                <SuggestedForYou />

                {/* URBEXON HOUR DELIVERY SECTION */}
                <UrbexonHourSection />

                {/* DEALS */}
                {deals.length > 0 && (
                    <section className="hp-section" ref={dealsRef} style={{ background: "var(--hp-cream)" }}>
                        <SectionHeader tag="Limited Time" title="Hot" highlight="Deals" desc="Best discounts on top products — grab them before they're gone!" cta="View All Deals" ctaLink="/deals" />
                        <div className="hp-prod-grid">{deals.map(p => <MiniCard key={p._id} product={p} />)}</div>
                    </section>
                )}

                {/* PROMO BANNER */}
                <div ref={bannerRef} className="hp-promo">
                    <div>
                        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(201,168,76,.7)", marginBottom: 8 }}>EXCLUSIVE OFFER</p>
                        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                            Free Delivery on Orders<br /><span style={{ color: "var(--hp-gold)" }}>Above ₹499</span>
                        </h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ borderLeft: "1px solid rgba(255,255,255,.12)", paddingLeft: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 4 }}>Pan-India Delivery</p>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Easy Returns in 7 Days</p>
                        </div>
                        <button onClick={() => navigate("/deals")}
                            style={{ padding: "14px 32px", background: "var(--hp-gold)", color: "#1a1740", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, transition: "all .2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e8d49a"}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--hp-gold)"}>
                            Shop Deals <FaArrowRight size={11} />
                        </button>
                    </div>
                </div>

                {/* STATS */}
                <div ref={statsRef} className="hp-stats">
                    {stats.map(s => (
                        <div key={s.label} className="hp-stat">
                            <p className="hp-stat-val">{s.val}</p>
                            <p className="hp-stat-label">{s.label}</p>
                        </div>
                    ))}
                </div>

            </div>
        </>
    );
};

export default Home;