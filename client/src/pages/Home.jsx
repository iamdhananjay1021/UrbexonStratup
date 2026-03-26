// import { useEffect, useState, useCallback, useMemo, useRef } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchProducts } from "../features/products/productSlice";
// import { useCart } from "../hooks/useCart";
// import { imgUrl } from "../utils/imageUrl";
// import Footer from "../components/Footer";
// import {
//     FaStar, FaRegStar, FaSearch, FaFire,
//     FaShoppingCart, FaBolt,
//     FaTruck, FaShieldAlt, FaUndo, FaArrowRight,
//     FaChevronLeft, FaChevronRight, FaTimes,
// } from "react-icons/fa";

// const PAGE_SIZE = 12;

// /* ─── Intersection Observer Hook ─── */
// const useInView = (threshold = 0.1) => {
//     const ref = useRef(null);
//     const [inView, setInView] = useState(false);
//     useEffect(() => {
//         const el = ref.current;
//         if (!el) return;
//         const obs = new IntersectionObserver(
//             ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
//             { threshold }
//         );
//         obs.observe(el);
//         return () => obs.disconnect();
//     }, [threshold]);
//     return [ref, inView];
// };

// /* ─── Skeleton Card ─── */
// const SkeletonCard = () => (
//     <div className="uk2-card animate-pulse">
//         <div style={{ height: 280, background: "#f0ede8" }} />
//         <div className="uk2-card-body">
//             <div style={{ height: 13, background: "#ede9e4", borderRadius: 4, width: "70%", marginBottom: 8 }} />
//             <div style={{ height: 11, background: "#f0ede8", borderRadius: 4, width: "45%" }} />
//             <div style={{ height: 22, background: "#ede9e4", borderRadius: 4, width: "35%", marginTop: 12 }} />
//         </div>
//     </div>
// );

// /* ─── Product Card ─── */
// const ProductCard = ({ product, onAddToCart, onBuyNow, style }) => {
//     const navigate = useNavigate();
//     const { cartItems } = useCart();
//     const inCart = cartItems.some(i => i._id === product._id);
//     const imageUrl = imgUrl.card(product.images?.[0]?.url || "");
//     const rating = product.rating || 0;
//     const numReviews = product.numReviews || 0;
//     const [imgLoaded, setImgLoaded] = useState(false);

//     const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
//     const discountPct = hasDiscount
//         ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
//         : null;
//     const isOutOfStock = product.inStock === false;
//     const stockNum = Number(product.stock ?? 0);
//     const isLowStock = !isOutOfStock && stockNum > 0 && stockNum <= 5;

//     return (
//         <div
//             onClick={() => navigate(`/products/${product.slug || product._id}`)}
//             style={style}
//             className="uk2-card group"
//         >
//             <div className="uk2-card-img-wrap">
//                 {!imgLoaded && <div className="uk2-card-img-skeleton" />}
//                 <img
//                     src={imageUrl || "https://via.placeholder.com/400x400?text=No+Image"}
//                     alt={product.name}
//                     loading="lazy"
//                     decoding="async"
//                     width={400} height={400}
//                     onLoad={() => setImgLoaded(true)}
//                     onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
//                     className={`uk2-card-img ${imgLoaded ? "opacity-100" : "opacity-0"} ${isOutOfStock ? "grayscale opacity-60" : ""}`}
//                 />
//                 <div className="uk2-badge-stack">
//                     {product.isCustomizable && !isOutOfStock && <span className="uk2-badge uk2-badge-custom">✏ CUSTOM</span>}
//                     {isOutOfStock && <span className="uk2-badge uk2-badge-sold">SOLD OUT</span>}
//                     {isLowStock && !isOutOfStock && <span className="uk2-badge uk2-badge-low">⚡ {stockNum} LEFT</span>}
//                 </div>
//                 {hasDiscount && !isOutOfStock && <div className="uk2-discount-badge">{discountPct}% OFF</div>}
//                 <div className="uk2-card-overlay">
//                     <button
//                         onClick={e => { e.stopPropagation(); if (!inCart && !isOutOfStock) onAddToCart(product); }}
//                         disabled={inCart || isOutOfStock}
//                         className={`uk2-overlay-btn ${inCart ? "uk2-overlay-btn--incart" : isOutOfStock ? "uk2-overlay-btn--disabled" : "uk2-overlay-btn--add"}`}
//                     >
//                         {inCart ? "✓ In Cart" : <><FaShoppingCart size={11} /> Add to Cart</>}
//                     </button>
//                     <button
//                         onClick={e => { e.stopPropagation(); if (!isOutOfStock) onBuyNow(product); }}
//                         disabled={isOutOfStock}
//                         className="uk2-overlay-btn uk2-overlay-btn--buy"
//                     >
//                         Buy Now →
//                     </button>
//                 </div>
//             </div>
//             <div className="uk2-card-body">
//                 <p className="uk2-card-cat">{product.category || "General"}</p>
//                 <h3 className="uk2-card-name">{product.name}</h3>
//                 {numReviews > 0 ? (
//                     <div className="uk2-stars">
//                         {[1, 2, 3, 4, 5].map(s =>
//                             s <= Math.round(rating)
//                                 ? <FaStar key={s} size={9} className="text-amber-400" />
//                                 : <FaRegStar key={s} size={9} className="text-stone-300" />
//                         )}
//                         <span className="uk2-reviews">({numReviews})</span>
//                     </div>
//                 ) : (
//                     <div className="uk2-stars">
//                         {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
//                         <span className="uk2-reviews" style={{ color: "#ccc" }}>No reviews</span>
//                     </div>
//                 )}
//                 <div className="uk2-price-row">
//                     <span className={`uk2-price ${isOutOfStock ? "uk2-price--oos" : ""}`}>
//                         ₹{Number(product.price).toLocaleString("en-IN")}
//                     </span>
//                     {hasDiscount && !isOutOfStock && (
//                         <span className="uk2-mrp">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
//                     )}
//                 </div>
//                 {hasDiscount && !isOutOfStock && (
//                     <p className="uk2-save">Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}</p>
//                 )}
//             </div>
//         </div>
//     );
// };

// /* ─── Trend Card ─── */
// const TrendCard = ({ product, onAddToCart, onBuyNow }) => {
//     const navigate = useNavigate();
//     const imageUrl = imgUrl.card(product.images?.[0]?.url || "");
//     const [imgLoaded, setImgLoaded] = useState(false);
//     const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
//     const discountPct = hasDiscount
//         ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : null;
//     const isOutOfStock = product.inStock === false;

//     return (
//         <div onClick={() => navigate(`/products/${product.slug || product._id}`)} className="uk2-trend-card group">
//             <div className="uk2-trend-img-wrap">
//                 {!imgLoaded && <div className="uk2-card-img-skeleton" />}
//                 <img
//                     src={imageUrl || "https://via.placeholder.com/400x600?text=No+Image"}
//                     alt={product.name}
//                     loading="lazy"
//                     onLoad={() => setImgLoaded(true)}
//                     onError={e => { e.target.src = "https://via.placeholder.com/400x600?text=No+Image"; setImgLoaded(true); }}
//                     className={`uk2-card-img ${imgLoaded ? "opacity-100" : "opacity-0"}`}
//                 />
//                 {hasDiscount && !isOutOfStock && <span className="uk2-trend-discount">{discountPct}% OFF</span>}
//                 <div className="uk2-trend-quick-view">Quick View ↗</div>
//             </div>
//             <div className="uk2-trend-body">
//                 <p className="uk2-card-cat">{product.category || "General"}</p>
//                 <p className="uk2-trend-name">{product.name}</p>
//                 <div className="uk2-trend-price-row">
//                     <span className="uk2-trend-price">₹{Number(product.price).toLocaleString("en-IN")}</span>
//                     {hasDiscount && !isOutOfStock && (
//                         <span className="uk2-mrp">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// /* ═══════════════════════════
//    MAIN HOME
// ═══════════════════════════ */
// const Home = () => {
//     const navigate = useNavigate();
//     const dispatch = useDispatch();
//     const [searchParams, setSearchParams] = useSearchParams();

//     // ✅ Sabhi filter params ek jagah
//     const searchQuery = searchParams.get("search") || "";
//     const activeCategory = searchParams.get("category") || "";
//     const showCustomizable = searchParams.get("customizable") === "true";
//     const showDeals = searchParams.get("deals") === "true"; // ✅ NEW

//     const { addItem } = useCart();

//     const allProducts = useSelector(s => s.products.items);
//     const status = useSelector(s => s.products.status);
//     const reduxError = useSelector(s => s.products.error);
//     const loading = status === "loading" || status === "idle";
//     const error = reduxError || "";

//     const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
//     const [trendTab, setTrendTab] = useState("bestselling");
//     const [trendOffset, setTrendOffset] = useState(0);
//     const [sortBy, setSortBy] = useState("default");
//     const TREND_VISIBLE = 4;

//     const [gridRef, gridInView] = useInView(0.05);

//     // ─── SEO ───
//     useEffect(() => {
//         document.title = "UrbeXon | Premium Online Shopping";
//         const desc = document.querySelector('meta[name="description"]');
//         if (desc) desc.setAttribute("content", "Shop at UrbeXon for the best deals on fashion, electronics, and more. Fast delivery across India.");
//     }, []);

//     // ─── Reset page on filter change ───
//     useEffect(() => {
//         setVisibleCount(PAGE_SIZE);
//     }, [searchQuery, activeCategory, showCustomizable, showDeals, sortBy]);

//     // ✅ FIX: Backend se fetch karo — search aur category params bhejo
//     useEffect(() => {
//         if (showDeals) {
//             dispatch(fetchProducts({ deals: "true" }));
//         } else {
//             dispatch(fetchProducts({
//                 search: searchQuery,
//                 category: activeCategory,
//             }));
//         }
//     }, [dispatch, searchQuery, activeCategory, showDeals]);

//     // ✅ FIX: useMemo sirf sort karta hai — filtering backend pe ho chuki
//     const products = useMemo(() => {
//         let filtered = [...allProducts];

//         // Customizable frontend pe filter karo (backend param nahi hai abhi)
//         if (showCustomizable) {
//             filtered = filtered.filter(p => p.isCustomizable === true);
//         }

//         // Sort
//         if (sortBy === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
//         else if (sortBy === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
//         else if (sortBy === "rating") filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//         else if (sortBy === "newest") filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

//         return filtered;
//     }, [allProducts, showCustomizable, sortBy]);

//     const customizableCount = useMemo(() => allProducts.filter(p => p.isCustomizable).length, [allProducts]);

//     // ✅ Categories dynamically backend se aaye products se
//     const categories = useMemo(() => [...new Set(allProducts.map(p => p.category).filter(Boolean))], [allProducts]);

