import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import api from "../api/axios";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import RelatedProductsSlider from "../components/RelatedProductsSlider";
import { imgUrl } from "../utils/imageUrl";
import {
    FaStar, FaRegStar, FaShoppingCart, FaBolt,
    FaTrash, FaCheckCircle, FaArrowLeft,
    FaUpload, FaTimes, FaPencilAlt, FaStickyNote,
    FaRuler, FaBell, FaTag, FaShare, FaWhatsapp,
    FaFacebook, FaInstagram, FaLink, FaTwitter,
    FaChevronDown, FaChevronUp,
    FaSearchPlus,
} from "react-icons/fa";

/* ─── Helpers ── */
const StarRow = ({ value, size = 12 }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s =>
            s <= value
                ? <FaStar key={s} className="text-amber-400" size={size} />
                : <FaRegStar key={s} className="text-stone-300" size={size} />
        )}
    </div>
);

const getMrp = (product) => {
    const val = product?.mrp ?? product?.originalPrice ?? product?.comparePrice ?? product?.compareAtPrice ?? null;
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return n > 0 ? n : null;
};

/* ─── Share Modal ── */
const ShareModal = ({ product, onClose }) => {
    const [copied, setCopied] = useState(false);
    const url = window.location.href;
    const text = encodeURIComponent(`Check out ${product.name} — ₹${Number(product.price).toLocaleString("en-IN")}`);
    const encodedUrl = encodeURIComponent(url);

    const shareLinks = [
        { icon: <FaWhatsapp size={20} />, label: "WhatsApp", color: "#25D366", bg: "#f0fdf4", href: `https://wa.me/?text=${text}%20${encodedUrl}` },
        { icon: <FaFacebook size={20} />, label: "Facebook", color: "#1877F2", bg: "#eff6ff", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
        { icon: <FaTwitter size={20} />, label: "Twitter / X", color: "#000", bg: "#f9f9f9", href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}` },
        { icon: <FaInstagram size={20} />, label: "Instagram", color: "#E1306C", bg: "#fff0f6", href: `https://www.instagram.com/` },
    ];

    const copyLink = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                style={{ animation: "slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1) forwards" }}
                onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <h3 className="font-black text-zinc-900 text-base">Share This Product</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors cursor-pointer">
                        <FaTimes size={12} className="text-zinc-500" />
                    </button>
                </div>
                <div className="mx-6 my-3 bg-stone-50 rounded-2xl p-3 flex items-center gap-3 border border-stone-100">
                    <div className="w-12 h-12 rounded-xl bg-white border border-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                        {product.images?.[0]?.url
                            ? <img src={imgUrl.detail(product.images[0].url)} alt={product.name} className="w-full h-full object-contain p-1" />
                            : <span className="text-xl">🎁</span>}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-zinc-800 text-sm truncate">{product.name}</p>
                        <p className="text-amber-600 font-black text-sm">₹{Number(product.price).toLocaleString("en-IN")}</p>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-3 px-6 pb-4">
                    {shareLinks.map(({ icon, label, color, bg, href }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95" style={{ background: bg, color }}>{icon}</div>
                            <span className="text-[10px] font-semibold text-zinc-500 text-center leading-tight">{label}</span>
                        </a>
                    ))}
                </div>
                <div className="mx-6 mb-6">
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2.5">
                        <span className="text-xs text-zinc-500 truncate flex-1">{url}</span>
                        <button onClick={copyLink}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                            style={{ background: copied ? "#d1fae5" : "#1c1917", color: copied ? "#065f46" : "#fff" }}>
                            {copied ? <><FaCheckCircle size={10} /> Copied!</> : <><FaLink size={10} /> Copy</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Price Display ── */
const PriceDisplay = ({ price, mrp }) => {
    const hasDiscount = mrp && Number(mrp) > Number(price);
    const discountPct = hasDiscount ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : null;
    return (
        <div className="flex flex-wrap items-end gap-3 mb-1">
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.4rem", fontWeight: 700, color: "#1c1917", lineHeight: 1 }}>
                ₹{Number(price).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-lg font-semibold text-zinc-300 line-through leading-none mb-1">₹{Number(mrp).toLocaleString("en-IN")}</span>
                    <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg leading-none mb-1" style={{ background: "#fef3c7", color: "#92400e" }}>
                        <FaTag size={8} /> {discountPct}% OFF
                    </span>
                </>
            )}
        </div>
    );
};

/* ─── Rating Bar ── */
const RatingBar = ({ star, count, pct }) => (
    <div className="flex items-center gap-2.5">
        <span className="text-xs text-zinc-400 w-3 shrink-0 font-medium">{star}</span>
        <FaStar size={9} className="text-amber-400 shrink-0" />
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-zinc-300 w-4 shrink-0 text-right font-medium">{count}</span>
    </div>
);



const ZoomModal = ({ src, alt, onClose }) => {
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                top: 0, left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                background: "rgba(0,0,0,0.93)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: 16, right: 16,
                    zIndex: 100000,
                    width: 40, height: 40,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 4,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                }}
            >
                <FaTimes size={16} color="white" />
            </button>

            {/*
              ✅ THE ACTUAL FIX:
              - Outer div = fixed 90vw x 90vh box
              - img inside = 100% width + 100% height with object-fit: contain
              - Image CANNOT escape this box no matter how big it is
            */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "90vw",
                    height: "90vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: 4,
                    }}
                />
            </div>
        </div>
    );
};

