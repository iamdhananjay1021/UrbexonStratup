import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { fetchCategoryBySlug } from "../api/categoryApi";
import { useCart } from "../hooks/useCart";
import {
    FaTimes, FaChevronDown, FaChevronUp,
    FaStar, FaRegStar, FaShoppingCart, FaBolt,
    FaCheckCircle, FaSortAmountDown, FaSearch,
} from "react-icons/fa";

const SORT_OPTIONS = [
    { val: "newest", label: "Newest First" },
    { val: "price_asc", label: "Price: Low to High" },
    { val: "price_desc", label: "Price: High to Low" },
    { val: "rating", label: "Top Rated" },
    { val: "discount", label: "Best Discount" },
];

/* ─────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────── */
const ProductCard = ({ product, inView, delay }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();
    const [hovered, setHovered] = useState(false);
    const [flash, setFlash] = useState(false);

    const inCart = cartItems.some(i => i._id === product._id);
    const isOOS = product.inStock === false || Number(product.stock ?? 0) === 0;
    const hasDisc = product.mrp && Number(product.mrp) > Number(product.price);
    const discPct = hasDisc
        ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
        : null;
    const imgSrc = product.images?.[0]?.url || product.image || "";

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
            style={{
                background: "#fff",
                border: `1px solid ${hovered ? "#c9a84c" : "#e8e4d9"}`,
                cursor: "pointer",
                transform: hovered ? "translateY(-4px)" : "none",
                boxShadow: hovered ? "0 12px 36px rgba(28,25,23,.1)" : "none",
                transition: "all .28s cubic-bezier(.22,1,.36,1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                opacity: inView ? 1 : 0,
                transitionDelay: `${delay}s`,
            }}
        >
            {/* Image */}
            <div style={{ position: "relative", background: "#f7f4ee", overflow: "hidden", aspectRatio: "3/4", flexShrink: 0 }}>
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={product.name}
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            objectFit: "cover", objectPosition: "top center",
                            mixBlendMode: "multiply",
                            transform: hovered ? "scale(1.06)" : "scale(1)",
                            transition: "transform .5s cubic-bezier(.34,1.1,.64,1)",
                            filter: isOOS ? "grayscale(.7) opacity(.6)" : "none",
                        }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 36 }}>📦</div>
                )}

                {discPct && !isOOS && (
                    <span style={{ position: "absolute", top: 8, left: 8, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px", letterSpacing: ".06em" }}>
                        {discPct}% OFF
                    </span>
                )}
                {isOOS && (
                    <span style={{ position: "absolute", top: 8, left: 8, background: "#1c1917", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px", letterSpacing: ".06em" }}>
                        SOLD OUT
                    </span>
                )}

                {/* Hover CTA */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(255,255,255,.97)", borderTop: "1px solid #e8e4d9",
                    padding: "8px 10px", display: "flex", gap: 6,
                    transform: hovered ? "translateY(0)" : "translateY(100%)",
                    transition: "transform .25s cubic-bezier(.22,1,.36,1)",
                }}>
                    <button
                        onClick={handleCart}
                        disabled={inCart || isOOS}
                        style={{
                            flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700,
                            letterSpacing: ".1em", textTransform: "uppercase", border: "none",
                            cursor: inCart || isOOS ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            transition: "all .18s", fontFamily: "inherit",
                            background: inCart ? "#f0fdf4" : flash ? "#22c55e" : isOOS ? "#f4f4f5" : "#1c1917",
                            color: inCart ? "#16a34a" : flash ? "#fff" : isOOS ? "#a1a1aa" : "#fff",
                        }}
                    >
                        {inCart ? <><FaCheckCircle size={9} /> In Cart</> : flash ? <>✓ Added!</> : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); if (!isOOS) navigate(`/products/${product.slug || product._id}`); }}
                        style={{
                            flex: 1, padding: "8px 0", fontSize: 9.5, fontWeight: 700,
                            letterSpacing: ".1em", textTransform: "uppercase",
                            background: "#c9a84c", color: "#fff", border: "none",
                            cursor: isOOS ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            transition: "all .18s", opacity: isOOS ? .5 : 1, fontFamily: "inherit",
                        }}
                    >
                        <FaBolt size={9} /> Buy Now
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: "clamp(8px,2vw,12px) clamp(8px,2vw,14px) clamp(10px,2vw,14px)", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: "#c9a84c", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>
                    {product.category}
                </p>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: "#1c1917", lineHeight: 1.4, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {product.name}
                </p>
                {(product.numReviews > 0 || product.rating > 0) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
                        {[1, 2, 3, 4, 5].map(s => s <= Math.round(product.rating || 0)
                            ? <FaStar key={s} size={9} style={{ color: "#f59e0b" }} />
                            : <FaRegStar key={s} size={9} style={{ color: "#d6d3d1" }} />
                        )}
                        <span style={{ fontSize: 10, color: "#a8a29e", marginLeft: 2 }}>({product.numReviews || 0})</span>
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: "auto" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.15rem", fontWeight: 600, color: isOOS ? "#a8a29e" : "#1c1917" }}>
                        ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>
                    {hasDisc && !isOOS && (
                        <span style={{ fontSize: 11, color: "#a8a29e", textDecoration: "line-through" }}>
                            ₹{Number(product.mrp).toLocaleString("en-IN")}
                        </span>
                    )}
                </div>
                {hasDisc && !isOOS && (
                    <p style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
                        Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}
                    </p>
                )}
            </div>
        </div>
    );
};