//     const trendProducts = useMemo(() => {
//         if (trendTab === "bestselling") return [...allProducts].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
//         if (trendTab === "newarrival") return [...allProducts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
//         if (trendTab === "toptrending") return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
//         return allProducts;
//     }, [allProducts, trendTab]);

//     const visibleTrend = trendProducts.slice(trendOffset, trendOffset + TREND_VISIBLE);

//     const handleAddToCart = useCallback((product) => addItem(product), [addItem]);
//     const handleBuyNow = useCallback((product) => {
//         navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
//     }, [navigate]);

//     // ✅ setCategory — sirf URL params set karo, useEffect fetch trigger karega
//     const setCategory = useCallback((cat) => {
//         const params = {};
//         if (searchQuery) params.search = searchQuery;
//         if (cat) params.category = cat;
//         setSearchParams(params);
//     }, [searchQuery, setSearchParams]);

//     const setCustomizableFilter = useCallback(() => {
//         const params = {};
//         if (searchQuery) params.search = searchQuery;
//         params.customizable = "true";
//         setSearchParams(params);
//     }, [searchQuery, setSearchParams]);

//     const clearFilters = useCallback(() => {
//         setSearchParams({});
//         setSortBy("default");
//     }, [setSearchParams]);

//     const formatCat = (cat) => cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

//     // ✅ isAllActive — deals bhi check karo
//     const isAllActive = !activeCategory && !showCustomizable && !showDeals;
//     const visibleProducts = products.slice(0, visibleCount);
//     const hasMore = visibleCount < products.length;
//     const isFiltered = searchQuery || activeCategory || showCustomizable || showDeals;

//     const categoryDisplayData = useMemo(() => {
//         return categories.slice(0, 6).map((cat) => {
//             const catProducts = allProducts.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
//             const img = catProducts[0]?.images?.[0]?.url || "";
//             return { cat, img: img ? imgUrl.card(img) : "", count: catProducts.length };
//         });
//     }, [categories, allProducts]);

//     return (
//         <div className="uk2-root">
//             <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600;700;800&display=swap');

//         :root {
//             --uk2-ink: #1c1917;
//             --uk2-ink-muted: #78716c;
//             --uk2-ink-faint: #a8a29e;
//             --uk2-bg: #faf9f7;
//             --uk2-surface: #ffffff;
//             --uk2-border: #e7e5e1;
//             --uk2-accent: #c8a96e;
//             --uk2-accent-dark: #a8894e;
//             --uk2-accent-bg: #fdf6ea;
//             --uk2-dark: #1c1917;
//         }
//         .uk2-root { font-family:'Jost',sans-serif; background:var(--uk2-bg); color:var(--uk2-ink); min-height:100vh; }

//         /* ANNOUNCEMENT */
//         .uk2-announce { background:var(--uk2-dark); color:rgba(255,255,255,0.75); font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; padding:9px 0; overflow:hidden; }
//         @keyframes uk2-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
//         .uk2-marquee-track { display:flex; white-space:nowrap; animation:uk2-marquee 30s linear infinite; }
//         .uk2-marquee-track span { padding:0 36px; }

//         /* HERO */
//         .uk2-hero { background:#f5f2ec; position:relative; overflow:hidden; }
//         .uk2-hero-inner { max-width:1280px; margin:0 auto; padding:72px 40px 80px; display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
//         @media (max-width:900px) { .uk2-hero-inner { grid-template-columns:1fr; padding:48px 20px 56px; gap:40px; } }
//         .uk2-hero-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:20px; }
//         .uk2-hero-h1 { font-family:'Cormorant Garamond',serif; font-size:clamp(3.2rem,6vw,5.5rem); font-weight:600; line-height:1.0; color:var(--uk2-ink); margin-bottom:24px; letter-spacing:-0.01em; }
//         .uk2-hero-h1 em { color:var(--uk2-accent); font-style:italic; }
//         .uk2-hero-sub { font-size:15px; font-weight:400; color:var(--uk2-ink-muted); line-height:1.7; max-width:420px; margin-bottom:36px; }
//         .uk2-hero-btns { display:flex; gap:12px; flex-wrap:wrap; }
//         .uk2-btn-primary { background:var(--uk2-ink); color:white; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:14px 32px; border:none; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.25s ease; }
//         .uk2-btn-primary:hover { background:#2d2926; transform:translateY(-1px); box-shadow:0 8px 24px rgba(28,25,23,0.2); }
//         .uk2-btn-outline { background:transparent; color:var(--uk2-ink); font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:13px 32px; border:1.5px solid var(--uk2-ink); cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.25s ease; }
//         .uk2-btn-outline:hover { background:var(--uk2-ink); color:white; }
//         .uk2-hero-stats { display:flex; gap:36px; margin-top:48px; padding-top:32px; border-top:1px solid var(--uk2-border); }
//         .uk2-stat-val { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--uk2-ink); }
//         .uk2-stat-label { font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--uk2-ink-faint); margin-top:2px; }

//         /* HERO GRID */
//         .uk2-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
//         .uk2-hero-tile { border-radius:2px; overflow:hidden; position:relative; cursor:pointer; transition:transform 0.3s ease; }
//         .uk2-hero-tile:hover { transform:scale(0.99); }
//         .uk2-hero-tile img { width:100%; height:100%; object-fit:cover; display:block; }
//         .uk2-hero-tile-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(28,25,23,0.65) 0%,transparent 55%); }
//         .uk2-hero-tile-label { position:absolute; bottom:16px; left:16px; font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:white; line-height:1.2; }
//         .uk2-hero-tile-label span { display:block; font-family:'Jost',sans-serif; font-size:10px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.65); margin-bottom:3px; }

//         /* TRUST BAR */
//         .uk2-trust { border-top:1px solid var(--uk2-border); border-bottom:1px solid var(--uk2-border); background:var(--uk2-surface); }
//         .uk2-trust-inner { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); }
//         @media (max-width:700px) { .uk2-trust-inner { grid-template-columns:repeat(2,1fr); } }
//         .uk2-trust-item { display:flex; align-items:center; gap:14px; padding:18px 28px; border-right:1px solid var(--uk2-border); }
//         .uk2-trust-item:last-child { border-right:none; }
//         .uk2-trust-icon { width:36px; height:36px; background:var(--uk2-accent-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--uk2-accent); flex-shrink:0; }
//         .uk2-trust-title { font-size:12px; font-weight:700; letter-spacing:0.03em; color:var(--uk2-ink); }
//         .uk2-trust-sub { font-size:11px; color:var(--uk2-ink-faint); margin-top:1px; }

//         /* SECTION */
//         .uk2-section { max-width:1280px; margin:0 auto; padding:64px 40px; }
//         @media (max-width:700px) { .uk2-section { padding:48px 20px; } }
//         .uk2-section-head { text-align:center; margin-bottom:40px; }
//         .uk2-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:12px; }
//         .uk2-section-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.8rem,3vw,2.8rem); font-weight:600; color:var(--uk2-ink); letter-spacing:-0.01em; }
//         .uk2-section-sub { font-size:14px; color:var(--uk2-ink-faint); margin-top:8px; }
//         .uk2-divider { height:1px; background:linear-gradient(to right,transparent,var(--uk2-border) 20%,var(--uk2-border) 80%,transparent); max-width:1280px; margin:0 auto; }

//         /* CATEGORIES */
//         .uk2-cats-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
//         @media (max-width:900px) { .uk2-cats-grid { grid-template-columns:repeat(3,1fr); } }
//         @media (max-width:500px) { .uk2-cats-grid { grid-template-columns:repeat(2,1fr); } }
//         .uk2-cat-tile { cursor:pointer; text-align:center; transition:transform 0.25s ease; }
//         .uk2-cat-tile:hover { transform:translateY(-3px); }
//         .uk2-cat-img-wrap { aspect-ratio:3/4; border-radius:2px; overflow:hidden; background:#f0ede8; margin-bottom:10px; position:relative; }
//         .uk2-cat-img-wrap img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease; }
//         .uk2-cat-tile:hover .uk2-cat-img-wrap img { transform:scale(1.06); }
//         .uk2-cat-img-wrap::after { content:''; position:absolute; inset:0; background:linear-gradient(to top,rgba(28,25,23,0.35),transparent 50%); }
//         .uk2-cat-name { font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--uk2-ink); }
//         .uk2-cat-count { font-size:11px; color:var(--uk2-ink-faint); margin-top:2px; }

//         /* COLLECTIONS */
//         .uk2-collections-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
//         @media (max-width:700px) { .uk2-collections-grid { grid-template-columns:1fr; } }
//         .uk2-collection-tile { border-radius:2px; overflow:hidden; position:relative; height:380px; cursor:pointer; transition:transform 0.3s ease; }
//         .uk2-collection-tile:hover { transform:scale(0.995); }
//         .uk2-collection-content { position:relative; z-index:2; padding:44px; height:100%; display:flex; flex-direction:column; justify-content:space-between; }
//         .uk2-collection-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:10px; }
//         .uk2-collection-h { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:600; line-height:1.1; margin-bottom:8px; }
//         .uk2-collection-sub { font-size:13px; opacity:0.75; }
//         .uk2-collection-btn { align-self:flex-start; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:11px 24px; border:none; cursor:pointer; transition:all 0.2s ease; }

//         /* TRENDS */
//         .uk2-trend-tabs { display:flex; justify-content:center; border-bottom:1px solid var(--uk2-border); margin-bottom:32px; }
//         .uk2-trend-tab { padding:12px 28px; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; background:transparent; border:none; border-bottom:2px solid transparent; cursor:pointer; transition:all 0.2s; margin-bottom:-1px; color:var(--uk2-ink-faint); }
//         .uk2-trend-tab.active { color:var(--uk2-ink); border-bottom-color:var(--uk2-accent); }
//         .uk2-trend-tab:hover:not(.active) { color:var(--uk2-ink-muted); }
//         .uk2-trend-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
//         @media (max-width:900px) { .uk2-trend-grid { grid-template-columns:repeat(2,1fr); } }
//         .uk2-trend-nav { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
//         .uk2-trend-arrow { width:36px; height:36px; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; }
//         .uk2-trend-arrow:hover { background:var(--uk2-ink); color:white; border-color:var(--uk2-ink); }
//         .uk2-trend-arrow:disabled { opacity:0.3; cursor:not-allowed; }
//         .uk2-trend-arrow:disabled:hover { background:white; color:var(--uk2-ink); border-color:var(--uk2-border); }
//         .uk2-trend-card { background:white; border:1px solid var(--uk2-border); cursor:pointer; transition:all 0.25s ease; overflow:hidden; }
//         .uk2-trend-card:hover { border-color:var(--uk2-accent); box-shadow:0 8px 32px rgba(28,25,23,0.1); transform:translateY(-2px); }
//         .uk2-trend-img-wrap { height:300px; overflow:hidden; position:relative; background:#f5f2ec; }
//         .uk2-trend-discount { position:absolute; top:12px; left:12px; background:var(--uk2-ink); color:white; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; }
//         .uk2-trend-quick-view { position:absolute; bottom:12px; right:12px; background:white; color:var(--uk2-ink); font-size:10px; font-weight:700; letter-spacing:0.08em; padding:6px 14px; opacity:0; transform:translateY(6px); transition:all 0.2s ease; }
//         .uk2-trend-card:hover .uk2-trend-quick-view { opacity:1; transform:translateY(0); }
//         .uk2-trend-body { padding:16px; }
//         .uk2-trend-name { font-size:13px; font-weight:500; color:var(--uk2-ink); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:8px; }
//         .uk2-trend-price-row { display:flex; align-items:baseline; gap:8px; }
//         .uk2-trend-price { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--uk2-ink); }