/* ─── Main Component ── */
const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem, cartItems } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedSize, setSelectedSize] = useState("");
    const [imgZoomed, setImgZoomed] = useState(false);
    const [addedFlash, setAddedFlash] = useState(false);
    const [highlightsOpen, setHighlightsOpen] = useState(true);
    const [shareOpen, setShareOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("description");

    const [customText, setCustomText] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [customImagePreview, setCustomImagePreview] = useState("");
    const [customImageUrl, setCustomImageUrl] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const [notifyEmail, setNotifyEmail] = useState("");
    const [notifySubmitting, setNotifySubmitting] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);
    const [notifyError, setNotifyError] = useState("");
    const [showNotifyInput, setShowNotifyInput] = useState(false);

    const abortRef = useRef(null);

    const inCart = useMemo(() => cartItems.some(i => i._id === product?._id), [cartItems, product?._id]);
    const mrpValue = useMemo(() => product ? getMrp(product) : null, [product]);
    const hasDiscount = useMemo(() => mrpValue && mrpValue > Number(product?.price), [mrpValue, product?.price]);
    const savedAmount = useMemo(() => hasDiscount ? mrpValue - Number(product.price) : 0, [hasDiscount, mrpValue, product?.price]);
    const avgRating = useMemo(() => product?.rating || 0, [product?.rating]);

    const ratingBars = useMemo(() => [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
    })), [reviews]);

    const highlightEntries = useMemo(() => product?.highlights
        ? (product.highlights instanceof Map ? [...product.highlights.entries()] : Object.entries(product.highlights))
        : [], [product?.highlights]);

    const fetchReviews = useCallback(async (productId) => {
        try { const { data } = await api.get(`/reviews/${productId}`); setReviews(data); } catch { }
    }, []);

    useEffect(() => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const fetchData = async () => {
            try {
                setLoading(true); setError("");
                const [{ data: prod }, { data: related }] = await Promise.all([
                    api.get(`/products/${id}`, { signal: controller.signal }),
                    api.get(`/products/${id}/related`, { signal: controller.signal }),
                ]);
                setProduct(prod); setRelatedProducts(related);
                await fetchReviews(prod._id);
            } catch (err) { if (err.name !== "AbortError") setError("Failed to load product"); }
            finally { setLoading(false); }
        };
        fetchData();
        return () => controller.abort();
    }, [id, fetchReviews]);

    useEffect(() => {
        if (!user || reviews.length === 0) return;
        const mine = reviews.find(r => r.user === user._id || r.user?._id === user._id);
        if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || ""); }
    }, [reviews, user]);

    useEffect(() => { if (user?.email) setNotifyEmail(user.email); }, [user]);

    const handleCustomImageChange = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size / (1024 * 1024) > 5) return alert("Image must be under 5MB");
        setCustomImagePreview(URL.createObjectURL(file));
        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append("image", file);
            const { data } = await api.post("/uploads/custom-image", formData);
            setCustomImageUrl(data.url);
        } catch { alert("Image upload failed. Try again."); setCustomImagePreview(""); }
        finally { setUploadingImage(false); }
    }, []);

    const removeCustomImage = useCallback(() => { setCustomImagePreview(""); setCustomImageUrl(""); }, []);
    const getCustomization = useCallback(() => ({ text: customText.trim(), imageUrl: customImageUrl, note: customNote.trim() }), [customText, customImageUrl, customNote]);

    const handleAddToCart = useCallback(() => {
        if (product.sizes?.length > 0 && !selectedSize) return alert("Please select a size first!");
        addItem({ ...product, selectedSize, customization: getCustomization() });
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    }, [product, selectedSize, addItem, getCustomization]);

    const handleBuyNow = useCallback(() => {
        if (product.sizes?.length > 0 && !selectedSize) return alert("Please select a size first!");
        navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1, selectedSize, customization: getCustomization() } } });
    }, [product, selectedSize, navigate, getCustomization]);

    const handleNotifyMe = useCallback(async () => {
        if (!notifyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
            setNotifyError("Please enter a valid email address"); return;
        }
        try {
            setNotifySubmitting(true); setNotifyError("");
            const key = `notify_${product._id}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            if (!existing.includes(notifyEmail.trim())) { existing.push(notifyEmail.trim()); localStorage.setItem(key, JSON.stringify(existing)); }
            setNotifySuccess(true); setShowNotifyInput(false);
        } catch { setNotifyError("Something went wrong. Try again."); }
        finally { setNotifySubmitting(false); }
    }, [notifyEmail, product?._id]);

    const handleSubmitReview = useCallback(async (e) => {
        e.preventDefault();
        if (myRating === 0) return setReviewError("Please select a rating");
        try {
            setSubmitting(true); setReviewError("");
            await api.post(`/reviews/${product._id}`, { rating: myRating, comment: myComment });
            setReviewSuccess(true);
            await fetchReviews(product._id);
            const { data } = await api.get(`/products/${id}`);
            setProduct(data);
            setTimeout(() => setReviewSuccess(false), 2500);
        } catch (err) { setReviewError(err.response?.data?.message || "Review failed"); }
        finally { setSubmitting(false); }
    }, [myRating, myComment, product?._id, fetchReviews, id]);

    const handleDeleteReview = useCallback(async (reviewId) => {
        try { await api.delete(`/reviews/${reviewId}`); await fetchReviews(product._id); setMyRating(0); setMyComment(""); } catch { }
    }, [product?._id, fetchReviews]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafaf8" }}>
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400 text-xs font-medium tracking-widest uppercase">Loading</p>
            </div>
        </div>
    );

    if (!product || error) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#fafaf8" }}>
            <p className="text-zinc-400 text-sm">{error || "Product not found"}</p>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 text-sm font-semibold border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-all rounded-sm tracking-wide">Return Home</button>
        </div>
    );

    // ✅ ALWAYS use heroImageUrl (detail size) for zoom — never zoomImageUrl which can be massive
    const heroImageUrl = imgUrl.detail(product.images?.[0]?.url || "");

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');
            .pd-root { font-family: 'Jost', sans-serif; background: #fafaf8; min-height: 100vh; }
            @keyframes fadeIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
            @keyframes zoomIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
            .animate-in { animation: fadeIn 0.45s ease forwards; }
            .img-hover { transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); }
            .img-hover:hover { transform: scale(1.04); }
            .tab-btn { position:relative; padding:10px 20px; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:color 0.2s; border:none; background:none; }
            .tab-btn.active { color:#1c1917; }
            .tab-btn.active::after { content:''; position:absolute; bottom:0; left:20px; right:20px; height:2px; background:#1c1917; border-radius:1px; }
            .tab-btn.inactive { color:#a8a29e; }
            .tab-btn.inactive:hover { color:#57534e; }
            .size-btn { min-width:44px; height:44px; padding:0 12px; border:1px solid #e7e5e4; font-size:12px; font-weight:600; letter-spacing:0.05em; cursor:pointer; transition:all 0.2s; background:white; }
            .size-btn:hover { border-color:#1c1917; }
            .size-btn.active { border-color:#1c1917; background:#1c1917; color:white; }
            .cta-primary { display:flex; align-items:center; justify-content:center; gap:8px; height:52px; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; border:none; flex:1; }
            .cta-cart { background:#1c1917; color:white; }
            .cta-cart:hover { background:#292524; }
            .cta-cart.in-cart { background:#d1fae5; color:#065f46; }
            .cta-buy { background:#f59e0b; color:#1c1917; }
            .cta-buy:hover { background:#d97706; }
            .cta-primary:active { transform:scale(0.98); }
            .badge { display:inline-flex; align-items:center; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:4px 10px; }
            .share-btn { display:flex; align-items:center; gap:6px; padding:10px 16px; border:1px solid #e7e5e4; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; background:white; transition:all 0.2s; }
            .share-btn:hover { border-color:#1c1917; background:#1c1917; color:white; }
            .review-card { border:1px solid #f0eeec; padding:20px; transition:border-color 0.2s; }
            .review-card:hover { border-color:#d6d3d1; }
            .notify-input { width:100%; padding:12px 14px; border:1px solid #e7e5e4; font-size:13px; font-family:'Jost',sans-serif; outline:none; transition:all 0.2s; background:#fafaf8; }
            .notify-input:focus { border-color:#1c1917; background:white; }
            .zoom-wrap:hover .zoom-icon { opacity: 1; }
            .zoom-icon { opacity: 0; transition: opacity 0.2s; pointer-events: none; }
        `}</style>

            <div className="pd-root">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-8">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-800 transition-colors text-xs font-medium tracking-widest uppercase cursor-pointer">
                            <FaArrowLeft size={10} /> Back
                        </button>
                        {product.category && (
                            <><span className="text-stone-200">/</span>
                                <span className="text-zinc-400 text-xs uppercase tracking-widest">{product.category.replace(/-/g, " ")}</span></>
                        )}
                    </div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mb-16">

                        {/* ── Image Panel ── */}
                        <div className="relative">
                            {/* ✅ zoom-wrap for hover icon effect */}
                            <div
                                className="zoom-wrap aspect-square bg-stone-50 overflow-hidden cursor-zoom-in relative"
                                onClick={() => setImgZoomed(true)}
                            >
                                {heroImageUrl
                                    ? <img src={heroImageUrl} alt={product.name} loading="eager" decoding="async"
                                        className="w-full h-full object-contain p-8 img-hover" />
                                    : <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
                                }
                                {/* Hover overlay with zoom icon */}
                                <div className="zoom-icon absolute inset-0 bg-black/10 flex items-center justify-center">
                                    <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: 4, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                        <FaSearchPlus size={13} color="#1c1917" />
                                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#1c1917", textTransform: "uppercase" }}>Zoom</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {product.isCustomizable && <span className="badge bg-emerald-600 text-white">✏️ Customizable</span>}
                                {!product.inStock && <span className="badge bg-zinc-900 text-white">Sold Out</span>}
                                {hasDiscount && (
                                    <span className="badge bg-amber-400 text-stone-900">
                                        {Math.round(((mrpValue - Number(product.price)) / mrpValue) * 100)}% Off
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-3 justify-between">
                                <span className="text-[10px] text-zinc-300 uppercase tracking-widest">Click image to zoom</span>
                                <button onClick={() => setShareOpen(true)} className="share-btn"><FaShare size={10} /> Share</button>
                            </div>
                        </div>

                        {/* ── Info Panel ── */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                {product.category && (
                                    <span className="text-[10px] font-700 text-amber-600 uppercase tracking-[0.2em]">{product.category.replace(/-/g, " ")}</span>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-stone-200 rounded-sm">
                                        <FaStar size={10} className="text-amber-400" />
                                        <span className="text-xs font-bold text-zinc-800">{avgRating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs text-zinc-400">{reviews.length} reviews</span>
                                </div>
                            </div>

                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 600, color: "#1c1917", lineHeight: 1.25 }} className="mb-5">
                                {product.name}
                            </h1>

                            <div className="border-t border-b border-stone-100 py-5 mb-5">
                                <PriceDisplay price={product.price} mrp={mrpValue} />
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-xs text-zinc-400 font-medium">Free delivery above ₹499</span>
                                    {hasDiscount && savedAmount > 0 && (
                                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5">Save ₹{savedAmount.toLocaleString("en-IN")}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-5">
                                {product.inStock ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">In Stock</span>
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 ml-1">Only {product.stock} left</span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Out of Stock</span>
                                    </>
                                )}
                            </div>

                            {product.description && (
                                <p className="text-zinc-500 text-sm leading-relaxed mb-5 font-light">{product.description}</p>
                            )}

                            {product.sizes?.length > 0 && (
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <p className="text-xs font-semibold text-zinc-700 uppercase tracking-widest flex items-center gap-1.5">
                                            <FaRuler size={9} className="text-zinc-300" /> Size
                                        </p>
                                        {selectedSize && <span className="text-xs text-amber-600 font-semibold">{selectedSize} selected</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map(size => (
                                            <button key={size} onClick={() => setSelectedSize(size)} className={`size-btn ${selectedSize === size ? "active" : ""}`}>{size}</button>
                                        ))}
                                    </div>
                                    {!selectedSize && <p className="text-[10px] text-amber-600 mt-2 uppercase tracking-wider font-semibold">↑ Select a size to continue</p>}
                                </div>
                            )}

                            {product.isCustomizable && (
                                <div className="border border-amber-200 bg-amber-50/50 p-4 mb-5 space-y-3">
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">✏️ Personalise Your Order</p>
                                    <div>
                                        <label className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1 block uppercase tracking-widest"><FaPencilAlt size={8} /> Name / Message</label>
                                        <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="e.g. Happy Birthday Rahul! 🎂"
                                            className="w-full px-3 py-2.5 border border-amber-200 text-sm bg-white outline-none focus:border-amber-500 font-light transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1 block uppercase tracking-widest"><FaUpload size={8} /> Upload Design</label>
                                        {!customImagePreview ? (
                                            <label className="flex items-center justify-center gap-2 w-full h-16 border border-dashed border-amber-300 cursor-pointer hover:border-amber-500 hover:bg-white/60 transition-all">
                                                {uploadingImage
                                                    ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                    : <><FaUpload className="text-amber-300" size={12} /><span className="text-xs text-amber-600 font-medium">Click to upload</span></>}
                                                <input type="file" accept="image/*" onChange={handleCustomImageChange} className="hidden" />
                                            </label>
                                        ) : (
                                            <div className="relative inline-block">
                                                <img src={customImagePreview} alt="custom" loading="lazy" className="h-16 w-16 object-cover border border-amber-200" />
                                                <button onClick={removeCustomImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer"><FaTimes size={8} /></button>
                                                {customImageUrl && <span className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.5">✓</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1 block uppercase tracking-widest"><FaStickyNote size={8} /> Special Instructions</label>
                                        <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="e.g. White background, bold font..." rows={2}
                                            className="w-full px-3 py-2.5 border border-amber-200 text-sm bg-white outline-none focus:border-amber-500 font-light transition-colors resize-none" />
                                    </div>
                                </div>
                            )}

                            {product.inStock ? (
                                <div className="flex gap-3 mb-5">
                                    <button onClick={handleAddToCart} className={`cta-primary cta-cart ${inCart ? "in-cart" : ""} ${addedFlash ? "!bg-emerald-500 !text-white" : ""}`}>
                                        <FaShoppingCart size={12} />
                                        {inCart ? "In Cart ✔" : addedFlash ? "Added!" : "Add to Cart"}
                                    </button>
                                    <button onClick={handleBuyNow} className="cta-primary cta-buy"><FaBolt size={12} /> Buy Now</button>
                                </div>
                            ) : (
                                <div className="mb-5 space-y-3">
                                    <div className="flex gap-3">
                                        <button disabled className="cta-primary flex-1 bg-stone-100 text-stone-300 cursor-not-allowed"><FaShoppingCart size={12} /> Add to Cart</button>
                                        <button disabled className="cta-primary flex-1 bg-stone-100 text-stone-300 cursor-not-allowed"><FaBolt size={12} /> Buy Now</button>
                                    </div>
                                    {notifySuccess ? (
                                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3">
                                            <FaCheckCircle className="text-emerald-500 shrink-0" size={16} />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-700">You're on the list!</p>
                                                <p className="text-xs text-emerald-600 mt-0.5">We'll notify <strong>{notifyEmail}</strong> when back in stock.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-stone-200 p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <FaBell size={13} className="text-zinc-400" />
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Notify When Available</p>
                                                    <p className="text-xs text-zinc-400">Get email when back in stock</p>
                                                </div>
                                            </div>
                                            {showNotifyInput ? (
                                                <div className="flex gap-2">
                                                    <input type="email" value={notifyEmail} onChange={e => { setNotifyEmail(e.target.value); setNotifyError(""); }} placeholder="your@email.com" className="notify-input flex-1" />
                                                    <button onClick={handleNotifyMe} disabled={notifySubmitting}
                                                        className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-60 cursor-pointer whitespace-nowrap hover:bg-zinc-700 transition-colors">
                                                        {notifySubmitting ? "..." : "Notify"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowNotifyInput(true)}
                                                    className="w-full py-2.5 border border-zinc-900 text-zinc-900 text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2">
                                                    <FaBell size={10} /> Notify Me
                                                </button>
                                            )}
                                            {notifyError && <p className="text-xs text-red-500 mt-2">{notifyError}</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4 flex-wrap pt-4 border-t border-stone-100">
                                {["🔒 Secure Checkout", "🚚 Free Delivery ₹499+", "💬 WhatsApp Support"].map(t => (
                                    <span key={t} className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Tabbed Section ── */}
                    <div className="border-t border-stone-200 mb-16">
                        <div className="flex border-b border-stone-100 -mt-px overflow-x-auto">
                            {[
                                { key: "description", label: "Description" },
                                ...(highlightEntries.length > 0 ? [{ key: "highlights", label: "Highlights" }] : []),
                                { key: "reviews", label: `Reviews (${reviews.length})` },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab-btn ${activeTab === tab.key ? "active" : "inactive"}`}>{tab.label}</button>
                            ))}
                        </div>
                        <div className="py-8">
                            {activeTab === "description" && (
                                <div className="max-w-2xl">
                                    {product.description
                                        ? <p className="text-zinc-600 text-sm leading-loose font-light">{product.description}</p>
                                        : <p className="text-zinc-400 text-sm italic">No description available.</p>}
                                </div>
                            )}
                            {activeTab === "highlights" && highlightEntries.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border border-stone-100 max-w-3xl">
                                    {highlightEntries.map(([key, value]) => (
                                        <div key={key} className="p-4 border-b border-r border-stone-100 last:border-b-0">
                                            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1 font-semibold">{key}</p>
                                            <p className="text-sm font-semibold text-zinc-800">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === "reviews" && (
                                <div className="max-w-3xl">
                                    {reviews.length > 0 && (
                                        <div className="flex gap-10 mb-8 pb-8 border-b border-stone-100">
                                            <div className="text-center shrink-0">
                                                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", fontWeight: 600, lineHeight: 1, color: "#1c1917" }}>{avgRating.toFixed(1)}</p>
                                                <StarRow value={Math.round(avgRating)} size={13} />
                                                <p className="text-xs text-zinc-400 mt-2">{reviews.length} reviews</p>
                                            </div>
                                            <div className="flex-1 space-y-2 py-1">{ratingBars.map(b => <RatingBar key={b.star} {...b} />)}</div>
                                        </div>
                                    )}
                                    {user ? (
                                        <form onSubmit={handleSubmitReview} className="mb-8 pb-8 border-b border-stone-100">
                                            <p className="text-xs font-bold text-zinc-700 mb-4 uppercase tracking-widest">Write a Review</p>
                                            <div className="flex gap-1 mb-4">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button key={s} type="button" onClick={() => setMyRating(s)} className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                                                        {s <= myRating ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-stone-200" />}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={3} placeholder="Share your thoughts on this product..."
                                                className="w-full border border-stone-200 p-3 text-sm mb-3 outline-none focus:border-zinc-900 font-light transition-colors resize-none" />
                                            {reviewError && <p className="text-red-500 text-xs mb-3">{reviewError}</p>}
                                            {reviewSuccess && <p className="text-emerald-600 text-xs mb-3 flex items-center gap-1 font-semibold"><FaCheckCircle size={10} /> Review submitted!</p>}
                                            <button type="submit" disabled={submitting}
                                                className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors disabled:opacity-60 cursor-pointer">
                                                {submitting ? "Submitting..." : "Submit Review"}
                                            </button>
                                        </form>
                                    ) : (
                                        <button onClick={() => navigate("/login")}
                                            className="mb-8 px-5 py-2.5 border border-zinc-900 text-zinc-900 text-xs font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all cursor-pointer">
                                            Login to Write a Review
                                        </button>
                                    )}
                                    {reviews.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed border-stone-200">
                                            <p className="text-zinc-400 text-sm">No reviews yet. Be the first!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {reviews.map(r => {
                                                const isOwn = user && (r.user === user._id || r.user?._id === user._id);
                                                return (
                                                    <div key={r._id} className="review-card">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex gap-3 items-center">
                                                                <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{r.name?.[0]?.toUpperCase() || "U"}</div>
                                                                <div><p className="font-semibold text-zinc-800 text-sm">{r.name}</p><StarRow value={r.rating} size={10} /></div>
                                                            </div>
                                                            {isOwn && (
                                                                <button onClick={() => handleDeleteReview(r._id)} className="text-stone-300 hover:text-red-500 transition-colors cursor-pointer p-1"><FaTrash size={11} /></button>
                                                            )}
                                                        </div>
                                                        {r.comment && <p className="text-sm text-zinc-600 mt-2 font-light leading-relaxed">{r.comment}</p>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Related Products ── */}
                    {relatedProducts.length > 0 && (
                        <div>
                            <div className="flex items-baseline justify-between mb-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-1">You May Also Like</p>
                                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600, color: "#1c1917" }}>Similar Products</h2>
                                </div>
                            </div>
                            <RelatedProductsSlider products={relatedProducts} />
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ ZOOM MODAL — properly contained, no overflow */}
            {imgZoomed && (
                <ZoomModal
                    src={heroImageUrl}
                    alt={product.name}
                    onClose={() => setImgZoomed(false)}
                />
            )}

            {/* Share Modal */}
            {shareOpen && <ShareModal product={product} onClose={() => setShareOpen(false)} />}
        </>
    );
};

export default ProductDetails;