/* ════════════════════════════════════════
   CATEGORY PAGE
════════════════════════════════════════ */
const CategoryPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [inView, setInView] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [sort, setSort] = useState(searchParams.get("sort") || "newest");
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
    const [sortOpen, setSortOpen] = useState(false);

    const LIMIT = 12;
    const [categoryLabel, setCategoryLabel] = useState(
        slug?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Products"
    );

    // Fetch proper category name from API
    useEffect(() => {
        if (!slug) return;
        setCategoryLabel(slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
        fetchCategoryBySlug(slug)
            .then(r => { if (r.data?.name) setCategoryLabel(r.data.name); })
            .catch(() => { });
    }, [slug]);

    /* ── Fetch ── */
    const fetchProducts = useCallback(async (pg = 1, srt = sort, srch = search) => {
        try {
            setLoading(true);

            // ✅ FIX: send slug directly as category — backend normalizeCategory handles it
            const params = new URLSearchParams({
                category: slug,
                sort: srt,
                limit: LIMIT,
                page: pg,
            });
            if (srch.trim()) params.set("search", srch.trim());

            const { data } = await api.get(`/products?${params}`);
            const prods = Array.isArray(data) ? data : (data?.products || []);
            const totalCount = data?.total || prods.length;

            setProducts(pg === 1 ? prods : prev => [...prev, ...prods]);
            setTotal(pg === 1 ? totalCount : prev => prev);
            setHasMore(prods.length === LIMIT);
        } catch (e) {
            console.error("Category fetch error:", e);
        } finally {
            setLoading(false);
            setTimeout(() => setInView(true), 80);
        }
    }, [slug, sort, search]);

    // Re-fetch when slug/sort/search changes
    useEffect(() => {
        setPage(1);
        setProducts([]);
        setInView(false);
        fetchProducts(1, sort, search);
    }, [slug, sort, search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleSort = (val) => {
        setSort(val);
        setSortOpen(false);
        setSearchParams(p => { p.set("sort", val); return p; });
    };

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchProducts(next, sort, search);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .cp { font-family:'DM Sans',sans-serif; min-height:100vh; background:#f7f4ee; }
        .cp-skel { background:linear-gradient(90deg,#ede9e1 25%,#e5e1d8 50%,#ede9e1 75%); background-size:200% 100%; animation:cpShim 1.5s ease-in-out infinite; }
        @keyframes cpShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .cp-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media (max-width:1024px) { .cp-grid { grid-template-columns:repeat(3,1fr); gap:14px; } }
        @media (max-width:640px)  { .cp-grid { grid-template-columns:repeat(2,1fr); gap:10px; } }
        @media (max-width:340px)  { .cp-grid { grid-template-columns:1fr; } }
        .cp-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        @media (max-width:520px) {
          .cp-toolbar { gap:8px; }
          .cp-toolbar-search { min-width:0!important; max-width:none!important; order:1; flex-basis:100%; }
          .cp-toolbar-count { order:3; font-size:11px!important; }
          .cp-toolbar-sort { order:2; margin-left:auto; }
          .cp-sort-label { display:none; }
        }
        .cp-sort-dd { position:absolute; top:calc(100% + 6px); right:0; background:#fff; border:1px solid #e8e4d9; min-width:200px; z-index:50; box-shadow:0 12px 32px rgba(0,0,0,.1); }
        @media (max-width:520px) { .cp-sort-dd { right:-8px; min-width:180px; } }
        .cp-sort-item { padding:10px 16px; font-size:13px; font-weight:500; color:#1c1917; cursor:pointer; transition:background .15s; }
        .cp-sort-item:hover { background:#f7f4ee; }
        .cp-sort-item.active { color:#c9a84c; font-weight:700; background:#fdf8ee; }
      `}</style>

            <div className="cp">

                {/* ── Hero banner ── */}
                <div style={{ background: "#1a1740", padding: "48px clamp(16px,5vw,80px) 40px" }}>
                    <div style={{ maxWidth: 1440, margin: "0 auto" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(201,168,76,.7)", marginBottom: 10 }}>
                            Urbexon · {categoryLabel}
                        </p>
                        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
                            {categoryLabel}
                        </h1>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", margin: 0 }}>
                            {loading ? "Loading products…" : `${total || products.length} products`}
                        </p>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div style={{ background: "#fff", borderBottom: "1px solid #e8e4d9", position: "sticky", top: 64, zIndex: 40 }}>
                    <div className="cp-toolbar" style={{ maxWidth: 1440, margin: "0 auto", padding: "12px clamp(16px,5vw,80px)" }}>

                        {/* Search */}
                        <form className="cp-toolbar-search" onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180, maxWidth: 340, background: "#f7f4ee", border: "1px solid #e8e4d9", padding: "0 12px", height: 38 }}>
                            <FaSearch size={12} color="#a8a29e" />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder={`Search in ${categoryLabel}…`}
                                style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#1c1917", width: "100%", fontFamily: "inherit" }}
                            />
                            {searchInput && (
                                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a29e", padding: 0 }}>
                                    <FaTimes size={11} />
                                </button>
                            )}
                        </form>

                        {/* Results count */}
                        <span className="cp-toolbar-count" style={{ fontSize: 12, color: "#a8a29e", whiteSpace: "nowrap" }}>
                            {!loading && `${products.length} products`}
                        </span>

                        {/* Sort */}
                        <div className="cp-toolbar-sort" style={{ position: "relative", marginLeft: "auto" }}>
                            <button
                                onClick={() => setSortOpen(o => !o)}
                                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid #e8e4d9", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#1c1917", fontFamily: "inherit", height: 38 }}
                            >
                                <FaSortAmountDown size={12} />
                                <span className="cp-sort-label">{SORT_OPTIONS.find(s => s.val === sort)?.label || "Sort"}</span>
                                {sortOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                            </button>
                            {sortOpen && (
                                <>
                                    <div onClick={() => setSortOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                                    <div className="cp-sort-dd">
                                        {SORT_OPTIONS.map(opt => (
                                            <div key={opt.val} className={`cp-sort-item${sort === opt.val ? " active" : ""}`} onClick={() => handleSort(opt.val)}>
                                                {sort === opt.val && "✓ "}{opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Products ── */}
                <div style={{ maxWidth: 1440, margin: "0 auto", padding: "32px clamp(16px,5vw,80px) 64px" }}>

                    {/* Skeleton */}
                    {loading && products.length === 0 && (
                        <div className="cp-grid">
                            {Array(12).fill(0).map((_, i) => (
                                <div key={i} style={{ aspectRatio: "3/4" }} className="cp-skel" />
                            ))}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && products.length === 0 && (
                        <div style={{ textAlign: "center", padding: "80px 20px" }}>
                            <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", color: "#1a1740", marginBottom: 8 }}>
                                No products found
                            </h3>
                            <p style={{ fontSize: 13, color: "#a8a29e", marginBottom: 24 }}>
                                Try different search terms or browse other categories
                            </p>
                            <button onClick={() => navigate("/")}
                                style={{ padding: "12px 28px", background: "#1a1740", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: ".08em" }}>
                                Back to Home
                            </button>
                        </div>
                    )}

                    {/* Grid */}
                    {products.length > 0 && (
                        <>
                            <div className="cp-grid">
                                {products.map((p, i) => (
                                    <ProductCard key={p._id} product={p} inView={inView} delay={Math.min(i % 12, 7) * 0.05} />
                                ))}
                            </div>

                            {/* Load more */}
                            {hasMore && (
                                <div style={{ textAlign: "center", marginTop: 48 }}>
                                    <button
                                        onClick={loadMore}
                                        disabled={loading}
                                        style={{ padding: "14px 40px", border: "1.5px solid #1a1740", background: "transparent", color: "#1a1740", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", transition: "all .2s", opacity: loading ? .6 : 1 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "#1a1740"; e.currentTarget.style.color = "#fff"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1a1740"; }}
                                    >
                                        {loading ? "Loading…" : "Load More"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CategoryPage;