//         /* PRODUCTS SECTION */
//         #products-section { max-width:1280px; margin:0 auto; padding:48px 40px 64px; }
//         @media (max-width:700px) { #products-section { padding:32px 20px 48px; } }

//         /* TOOLBAR */
//         .uk2-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 20px; border:1px solid var(--uk2-border); background:white; margin-bottom:24px; }
//         .uk2-toolbar-left { display:flex; align-items:center; gap:10px; overflow-x:auto; padding-bottom:2px; }
//         .uk2-toolbar-left::-webkit-scrollbar { display:none; }
//         .uk2-toolbar-right { display:flex; align-items:center; gap:12px; flex-shrink:0; }
//         .uk2-cat-pill { white-space:nowrap; padding:7px 16px; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink-muted); cursor:pointer; transition:all 0.2s; }
//         .uk2-cat-pill:hover { border-color:var(--uk2-ink); color:var(--uk2-ink); }
//         .uk2-cat-pill.active { background:var(--uk2-ink); color:white; border-color:var(--uk2-ink); }
//         .uk2-sort-select { font-family:'Jost',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; padding:8px 28px 8px 14px; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink); cursor:pointer; outline:none; appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%231c1917'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
//         .uk2-sort-select:focus { border-color:var(--uk2-accent); }
//         .uk2-results-count { font-size:11px; font-weight:500; letter-spacing:0.04em; color:var(--uk2-ink-faint); white-space:nowrap; }
//         .uk2-clear-btn { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--uk2-ink-muted); background:none; border:1px solid var(--uk2-border); padding:7px 14px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.2s; }
//         .uk2-clear-btn:hover { border-color:var(--uk2-ink); color:var(--uk2-ink); }

//         /* PRODUCT GRID */
//         .uk2-product-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
//         @media (max-width:1100px) { .uk2-product-grid { grid-template-columns:repeat(3,1fr); } }
//         @media (max-width:700px) { .uk2-product-grid { grid-template-columns:repeat(2,1fr); gap:12px; } }

//         /* PRODUCT CARD */
//         .uk2-card { background:white; border:1px solid var(--uk2-border); cursor:pointer; transition:all 0.25s ease; display:flex; flex-direction:column; overflow:hidden; position:relative; }
//         .uk2-card:hover { border-color:var(--uk2-accent); box-shadow:0 10px 40px rgba(28,25,23,0.1); transform:translateY(-3px); }
//         .uk2-card-img-wrap { position:relative; height:280px; overflow:hidden; background:#f5f2ec; }
//         .uk2-card-img-skeleton { position:absolute; inset:0; background:#ede9e4; animation:pulse 1.5s ease-in-out infinite; }
//         @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
//         .uk2-card-img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:16px; transition:transform 0.5s ease; }
//         .uk2-card:hover .uk2-card-img { transform:scale(1.05); }
//         .uk2-badge-stack { position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:4px; z-index:2; }
//         .uk2-badge { font-size:9px; font-weight:800; letter-spacing:0.08em; padding:3px 8px; }
//         .uk2-badge-custom { background:#1c7c6c; color:white; }
//         .uk2-badge-sold { background:var(--uk2-ink); color:white; }
//         .uk2-badge-low { background:#f59e0b; color:white; }
//         .uk2-discount-badge { position:absolute; top:10px; right:10px; background:#b91c1c; color:white; font-size:9px; font-weight:800; letter-spacing:0.06em; padding:3px 8px; z-index:2; }
//         .uk2-card-overlay { position:absolute; bottom:0; left:0; right:0; background:white; border-top:1px solid var(--uk2-border); padding:10px 12px; display:flex; gap:8px; transform:translateY(100%); transition:transform 0.28s cubic-bezier(0.22,1,0.36,1); z-index:3; }
//         .uk2-card:hover .uk2-card-overlay { transform:translateY(0); }
//         .uk2-overlay-btn { flex:1; padding:8px 0; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all 0.18s; }
//         .uk2-overlay-btn--add { background:var(--uk2-ink); color:white; }
//         .uk2-overlay-btn--add:hover { background:#2d2926; }
//         .uk2-overlay-btn--buy { background:var(--uk2-accent); color:white; }
//         .uk2-overlay-btn--buy:hover { background:var(--uk2-accent-dark); }
//         .uk2-overlay-btn--incart { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; cursor:default; }
//         .uk2-overlay-btn--disabled { background:#f4f4f5; color:#a1a1aa; cursor:not-allowed; }
//         .uk2-card-body { padding:14px 16px 16px; flex:1; display:flex; flex-direction:column; }
//         .uk2-card-cat { font-size:9px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:5px; }
//         .uk2-card-name { font-size:13px; font-weight:500; color:var(--uk2-ink); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.6em; margin-bottom:8px; }
//         .uk2-stars { display:flex; align-items:center; gap:2px; margin-bottom:10px; }
//         .uk2-reviews { font-size:10px; color:var(--uk2-ink-faint); margin-left:4px; }
//         .uk2-price-row { display:flex; align-items:baseline; gap:8px; margin-top:auto; }
//         .uk2-price { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:600; color:var(--uk2-ink); }
//         .uk2-price--oos { color:var(--uk2-ink-faint); }
//         .uk2-mrp { font-size:12px; color:var(--uk2-ink-faint); text-decoration:line-through; }
//         .uk2-save { font-size:10px; color:#16a34a; font-weight:700; margin-top:2px; }

//         /* LOAD MORE */
//         .uk2-load-more-wrap { display:flex; justify-content:center; margin-top:48px; }
//         .uk2-load-more-btn { font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:14px 40px; border:1.5px solid var(--uk2-ink); background:transparent; color:var(--uk2-ink); cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s; }
//         .uk2-load-more-btn:hover { background:var(--uk2-ink); color:white; }

//         /* EMPTY */
//         .uk2-empty { text-align:center; padding:80px 40px; border:1px dashed var(--uk2-border); background:white; }
//         .uk2-empty-icon { font-size:3rem; margin-bottom:16px; }
//         .uk2-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; color:var(--uk2-ink); margin-bottom:8px; }
//         .uk2-empty-sub { font-size:13px; color:var(--uk2-ink-faint); margin-bottom:24px; }

//         /* FOOTER CTA */
//         .uk2-footer-cta { background:var(--uk2-dark); position:relative; overflow:hidden; margin-top:64px; }
//         .uk2-footer-cta-inner { max-width:640px; margin:0 auto; text-align:center; padding:80px 40px; position:relative; z-index:2; }
//         .uk2-footer-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:16px; }
//         .uk2-footer-h { font-family:'Cormorant Garamond',serif; font-size:2.8rem; font-weight:600; color:white; line-height:1.15; margin-bottom:16px; }
//         .uk2-footer-h em { color:var(--uk2-accent); font-style:italic; }
//         .uk2-footer-sub { font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:32px; line-height:1.6; }
//         .uk2-footer-btn { background:white; color:var(--uk2-ink); font-family:'Jost',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:14px 36px; border:none; cursor:pointer; transition:all 0.2s; }
//         .uk2-footer-btn:hover { background:var(--uk2-accent); color:white; }

//         /* ANIMATIONS */
//         @keyframes uk2-fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes uk2-fadeIn { from{opacity:0} to{opacity:1} }
//         @keyframes uk2-cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
//         .uk2-anim-1 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.05s both; }
//         .uk2-anim-2 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.18s both; }
//         .uk2-anim-3 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.3s both; }
//         .uk2-anim-4 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.42s both; }
//         .uk2-anim-r { animation:uk2-fadeIn 0.7s ease 0.25s both; }
//       `}</style>

//             {/* ANNOUNCEMENT BAR */}
//             <div className="uk2-announce">
//                 <div style={{ overflow: "hidden" }}>
//                     <div className="uk2-marquee-track">
//                         {["Free Delivery on orders above ₹499", "New arrivals every week", "Easy 7-day returns", "Secure payments", "Pan-India delivery", "Exclusive member offers",
//                             "Free Delivery on orders above ₹499", "New arrivals every week", "Easy 7-day returns", "Secure payments", "Pan-India delivery", "Exclusive member offers"
//                         ].map((t, i) => <span key={i}>{t} &nbsp;·&nbsp;</span>)}
//                     </div>
//                 </div>
//             </div>

//             {/* HERO */}
//             {!isFiltered && (
//                 <section className="uk2-hero">
//                     <div className="uk2-hero-inner">
//                         <div>
//                             <p className="uk2-hero-eyebrow uk2-anim-1">UrbeXon · Premium E-Commerce</p>
//                             <h1 className="uk2-hero-h1 uk2-anim-2">
//                                 Shop The<br /><em>Trend.</em><br />
//                                 <span style={{ opacity: 0.3, fontSize: "55%" }}>Live The Trend.</span>
//                             </h1>
//                             <p className="uk2-hero-sub uk2-anim-3">
//                                 Discover fashion, electronics, and lifestyle products handpicked for you. Premium quality, unbeatable prices — delivered to your door.
//                             </p>
//                             <div className="uk2-hero-btns uk2-anim-4">
//                                 <button onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })} className="uk2-btn-primary">
//                                     Shop Now <FaArrowRight size={11} />
//                                 </button>
//                                 <button
//                                     onClick={() => { setCustomizableFilter(); setTimeout(() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" }), 100); }}
//                                     className="uk2-btn-outline"
//                                 >
//                                     <FaBolt size={10} /> Explore Deals
//                                 </button>
//                             </div>
//                             <div className="uk2-hero-stats uk2-anim-4">
//                                 {[
//                                     { val: `${allProducts.length}+`, label: "Products" },
//                                     { val: `${categories.length}+`, label: "Categories" },
//                                     { val: "7-Day", label: "Returns" },
//                                     { val: "Pan-India", label: "Delivery" },
//                                 ].map(({ val, label }) => (
//                                     <div key={label}>
//                                         <p className="uk2-stat-val">{val}</p>
//                                         <p className="uk2-stat-label">{label}</p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="uk2-hero-grid uk2-anim-r">
//                             <div className="uk2-hero-tile" style={{ height: 460, gridRow: "span 2" }} onClick={() => categoryDisplayData[0] && setCategory(categoryDisplayData[0].cat)}>
//                                 {categoryDisplayData[0]?.img
//                                     ? <img src={categoryDisplayData[0].img} alt={categoryDisplayData[0]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
//                                     : <div style={{ width: "100%", height: "100%", background: "#e8e4dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🛍️</div>
//                                 }
//                                 <div className="uk2-hero-tile-overlay" />
//                                 <div className="uk2-hero-tile-label">
//                                     <span>Featured</span>
//                                     {categoryDisplayData[0]?.cat ? formatCat(categoryDisplayData[0].cat) : "All Products"}
//                                 </div>
//                             </div>
//                             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                                 <div className="uk2-hero-tile" style={{ height: 220 }} onClick={() => categoryDisplayData[1] && setCategory(categoryDisplayData[1].cat)}>
//                                     {categoryDisplayData[1]?.img
//                                         ? <img src={categoryDisplayData[1].img} alt={categoryDisplayData[1]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
//                                         : <div style={{ width: "100%", height: "100%", background: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>✨</div>
//                                     }
//                                     <div className="uk2-hero-tile-overlay" />
//                                     <div className="uk2-hero-tile-label">
//                                         <span>Explore</span>
//                                         {categoryDisplayData[1]?.cat ? formatCat(categoryDisplayData[1].cat) : "New Arrivals"}
//                                     </div>
//                                 </div>
//                                 <div className="uk2-hero-tile" style={{ height: 220 }} onClick={() => categoryDisplayData[2] && setCategory(categoryDisplayData[2].cat)}>
//                                     {categoryDisplayData[2]?.img
//                                         ? <img src={categoryDisplayData[2].img} alt={categoryDisplayData[2]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
//                                         : <div style={{ width: "100%", height: "100%", background: "#e8f0ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>🔥</div>
//                                     }
//                                     <div className="uk2-hero-tile-overlay" />
//                                     <div className="uk2-hero-tile-label">
//                                         <span>Trending</span>
//                                         {categoryDisplayData[2]?.cat ? formatCat(categoryDisplayData[2].cat) : "Trending Now"}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//             )}

//             {/* TRUST BAR */}
//             {!isFiltered && (
//                 <div className="uk2-trust">
//                     <div className="uk2-trust-inner">
//                         {[
//                             { icon: <FaTruck size={14} />, title: "Free Delivery", sub: "On orders above ₹499" },
//                             { icon: <FaShieldAlt size={14} />, title: "Secure Payments", sub: "100% safe & encrypted" },
//                             { icon: <FaUndo size={14} />, title: "Easy Returns", sub: "7-day hassle-free return" },
//                             { icon: <FaBolt size={14} />, title: "Fast Dispatch", sub: "Same day processing" },
//                         ].map(({ icon, title, sub }) => (
//                             <div key={title} className="uk2-trust-item">
//                                 <div className="uk2-trust-icon">{icon}</div>
//                                 <div>
//                                     <p className="uk2-trust-title">{title}</p>
//                                     <p className="uk2-trust-sub">{sub}</p>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* BROWSE CATEGORIES */}
//             {!isFiltered && categoryDisplayData.length > 0 && (
//                 <section className="uk2-section">
//                     <div className="uk2-section-head">
//                         <p className="uk2-eyebrow">Explore</p>
//                         <h2 className="uk2-section-title">Browse Our Curated Selections</h2>
//                     </div>
//                     <div className="uk2-cats-grid">
//                         {categoryDisplayData.map(({ cat, img, count }) => (
//                             <div key={cat} className="uk2-cat-tile" onClick={() => setCategory(cat)}>
//                                 <div className="uk2-cat-img-wrap">
//                                     {img ? <img src={img} alt={cat} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>🛍️</div>}
//                                 </div>
//                                 <p className="uk2-cat-name">{formatCat(cat)}</p>
//                                 <p className="uk2-cat-count">{count} items</p>
//                             </div>
//                         ))}
//                     </div>
//                 </section>
//             )}

//             <div className="uk2-divider" />

//             {/* SEASONAL COLLECTIONS */}
//             {!isFiltered && (
//                 <section className="uk2-section">
//                     <div className="uk2-section-head">
//                         <p className="uk2-eyebrow">Collections</p>
//                         <h2 className="uk2-section-title">Shop The Season</h2>
//                     </div>
//                     <div className="uk2-collections-grid">
//                         <div className="uk2-collection-tile" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }} onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}>
//                             <div className="uk2-collection-content">
//                                 <div>
//                                     <p className="uk2-collection-eyebrow" style={{ color: "#92400e" }}>Season Sale</p>
//                                     <h3 className="uk2-collection-h" style={{ color: "#92400e" }}>Flirting With<br />Summer</h3>
//                                     <p className="uk2-collection-sub" style={{ color: "#b45309" }}>Checkout offers and deals on summer staples</p>
//                                 </div>
//                                 <button className="uk2-collection-btn" style={{ background: "#92400e", color: "white" }}>Shop Now →</button>
//                             </div>
//                         </div>
//                         <div className="uk2-collection-tile" style={{ background: "linear-gradient(135deg,#dbeafe,#93c5fd)" }} onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}>
//                             <div className="uk2-collection-content">
//                                 <div>
//                                     <p className="uk2-collection-eyebrow" style={{ color: "#1e40af" }}>Season Sale</p>
//                                     <h3 className="uk2-collection-h" style={{ color: "#1e3a8a" }}>Get Cozy With<br />Winter Favourites</h3>
//                                     <p className="uk2-collection-sub" style={{ color: "#1d4ed8" }}>Checkout offers and deals on winter staples</p>
//                                 </div>
//                                 <button className="uk2-collection-btn" style={{ background: "#1e3a8a", color: "white" }}>Shop Now →</button>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//             )}

//             <div className="uk2-divider" />

//             {/* SHOP TRENDS */}
//             {!isFiltered && trendProducts.length > 0 && (
//                 <section className="uk2-section">
//                     <div className="uk2-section-head">
//                         <p className="uk2-eyebrow">Trending Now</p>
//                         <h2 className="uk2-section-title">Shop Trends</h2>
//                         <p className="uk2-section-sub">Hot selling and trending products</p>
//                     </div>
//                     <div className="uk2-trend-tabs">
//                         {[
//                             { key: "bestselling", label: "Best Selling" },
//                             { key: "newarrival", label: "New Arrival" },
//                             { key: "toptrending", label: "Top Trending" },
//                         ].map(({ key, label }) => (
//                             <button key={key} onClick={() => { setTrendTab(key); setTrendOffset(0); }} className={`uk2-trend-tab ${trendTab === key ? "active" : ""}`}>
//                                 {label}
//                             </button>
//                         ))}
//                     </div>
//                     <div className="uk2-trend-grid">
//                         {visibleTrend.map(product => (
//                             <TrendCard key={product._id} product={product} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
//                         ))}
//                     </div>
//                     <div className="uk2-trend-nav">
//                         <button onClick={() => setTrendOffset(o => Math.max(0, o - TREND_VISIBLE))} disabled={trendOffset === 0} className="uk2-trend-arrow">
//                             <FaChevronLeft size={11} />
//                         </button>
//                         <button onClick={() => setTrendOffset(o => Math.min(trendProducts.length - TREND_VISIBLE, o + TREND_VISIBLE))} disabled={trendOffset + TREND_VISIBLE >= trendProducts.length} className="uk2-trend-arrow">
//                             <FaChevronRight size={11} />
//                         </button>
//                     </div>
//                 </section>
//             )}

//             <div className="uk2-divider" />

//             {/* ALL PRODUCTS */}
//             <div id="products-section">
//                 {/* Toolbar */}
//                 {!loading && (
//                     <div className="uk2-toolbar">
//                         <div className="uk2-toolbar-left">
//                             {/* ✅ All button */}
//                             <button onClick={clearFilters} className={`uk2-cat-pill ${isAllActive ? "active" : ""}`}>All</button>

//                             {/* ✅ Deals pill */}
//                             <button onClick={() => setSearchParams({ deals: "true" })} className={`uk2-cat-pill ${showDeals ? "active" : ""}`}>
//                                 🔥 Deals
//                             </button>

//                             {/* Customizable */}
//                             {customizableCount > 0 && (
//                                 <button onClick={setCustomizableFilter} className={`uk2-cat-pill ${showCustomizable ? "active" : ""}`}>
//                                     ✏ Customizable ({customizableCount})
//                                 </button>
//                             )}

//                             {/* ✅ Dynamic categories from backend */}
//                             {categories.map(cat => (
//                                 <button key={cat} onClick={() => setCategory(cat)} className={`uk2-cat-pill ${activeCategory === cat ? "active" : ""}`}>
//                                     {formatCat(cat)}
//                                 </button>
//                             ))}
//                         </div>
//                         <div className="uk2-toolbar-right">
//                             <span className="uk2-results-count">{products.length} products</span>
//                             <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="uk2-sort-select">
//                                 <option value="default">Sort: Default</option>
//                                 <option value="price-asc">Price: Low → High</option>
//                                 <option value="price-desc">Price: High → Low</option>
//                                 <option value="rating">Top Rated</option>
//                                 <option value="newest">Newest First</option>
//                             </select>
//                             {isFiltered && (
//                                 <button onClick={clearFilters} className="uk2-clear-btn">
//                                     <FaTimes size={9} /> Clear
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 {/* Section Heading */}
//                 <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 20px" }}>
//                     <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 600, color: "var(--uk2-ink)", display: "flex", alignItems: "center", gap: 10 }}>
//                         {searchQuery ? (
//                             <><FaSearch size={15} style={{ color: "var(--uk2-accent)" }} /> Results for "{searchQuery}"</>
//                         ) : showDeals ? (
//                             <>🔥 Deals & Offers</>
//                         ) : showCustomizable ? (
//                             <>✏ Customizable Products</>
//                         ) : activeCategory ? (
//                             <><FaFire size={15} style={{ color: "var(--uk2-accent)" }} /> {formatCat(activeCategory)}</>
//                         ) : (
//                             <><FaFire size={15} style={{ color: "var(--uk2-accent)" }} /> All Products</>
//                         )}
//                     </h2>
//                 </div>

//                 {/* Error */}
//                 {error && (
//                     <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 24px" }}>
//                         <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                             <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>⚠️ {error}</p>
//                             <button onClick={() => dispatch(fetchProducts({ search: searchQuery, category: activeCategory }))} className="uk2-btn-primary" style={{ fontSize: 11, padding: "8px 20px" }}>Retry</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Skeletons */}
//                 {loading && (
//                     <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
//                         <div className="uk2-product-grid">
//                             {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
//                         </div>
//                     </div>
//                 )}

//                 {/* Empty */}
//                 {!loading && !error && products.length === 0 && (
//                     <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
//                         <div className="uk2-empty">
//                             <p className="uk2-empty-icon">{showDeals ? "🔥" : showCustomizable ? "✏️" : "🛍️"}</p>
//                             <p className="uk2-empty-title">No products found</p>
//                             <p className="uk2-empty-sub">
//                                 {showDeals ? "No deals available right now." : showCustomizable ? "No customizable products available right now." : "Try a different search or category."}
//                             </p>
//                             <button onClick={clearFilters} className="uk2-btn-primary">Browse All Products</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* Products Grid */}
//                 {!loading && !error && products.length > 0 && (
//                     <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
//                         <div ref={gridRef} className="uk2-product-grid">
//                             {visibleProducts.map((product, i) => (
//                                 <ProductCard
//                                     key={product._id}
//                                     product={product}
//                                     onAddToCart={handleAddToCart}
//                                     onBuyNow={handleBuyNow}
//                                     style={gridInView ? {
//                                         animation: `uk2-cardIn 0.45s cubic-bezier(.22,1,.36,1) ${Math.min(i % PAGE_SIZE, 7) * 0.06}s both`
//                                     } : {}}
//                                 />
//                             ))}
//                         </div>
//                         {hasMore && (
//                             <div className="uk2-load-more-wrap">
//                                 <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} className="uk2-load-more-btn">
//                                     Load More
//                                     <span style={{ fontSize: 10, color: "var(--uk2-ink-faint)", fontWeight: 500, letterSpacing: 0 }}>
//                                         ({products.length - visibleCount} remaining)
//                                     </span>
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* FOOTER CTA */}
//             {!isFiltered && (
//                 <div className="uk2-footer-cta">
//                     <div className="uk2-footer-cta-inner">
//                         <p className="uk2-footer-eyebrow">UrbeXon</p>
//                         <h2 className="uk2-footer-h">Your Style, <em>Your Way.</em></h2>
//                         <p className="uk2-footer-sub">Pan-India delivery · Secure payments · 7-day hassle-free returns</p>
//                         <button onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })} className="uk2-footer-btn">
//                             Start Shopping →
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Home;

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useCart } from "../hooks/useCart";
import { imgUrl } from "../utils/imageUrl";
import Footer from "../components/Footer";
import {
    FaStar, FaRegStar, FaSearch, FaFire,
    FaShoppingCart, FaBolt,
    FaTruck, FaShieldAlt, FaUndo, FaArrowRight,
    FaChevronLeft, FaChevronRight, FaTimes,
} from "react-icons/fa";

const PAGE_SIZE = 12;

const useInView = (threshold = 0.1) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
};

const SkeletonCard = () => (
    <div className="uk2-card animate-pulse">
        <div style={{ height: 220, background: "#f0ede8" }} />
        <div className="uk2-card-body">
            <div style={{ height: 13, background: "#ede9e4", borderRadius: 4, width: "70%", marginBottom: 8 }} />
            <div style={{ height: 11, background: "#f0ede8", borderRadius: 4, width: "45%" }} />
            <div style={{ height: 22, background: "#ede9e4", borderRadius: 4, width: "35%", marginTop: 12 }} />
        </div>
    </div>
);

const ProductCard = ({ product, onAddToCart, onBuyNow, style }) => {
    const navigate = useNavigate();
    const { cartItems } = useCart();
    const inCart = cartItems.some(i => i._id === product._id);
    const imageUrl = imgUrl.card(product.images?.[0]?.url || "");
    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const [imgLoaded, setImgLoaded] = useState(false);

    const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
    const discountPct = hasDiscount
        ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
        : null;
    const isOutOfStock = product.inStock === false;
    const stockNum = Number(product.stock ?? 0);
    const isLowStock = !isOutOfStock && stockNum > 0 && stockNum <= 5;

    return (
        <div onClick={() => navigate(`/products/${product.slug || product._id}`)} style={style} className="uk2-card group">
            <div className="uk2-card-img-wrap">
                {!imgLoaded && <div className="uk2-card-img-skeleton" />}
                <img
                    src={imageUrl || "https://via.placeholder.com/400x400?text=No+Image"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={400} height={400}
                    onLoad={() => setImgLoaded(true)}
                    onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
                    className={`uk2-card-img ${imgLoaded ? "opacity-100" : "opacity-0"} ${isOutOfStock ? "grayscale opacity-60" : ""}`}
                />
                <div className="uk2-badge-stack">
                    {product.isCustomizable && !isOutOfStock && <span className="uk2-badge uk2-badge-custom">✏ CUSTOM</span>}
                    {isOutOfStock && <span className="uk2-badge uk2-badge-sold">SOLD OUT</span>}
                    {isLowStock && !isOutOfStock && <span className="uk2-badge uk2-badge-low">⚡ {stockNum} LEFT</span>}
                </div>
                {hasDiscount && !isOutOfStock && <div className="uk2-discount-badge">{discountPct}% OFF</div>}
                <div className="uk2-card-overlay">
                    <button
                        onClick={e => { e.stopPropagation(); if (!inCart && !isOutOfStock) onAddToCart(product); }}
                        disabled={inCart || isOutOfStock}
                        className={`uk2-overlay-btn ${inCart ? "uk2-overlay-btn--incart" : isOutOfStock ? "uk2-overlay-btn--disabled" : "uk2-overlay-btn--add"}`}
                    >
                        {inCart ? "✓ In Cart" : <><FaShoppingCart size={11} /> Add to Cart</>}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (!isOutOfStock) onBuyNow(product); }} disabled={isOutOfStock} className="uk2-overlay-btn uk2-overlay-btn--buy">
                        Buy Now →
                    </button>
                </div>
            </div>
            <div className="uk2-card-body">
                <p className="uk2-card-cat">{product.category || "General"}</p>
                <h3 className="uk2-card-name">{product.name}</h3>
                {numReviews > 0 ? (
                    <div className="uk2-stars">
                        {[1, 2, 3, 4, 5].map(s => s <= Math.round(rating) ? <FaStar key={s} size={9} className="text-amber-400" /> : <FaRegStar key={s} size={9} className="text-stone-300" />)}
                        <span className="uk2-reviews">({numReviews})</span>
                    </div>
                ) : (
                    <div className="uk2-stars">
                        {[1, 2, 3, 4, 5].map(s => <FaRegStar key={s} size={9} className="text-stone-200" />)}
                        <span className="uk2-reviews" style={{ color: "#ccc" }}>No reviews</span>
                    </div>
                )}
                <div className="uk2-price-row">
                    <span className={`uk2-price ${isOutOfStock ? "uk2-price--oos" : ""}`}>₹{Number(product.price).toLocaleString("en-IN")}</span>
                    {hasDiscount && !isOutOfStock && <span className="uk2-mrp">₹{Number(product.mrp).toLocaleString("en-IN")}</span>}
                </div>
                {hasDiscount && !isOutOfStock && <p className="uk2-save">Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}</p>}
            </div>
        </div>
    );
};

const TrendCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const imageUrl = imgUrl.card(product.images?.[0]?.url || "");
    const [imgLoaded, setImgLoaded] = useState(false);
    const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
    const discountPct = hasDiscount ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100) : null;
    const isOutOfStock = product.inStock === false;

    return (
        <div onClick={() => navigate(`/products/${product.slug || product._id}`)} className="uk2-trend-card group">
            <div className="uk2-trend-img-wrap">
                {!imgLoaded && <div className="uk2-card-img-skeleton" />}
                <img
                    src={imageUrl || "https://via.placeholder.com/400x600?text=No+Image"}
                    alt={product.name}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    onError={e => { e.target.src = "https://via.placeholder.com/400x600?text=No+Image"; setImgLoaded(true); }}
                    className={`uk2-trend-img ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
                {hasDiscount && !isOutOfStock && <span className="uk2-trend-discount">{discountPct}% OFF</span>}
                <div className="uk2-trend-quick-view">Quick View ↗</div>
            </div>
            <div className="uk2-trend-body">
                <p className="uk2-card-cat">{product.category || "General"}</p>
                <p className="uk2-trend-name">{product.name}</p>
                <div className="uk2-trend-price-row">
                    <span className="uk2-trend-price">₹{Number(product.price).toLocaleString("en-IN")}</span>
                    {hasDiscount && !isOutOfStock && <span className="uk2-mrp">₹{Number(product.mrp).toLocaleString("en-IN")}</span>}
                </div>
            </div>
        </div>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const searchQuery = searchParams.get("search") || "";
    const activeCategory = searchParams.get("category") || "";
    const showCustomizable = searchParams.get("customizable") === "true";
    const showDeals = searchParams.get("deals") === "true";

    const { addItem } = useCart();
    const allProducts = useSelector(s => s.products.items);
    const status = useSelector(s => s.products.status);
    const reduxError = useSelector(s => s.products.error);
    const loading = status === "loading" || status === "idle";
    const error = reduxError || "";

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [trendTab, setTrendTab] = useState("bestselling");
    const [trendOffset, setTrendOffset] = useState(0);
    const [sortBy, setSortBy] = useState("default");
    const TREND_VISIBLE = 4;
    const [gridRef, gridInView] = useInView(0.05);

    useEffect(() => {
        document.title = "UrbeXon | Premium Online Shopping";
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content", "Shop at UrbeXon for the best deals on fashion, electronics, and more.");
    }, []);

    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, activeCategory, showCustomizable, showDeals, sortBy]);

    useEffect(() => {
        if (showDeals) dispatch(fetchProducts({ deals: "true" }));
        else dispatch(fetchProducts({ search: searchQuery, category: activeCategory }));
    }, [dispatch, searchQuery, activeCategory, showDeals]);

    const products = useMemo(() => {
        let filtered = [...allProducts];
        if (showCustomizable) filtered = filtered.filter(p => p.isCustomizable === true);
        if (sortBy === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
        else if (sortBy === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
        else if (sortBy === "rating") filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        else if (sortBy === "newest") filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return filtered;
    }, [allProducts, showCustomizable, sortBy]);

    const customizableCount = useMemo(() => allProducts.filter(p => p.isCustomizable).length, [allProducts]);
    const categories = useMemo(() => [...new Set(allProducts.map(p => p.category).filter(Boolean))], [allProducts]);

    const trendProducts = useMemo(() => {
        if (trendTab === "bestselling") return [...allProducts].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
        if (trendTab === "newarrival") return [...allProducts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        if (trendTab === "toptrending") return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        return allProducts;
    }, [allProducts, trendTab]);

    const visibleTrend = trendProducts.slice(trendOffset, trendOffset + TREND_VISIBLE);
    const handleAddToCart = useCallback((product) => addItem(product), [addItem]);
    const handleBuyNow = useCallback((product) => { navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } }); }, [navigate]);

    const setCategory = useCallback((cat) => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (cat) params.category = cat;
        setSearchParams(params);
    }, [searchQuery, setSearchParams]);

    const setCustomizableFilter = useCallback(() => {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        params.customizable = "true";
        setSearchParams(params);
    }, [searchQuery, setSearchParams]);

    const clearFilters = useCallback(() => { setSearchParams({}); setSortBy("default"); }, [setSearchParams]);
    const formatCat = (cat) => cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    const isAllActive = !activeCategory && !showCustomizable && !showDeals;
    const visibleProducts = products.slice(0, visibleCount);
    const hasMore = visibleCount < products.length;
    const isFiltered = searchQuery || activeCategory || showCustomizable || showDeals;

    const categoryDisplayData = useMemo(() => {
        return categories.slice(0, 6).map((cat) => {
            const catProducts = allProducts.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
            const img = catProducts[0]?.images?.[0]?.url || "";
            return { cat, img: img ? imgUrl.card(img) : "", count: catProducts.length };
        });
    }, [categories, allProducts]);

    return (
        <div className="uk2-root">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600;700;800&display=swap');
        :root {
            --uk2-ink:#1c1917; --uk2-ink-muted:#78716c; --uk2-ink-faint:#a8a29e;
            --uk2-bg:#faf9f7; --uk2-surface:#ffffff; --uk2-border:#e7e5e1;
            --uk2-accent:#c8a96e; --uk2-accent-dark:#a8894e; --uk2-accent-bg:#fdf6ea;
            --uk2-dark:#1c1917;
        }
        .uk2-root { font-family:'Jost',sans-serif; background:var(--uk2-bg); color:var(--uk2-ink); min-height:100vh; }
        .uk2-announce { background:var(--uk2-dark); color:rgba(255,255,255,0.75); font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; padding:9px 0; overflow:hidden; }
        @keyframes uk2-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .uk2-marquee-track { display:flex; white-space:nowrap; animation:uk2-marquee 30s linear infinite; }
        .uk2-marquee-track span { padding:0 36px; }
        .uk2-hero { background:#f5f2ec; position:relative; overflow:hidden; }
        .uk2-hero-inner { max-width:1280px; margin:0 auto; padding:72px 40px 80px; display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
        @media (max-width:900px) { .uk2-hero-inner { grid-template-columns:1fr; padding:48px 20px 56px; gap:40px; } }
        .uk2-hero-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:20px; }
        .uk2-hero-h1 { font-family:'Cormorant Garamond',serif; font-size:clamp(3.2rem,6vw,5.5rem); font-weight:600; line-height:1.0; color:var(--uk2-ink); margin-bottom:24px; letter-spacing:-0.01em; }
        .uk2-hero-h1 em { color:var(--uk2-accent); font-style:italic; }
        .uk2-hero-sub { font-size:15px; font-weight:400; color:var(--uk2-ink-muted); line-height:1.7; max-width:420px; margin-bottom:36px; }
        .uk2-hero-btns { display:flex; gap:12px; flex-wrap:wrap; }
        .uk2-btn-primary { background:var(--uk2-ink); color:white; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:14px 32px; border:none; cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.25s ease; }
        .uk2-btn-primary:hover { background:#2d2926; transform:translateY(-1px); box-shadow:0 8px 24px rgba(28,25,23,0.2); }
        .uk2-btn-outline { background:transparent; color:var(--uk2-ink); font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:13px 32px; border:1.5px solid var(--uk2-ink); cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.25s ease; }
        .uk2-btn-outline:hover { background:var(--uk2-ink); color:white; }
        .uk2-hero-stats { display:flex; gap:36px; margin-top:48px; padding-top:32px; border-top:1px solid var(--uk2-border); }
        .uk2-stat-val { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--uk2-ink); }
        .uk2-stat-label { font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--uk2-ink-faint); margin-top:2px; }
        .uk2-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .uk2-hero-tile { border-radius:2px; overflow:hidden; position:relative; cursor:pointer; transition:transform 0.3s ease; }
        .uk2-hero-tile:hover { transform:scale(0.99); }
        .uk2-hero-tile img { width:100%; height:100%; object-fit:cover; display:block; }
        .uk2-hero-tile-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(28,25,23,0.65) 0%,transparent 55%); }
        .uk2-hero-tile-label { position:absolute; bottom:16px; left:16px; font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:white; line-height:1.2; }
        .uk2-hero-tile-label span { display:block; font-family:'Jost',sans-serif; font-size:10px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.65); margin-bottom:3px; }
        .uk2-trust { border-top:1px solid var(--uk2-border); border-bottom:1px solid var(--uk2-border); background:var(--uk2-surface); }
        .uk2-trust-inner { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); }
        @media (max-width:700px) { .uk2-trust-inner { grid-template-columns:repeat(2,1fr); } }
        .uk2-trust-item { display:flex; align-items:center; gap:14px; padding:18px 28px; border-right:1px solid var(--uk2-border); }
        .uk2-trust-item:last-child { border-right:none; }
        .uk2-trust-icon { width:36px; height:36px; background:var(--uk2-accent-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--uk2-accent); flex-shrink:0; }
        .uk2-trust-title { font-size:12px; font-weight:700; color:var(--uk2-ink); }
        .uk2-trust-sub { font-size:11px; color:var(--uk2-ink-faint); margin-top:1px; }
        .uk2-section { max-width:1280px; margin:0 auto; padding:64px 40px; }
        @media (max-width:700px) { .uk2-section { padding:48px 20px; } }
        .uk2-section-head { text-align:center; margin-bottom:40px; }
        .uk2-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:12px; }
        .uk2-section-title { font-family:'Cormorant Garamond',serif; font-size:clamp(1.8rem,3vw,2.8rem); font-weight:600; color:var(--uk2-ink); }
        .uk2-section-sub { font-size:14px; color:var(--uk2-ink-faint); margin-top:8px; }
        .uk2-divider { height:1px; background:linear-gradient(to right,transparent,var(--uk2-border) 20%,var(--uk2-border) 80%,transparent); max-width:1280px; margin:0 auto; }
        .uk2-cats-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
        @media (max-width:900px) { .uk2-cats-grid { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:500px) { .uk2-cats-grid { grid-template-columns:repeat(2,1fr); } }
        .uk2-cat-tile { cursor:pointer; text-align:center; transition:transform 0.25s ease; }
        .uk2-cat-tile:hover { transform:translateY(-3px); }
        .uk2-cat-img-wrap { aspect-ratio:3/4; border-radius:2px; overflow:hidden; background:#f0ede8; margin-bottom:10px; position:relative; }
        .uk2-cat-img-wrap img { width:100%; height:100%; object-fit:cover; object-position:top center; transition:transform 0.5s ease; }
        .uk2-cat-tile:hover .uk2-cat-img-wrap img { transform:scale(1.06); }
        .uk2-cat-img-wrap::after { content:''; position:absolute; inset:0; background:linear-gradient(to top,rgba(28,25,23,0.35),transparent 50%); }
        .uk2-cat-name { font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--uk2-ink); }
        .uk2-cat-count { font-size:11px; color:var(--uk2-ink-faint); margin-top:2px; }
        .uk2-collections-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media (max-width:700px) { .uk2-collections-grid { grid-template-columns:1fr; } }
        .uk2-collection-tile { border-radius:2px; overflow:hidden; position:relative; height:380px; cursor:pointer; transition:transform 0.3s ease; }
        .uk2-collection-tile:hover { transform:scale(0.995); }
        .uk2-collection-content { position:relative; z-index:2; padding:44px; height:100%; display:flex; flex-direction:column; justify-content:space-between; }
        .uk2-collection-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:10px; }
        .uk2-collection-h { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:600; line-height:1.1; margin-bottom:8px; }
        .uk2-collection-sub { font-size:13px; opacity:0.75; }
        .uk2-collection-btn { align-self:flex-start; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:11px 24px; border:none; cursor:pointer; transition:all 0.2s ease; }
        .uk2-trend-tabs { display:flex; justify-content:center; border-bottom:1px solid var(--uk2-border); margin-bottom:32px; }
        .uk2-trend-tab { padding:12px 28px; font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; background:transparent; border:none; border-bottom:2px solid transparent; cursor:pointer; transition:all 0.2s; margin-bottom:-1px; color:var(--uk2-ink-faint); }
        .uk2-trend-tab.active { color:var(--uk2-ink); border-bottom-color:var(--uk2-accent); }
        .uk2-trend-tab:hover:not(.active) { color:var(--uk2-ink-muted); }
        .uk2-trend-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media (max-width:900px) { .uk2-trend-grid { grid-template-columns:repeat(2,1fr); } }
        .uk2-trend-nav { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
        .uk2-trend-arrow { width:36px; height:36px; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; }
        .uk2-trend-arrow:hover { background:var(--uk2-ink); color:white; border-color:var(--uk2-ink); }
        .uk2-trend-arrow:disabled { opacity:0.3; cursor:not-allowed; }
        .uk2-trend-arrow:disabled:hover { background:white; color:var(--uk2-ink); border-color:var(--uk2-border); }
        .uk2-trend-card { background:white; border:1px solid var(--uk2-border); cursor:pointer; transition:all 0.25s ease; overflow:hidden; display:flex; flex-direction:column; }
        .uk2-trend-card:hover { border-color:var(--uk2-accent); box-shadow:0 8px 32px rgba(28,25,23,0.1); transform:translateY(-2px); }
        /* ✅ TREND IMAGE FIX */
        .uk2-trend-img-wrap { position:relative; height:280px; overflow:hidden; background:#ffffff; flex-shrink:0; border-bottom:1px solid var(--uk2-border); }
        .uk2-trend-img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:12px; transition:transform 0.5s ease; }
        .uk2-trend-card:hover .uk2-trend-img { transform:scale(1.04); }
        .uk2-trend-discount { position:absolute; top:10px; left:10px; background:var(--uk2-ink); color:white; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; z-index:2; }
        .uk2-trend-quick-view { position:absolute; bottom:10px; right:10px; background:white; color:var(--uk2-ink); font-size:10px; font-weight:700; padding:6px 14px; opacity:0; transform:translateY(6px); transition:all 0.2s ease; z-index:2; }
        .uk2-trend-card:hover .uk2-trend-quick-view { opacity:1; transform:translateY(0); }
        .uk2-trend-body { padding:14px; }
        .uk2-trend-name { font-size:13px; font-weight:500; color:var(--uk2-ink); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:8px; }
        .uk2-trend-price-row { display:flex; align-items:baseline; gap:8px; }
        .uk2-trend-price { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--uk2-ink); }
        #products-section { max-width:1280px; margin:0 auto; padding:48px 40px 64px; }
        @media (max-width:700px) { #products-section { padding:24px 12px 48px; } }
        .uk2-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 20px; border:1px solid var(--uk2-border); background:white; margin-bottom:24px; }
        .uk2-toolbar-left { display:flex; align-items:center; gap:8px; overflow-x:auto; padding-bottom:2px; flex:1; min-width:0; scrollbar-width:none; }
        .uk2-toolbar-left::-webkit-scrollbar { display:none; }
        .uk2-toolbar-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        @media (max-width:700px) {
            .uk2-toolbar { flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; }
            .uk2-toolbar-left { width:100%; }
            .uk2-toolbar-right { width:100%; justify-content:space-between; }
            .uk2-sort-select { flex:1; }
        }
        .uk2-cat-pill { white-space:nowrap; padding:6px 14px; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink-muted); cursor:pointer; transition:all 0.2s; }
        .uk2-cat-pill:hover { border-color:var(--uk2-ink); color:var(--uk2-ink); }
        .uk2-cat-pill.active { background:var(--uk2-ink); color:white; border-color:var(--uk2-ink); }
        .uk2-sort-select { font-family:'Jost',sans-serif; font-size:11px; font-weight:600; padding:8px 28px 8px 14px; border:1px solid var(--uk2-border); background:white; color:var(--uk2-ink); cursor:pointer; outline:none; appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%231c1917'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
        .uk2-results-count { font-size:11px; font-weight:500; color:var(--uk2-ink-faint); white-space:nowrap; }
        .uk2-clear-btn { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--uk2-ink-muted); background:none; border:1px solid var(--uk2-border); padding:6px 12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; white-space:nowrap; }
        .uk2-clear-btn:hover { border-color:var(--uk2-ink); color:var(--uk2-ink); }

        /* ✅ PRODUCT GRID */
        .uk2-product-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        @media (max-width:1100px) { .uk2-product-grid { grid-template-columns:repeat(3,1fr); gap:16px; } }
        @media (max-width:700px) { .uk2-product-grid { grid-template-columns:repeat(2,1fr); gap:10px; } }

        /* ✅ PRODUCT CARD — KEY FIXES:
           1. Fixed height (not aspect-ratio) — cards uniform height
           2. object-fit:contain — full image visible without cropping
           3. white background — no transparency issues
           4. NO mix-blend-mode — colors sahi dikhenge
           5. Mobile: height chhota lekin proportionate
        */
        .uk2-card { background:white; border:1px solid var(--uk2-border); cursor:pointer; transition:all 0.25s ease; display:flex; flex-direction:column; overflow:hidden; position:relative; }
        .uk2-card:hover { border-color:var(--uk2-accent); box-shadow:0 8px 32px rgba(28,25,23,0.1); transform:translateY(-3px); }
        .uk2-card-img-wrap { position:relative; height:240px; overflow:hidden; background:#ffffff; flex-shrink:0; border-bottom:1px solid #f0ede8; }
        @media (max-width:1100px) { .uk2-card-img-wrap { height:220px; } }
        @media (max-width:700px) { .uk2-card-img-wrap { height:170px; } }
        .uk2-card-img-skeleton { position:absolute; inset:0; background:#f0ede8; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .uk2-card-img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:14px; transition:transform 0.5s ease; background:#ffffff; }
        @media (max-width:700px) { .uk2-card-img { padding:8px; } }
        .uk2-card:hover .uk2-card-img { transform:scale(1.05); }
        .uk2-badge-stack { position:absolute; top:8px; left:8px; display:flex; flex-direction:column; gap:3px; z-index:2; }
        .uk2-badge { font-size:9px; font-weight:800; letter-spacing:0.06em; padding:2px 7px; }
        @media (max-width:700px) { .uk2-badge { font-size:8px; padding:2px 5px; } }
        .uk2-badge-custom { background:#1c7c6c; color:white; }
        .uk2-badge-sold { background:var(--uk2-ink); color:white; }
        .uk2-badge-low { background:#f59e0b; color:white; }
        .uk2-discount-badge { position:absolute; top:8px; right:8px; background:#b91c1c; color:white; font-size:9px; font-weight:800; padding:2px 7px; z-index:2; }
        .uk2-card-overlay { position:absolute; bottom:0; left:0; right:0; background:white; border-top:1px solid var(--uk2-border); padding:8px 10px; display:flex; gap:6px; transform:translateY(100%); transition:transform 0.28s cubic-bezier(0.22,1,0.36,1); z-index:3; }
        .uk2-card:hover .uk2-card-overlay { transform:translateY(0); }
        .uk2-overlay-btn { flex:1; padding:7px 0; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; transition:all 0.18s; }
        .uk2-overlay-btn--add { background:var(--uk2-ink); color:white; }
        .uk2-overlay-btn--add:hover { background:#2d2926; }
        .uk2-overlay-btn--buy { background:var(--uk2-accent); color:white; }
        .uk2-overlay-btn--buy:hover { background:var(--uk2-accent-dark); }
        .uk2-overlay-btn--incart { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; cursor:default; }
        .uk2-overlay-btn--disabled { background:#f4f4f5; color:#a1a1aa; cursor:not-allowed; }

        /* ✅ CARD BODY — mobile pe readable */
        .uk2-card-body { padding:12px 13px 13px; flex:1; display:flex; flex-direction:column; }
        @media (max-width:700px) { .uk2-card-body { padding:8px 9px 10px; } }
        .uk2-card-cat { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:3px; }
        .uk2-card-name { font-size:13px; font-weight:500; color:var(--uk2-ink); line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:6px; min-height:2.3em; }
        @media (max-width:700px) { .uk2-card-name { font-size:11.5px; min-height:unset; margin-bottom:4px; } }
        .uk2-stars { display:flex; align-items:center; gap:2px; margin-bottom:7px; }
        @media (max-width:700px) { .uk2-stars { margin-bottom:4px; } }
        .uk2-reviews { font-size:9px; color:var(--uk2-ink-faint); margin-left:3px; }
        .uk2-price-row { display:flex; align-items:baseline; gap:6px; margin-top:auto; flex-wrap:wrap; }
        .uk2-price { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:var(--uk2-ink); }
        @media (max-width:700px) { .uk2-price { font-size:1rem; } }
        .uk2-price--oos { color:var(--uk2-ink-faint); }
        .uk2-mrp { font-size:11px; color:var(--uk2-ink-faint); text-decoration:line-through; }
        .uk2-save { font-size:9px; color:#16a34a; font-weight:700; margin-top:2px; }
        .uk2-load-more-wrap { display:flex; justify-content:center; margin-top:48px; }
        .uk2-load-more-btn { font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:14px 40px; border:1.5px solid var(--uk2-ink); background:transparent; color:var(--uk2-ink); cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s; }
        .uk2-load-more-btn:hover { background:var(--uk2-ink); color:white; }
        .uk2-empty { text-align:center; padding:80px 40px; border:1px dashed var(--uk2-border); background:white; }
        .uk2-empty-icon { font-size:3rem; margin-bottom:16px; }
        .uk2-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.6rem; font-weight:600; color:var(--uk2-ink); margin-bottom:8px; }
        .uk2-empty-sub { font-size:13px; color:var(--uk2-ink-faint); margin-bottom:24px; }
        .uk2-footer-cta { background:var(--uk2-dark); position:relative; overflow:hidden; margin-top:64px; }
        .uk2-footer-cta-inner { max-width:640px; margin:0 auto; text-align:center; padding:80px 40px; }
        .uk2-footer-eyebrow { font-size:10px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase; color:var(--uk2-accent); margin-bottom:16px; }
        .uk2-footer-h { font-family:'Cormorant Garamond',serif; font-size:2.8rem; font-weight:600; color:white; line-height:1.15; margin-bottom:16px; }
        .uk2-footer-h em { color:var(--uk2-accent); font-style:italic; }
        .uk2-footer-sub { font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:32px; line-height:1.6; }
        .uk2-footer-btn { background:white; color:var(--uk2-ink); font-family:'Jost',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:14px 36px; border:none; cursor:pointer; transition:all 0.2s; }
        .uk2-footer-btn:hover { background:var(--uk2-accent); color:white; }
        @keyframes uk2-fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes uk2-fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes uk2-cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .uk2-anim-1 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .uk2-anim-2 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.18s both; }
        .uk2-anim-3 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.3s both; }
        .uk2-anim-4 { animation:uk2-fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.42s both; }
        .uk2-anim-r { animation:uk2-fadeIn 0.7s ease 0.25s both; }
      `}</style>

            <div className="uk2-announce">
                <div style={{ overflow: "hidden" }}>
                    <div className="uk2-marquee-track">
                        {["Free Delivery on orders above ₹499", "New arrivals every week", "Easy 7-day returns", "Secure payments", "Pan-India delivery", "Exclusive member offers",
                            "Free Delivery on orders above ₹499", "New arrivals every week", "Easy 7-day returns", "Secure payments", "Pan-India delivery", "Exclusive member offers"
                        ].map((t, i) => <span key={i}>{t} &nbsp;·&nbsp;</span>)}
                    </div>
                </div>
            </div>

            {!isFiltered && (
                <section className="uk2-hero">
                    <div className="uk2-hero-inner">
                        <div>
                            <p className="uk2-hero-eyebrow uk2-anim-1">UrbeXon · Premium E-Commerce</p>
                            <h1 className="uk2-hero-h1 uk2-anim-2">Shop The<br /><em>New Rcb CHAMPION 2026.</em><br /><span style={{ opacity: 0.3, fontSize: "55%" }}>Live The Trend.</span></h1>
                            <p className="uk2-hero-sub uk2-anim-3">Discover fashion, electronics, and lifestyle products handpicked for you. Premium quality, unbeatable prices — delivered to your door.</p>
                            <div className="uk2-hero-btns uk2-anim-4">
                                <button onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })} className="uk2-btn-primary">Shop Now <FaArrowRight size={11} /></button>
                                <button onClick={() => { setCustomizableFilter(); setTimeout(() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="uk2-btn-outline"><FaBolt size={10} /> Explore Deals</button>
                            </div>
                            <div className="uk2-hero-stats uk2-anim-4">
                                {[{ val: `${allProducts.length}+`, label: "Products" }, { val: `${categories.length}+`, label: "Categories" }, { val: "7-Day", label: "Returns" }, { val: "Pan-India", label: "Delivery" }].map(({ val, label }) => (
                                    <div key={label}><p className="uk2-stat-val">{val}</p><p className="uk2-stat-label">{label}</p></div>
                                ))}
                            </div>
                        </div>
                        <div className="uk2-hero-grid uk2-anim-r">
                            <div className="uk2-hero-tile" style={{ height: 460, gridRow: "span 2" }} onClick={() => categoryDisplayData[0] && setCategory(categoryDisplayData[0].cat)}>
                                {categoryDisplayData[0]?.img ? <img src={categoryDisplayData[0].img} alt={categoryDisplayData[0]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", background: "#e8e4dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🛍️</div>}
                                <div className="uk2-hero-tile-overlay" /><div className="uk2-hero-tile-label"><span>Featured</span>{categoryDisplayData[0]?.cat ? formatCat(categoryDisplayData[0].cat) : "All Products"}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div className="uk2-hero-tile" style={{ height: 220 }} onClick={() => categoryDisplayData[1] && setCategory(categoryDisplayData[1].cat)}>
                                    {categoryDisplayData[1]?.img ? <img src={categoryDisplayData[1].img} alt={categoryDisplayData[1]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", background: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>✨</div>}
                                    <div className="uk2-hero-tile-overlay" /><div className="uk2-hero-tile-label"><span>Explore</span>{categoryDisplayData[1]?.cat ? formatCat(categoryDisplayData[1].cat) : "New Arrivals"}</div>
                                </div>
                                <div className="uk2-hero-tile" style={{ height: 220 }} onClick={() => categoryDisplayData[2] && setCategory(categoryDisplayData[2].cat)}>
                                    {categoryDisplayData[2]?.img ? <img src={categoryDisplayData[2].img} alt={categoryDisplayData[2]?.cat} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} /> : <div style={{ width: "100%", height: "100%", background: "#e8f0ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>🔥</div>}
                                    <div className="uk2-hero-tile-overlay" /><div className="uk2-hero-tile-label"><span>Trending</span>{categoryDisplayData[2]?.cat ? formatCat(categoryDisplayData[2].cat) : "Trending Now"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {!isFiltered && (
                <div className="uk2-trust">
                    <div className="uk2-trust-inner">
                        {[{ icon: <FaTruck size={14} />, title: "Free Delivery", sub: "On orders above ₹499" }, { icon: <FaShieldAlt size={14} />, title: "Secure Payments", sub: "100% safe & encrypted" }, { icon: <FaUndo size={14} />, title: "Easy Returns", sub: "7-day hassle-free return" }, { icon: <FaBolt size={14} />, title: "Fast Dispatch", sub: "Same day processing" }].map(({ icon, title, sub }) => (
                            <div key={title} className="uk2-trust-item"><div className="uk2-trust-icon">{icon}</div><div><p className="uk2-trust-title">{title}</p><p className="uk2-trust-sub">{sub}</p></div></div>
                        ))}
                    </div>
                </div>
            )}

            {!isFiltered && categoryDisplayData.length > 0 && (
                <section className="uk2-section">
                    <div className="uk2-section-head"><p className="uk2-eyebrow">Explore</p><h2 className="uk2-section-title">Browse Our Curated Selections</h2></div>
                    <div className="uk2-cats-grid">
                        {categoryDisplayData.map(({ cat, img, count }) => (
                            <div key={cat} className="uk2-cat-tile" onClick={() => setCategory(cat)}>
                                <div className="uk2-cat-img-wrap">{img ? <img src={img} alt={cat} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>🛍️</div>}</div>
                                <p className="uk2-cat-name">{formatCat(cat)}</p><p className="uk2-cat-count">{count} items</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="uk2-divider" />

            {!isFiltered && (
                <section className="uk2-section">
                    <div className="uk2-section-head"><p className="uk2-eyebrow">Collections</p><h2 className="uk2-section-title">Shop The Season</h2></div>
                    <div className="uk2-collections-grid">
                        <div className="uk2-collection-tile" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }} onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}>
                            <div className="uk2-collection-content"><div><p className="uk2-collection-eyebrow" style={{ color: "#92400e" }}>Season Sale</p><h3 className="uk2-collection-h" style={{ color: "#92400e" }}>Flirting With<br />Summer</h3><p className="uk2-collection-sub" style={{ color: "#b45309" }}>Checkout offers and deals on summer staples</p></div><button className="uk2-collection-btn" style={{ background: "#92400e", color: "white" }}>Shop Now →</button></div>
                        </div>
                        <div className="uk2-collection-tile" style={{ background: "linear-gradient(135deg,#dbeafe,#93c5fd)" }} onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}>
                            <div className="uk2-collection-content"><div><p className="uk2-collection-eyebrow" style={{ color: "#1e40af" }}>Season Sale</p><h3 className="uk2-collection-h" style={{ color: "#1e3a8a" }}>Get Cozy With<br />Winter Favourites</h3><p className="uk2-collection-sub" style={{ color: "#1d4ed8" }}>Checkout offers and deals on winter staples</p></div><button className="uk2-collection-btn" style={{ background: "#1e3a8a", color: "white" }}>Shop Now →</button></div>
                        </div>
                    </div>
                </section>
            )}

            <div className="uk2-divider" />

            {!isFiltered && trendProducts.length > 0 && (
                <section className="uk2-section">
                    <div className="uk2-section-head"><p className="uk2-eyebrow">Trending Now</p><h2 className="uk2-section-title">Shop Trends</h2><p className="uk2-section-sub">Hot selling and trending products</p></div>
                    <div className="uk2-trend-tabs">
                        {[{ key: "bestselling", label: "Best Selling" }, { key: "newarrival", label: "New Arrival" }, { key: "toptrending", label: "Top Trending" }].map(({ key, label }) => (
                            <button key={key} onClick={() => { setTrendTab(key); setTrendOffset(0); }} className={`uk2-trend-tab ${trendTab === key ? "active" : ""}`}>{label}</button>
                        ))}
                    </div>
                    <div className="uk2-trend-grid">
                        {visibleTrend.map(product => <TrendCard key={product._id} product={product} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />)}
                    </div>
                    <div className="uk2-trend-nav">
                        <button onClick={() => setTrendOffset(o => Math.max(0, o - TREND_VISIBLE))} disabled={trendOffset === 0} className="uk2-trend-arrow"><FaChevronLeft size={11} /></button>
                        <button onClick={() => setTrendOffset(o => Math.min(trendProducts.length - TREND_VISIBLE, o + TREND_VISIBLE))} disabled={trendOffset + TREND_VISIBLE >= trendProducts.length} className="uk2-trend-arrow"><FaChevronRight size={11} /></button>
                    </div>
                </section>
            )}

            <div className="uk2-divider" />

            <div id="products-section">
                {!loading && (
                    <div className="uk2-toolbar">
                        <div className="uk2-toolbar-left">
                            <button onClick={clearFilters} className={`uk2-cat-pill ${isAllActive ? "active" : ""}`}>All</button>
                            <button onClick={() => setSearchParams({ deals: "true" })} className={`uk2-cat-pill ${showDeals ? "active" : ""}`}>🔥 Deals</button>
                            {customizableCount > 0 && <button onClick={setCustomizableFilter} className={`uk2-cat-pill ${showCustomizable ? "active" : ""}`}>✏ Custom ({customizableCount})</button>}
                            {categories.map(cat => <button key={cat} onClick={() => setCategory(cat)} className={`uk2-cat-pill ${activeCategory === cat ? "active" : ""}`}>{formatCat(cat)}</button>)}
                        </div>
                        <div className="uk2-toolbar-right">
                            <span className="uk2-results-count">{products.length} items</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="uk2-sort-select">
                                <option value="default">Sort: Default</option>
                                <option value="price-asc">Price ↑</option>
                                <option value="price-desc">Price ↓</option>
                                <option value="rating">Top Rated</option>
                                <option value="newest">Newest</option>
                            </select>
                            {isFiltered && <button onClick={clearFilters} className="uk2-clear-btn"><FaTimes size={9} /> Clear</button>}
                        </div>
                    </div>
                )}

                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 20px" }}>
                    <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 600, color: "var(--uk2-ink)", display: "flex", alignItems: "center", gap: 10 }}>
                        {searchQuery ? <><FaSearch size={15} style={{ color: "var(--uk2-accent)" }} /> Results for "{searchQuery}"</>
                            : showDeals ? <>🔥 Deals & Offers</>
                                : showCustomizable ? <>✏ Customizable Products</>
                                    : activeCategory ? <><FaFire size={15} style={{ color: "var(--uk2-accent)" }} /> {formatCat(activeCategory)}</>
                                        : <><FaFire size={15} style={{ color: "var(--uk2-accent)" }} /> All Products</>}
                    </h2>
                </div>

                {error && (
                    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 24px" }}>
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>⚠️ {error}</p>
                            <button onClick={() => dispatch(fetchProducts({ search: searchQuery, category: activeCategory }))} className="uk2-btn-primary" style={{ fontSize: 11, padding: "8px 20px" }}>Retry</button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
                        <div className="uk2-product-grid">{[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}</div>
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
                        <div className="uk2-empty">
                            <p className="uk2-empty-icon">{showDeals ? "🔥" : showCustomizable ? "✏️" : "🛍️"}</p>
                            <p className="uk2-empty-title">No products found</p>
                            <p className="uk2-empty-sub">{showDeals ? "No deals available right now." : showCustomizable ? "No customizable products available." : "Try a different search or category."}</p>
                            <button onClick={clearFilters} className="uk2-btn-primary">Browse All Products</button>
                        </div>
                    </div>
                )}

                {!loading && !error && products.length > 0 && (
                    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px 64px" }}>
                        <div ref={gridRef} className="uk2-product-grid">
                            {visibleProducts.map((product, i) => (
                                <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow}
                                    style={gridInView ? { animation: `uk2-cardIn 0.45s cubic-bezier(.22,1,.36,1) ${Math.min(i % PAGE_SIZE, 7) * 0.06}s both` } : {}} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="uk2-load-more-wrap">
                                <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)} className="uk2-load-more-btn">
                                    Load More <span style={{ fontSize: 10, color: "var(--uk2-ink-faint)", fontWeight: 500 }}>({products.length - visibleCount} remaining)</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isFiltered && (
                <div className="uk2-footer-cta">
                    <div className="uk2-footer-cta-inner">
                        <p className="uk2-footer-eyebrow">UrbeXon</p>
                        <h2 className="uk2-footer-h">Your Style, <em>Your Way.</em></h2>
                        <p className="uk2-footer-sub">Pan-India delivery · Secure payments · 7-day hassle-free returns</p>
                        <button onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })} className="uk2-footer-btn">Start Shopping →</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;