/**
 * UrbexonHour.jsx — Production Ready v3.0 (Flipkart Minutes Style)
 * ─────────────────────────────────────────────────────────────────
 * • Pincode saved permanently after first entry (logged-in users)
 * • Change pincode option always visible
 * • Products load instantly for returning users
 * • Category filter chips
 * • Vendor-grouped product grid
 * • Floating UH cart button
 * • Qty controls directly on cards (Flipkart Minutes style)
 * • Auto-detect location from GPS
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import {
    FaBolt, FaMapMarkerAlt, FaStore, FaShoppingCart,
    FaClock, FaStar, FaChevronRight, FaSearch, FaBell,
    FaPlus, FaMinus, FaTimes, FaTrash, FaFire,
} from "react-icons/fa";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ── Product Card (Flipkart Minutes style: qty controls) ── */
const ProductCard = ({ product }) => {
    const { addItem, isInUHCart, uhItems, increment, decrement, removeItem } = useCart();
    const inCart = isInUHCart(product._id);
    const cartItem = uhItems.find((i) => i._id === product._id);
    const qty = cartItem?.quantity || 0;

    const discount =
        product.mrp && product.mrp > product.price
            ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
            : 0;

    const handleAdd = useCallback((e) => {
        e.stopPropagation();
        if (!inCart) addItem({ ...product, productType: "urbexon_hour" });
    }, [inCart, product, addItem]);

    return (
        <div className="pc">
            <div className="pc-img-wrap">
                {discount > 0 && <span className="pc-disc">{discount}% OFF</span>}
                {product.tag && <span className="pc-tag">{product.tag}</span>}
                <img
                    src={product.images?.[0]?.url || product.image?.url || product.image || "/placeholder.png"}
                    alt={product.name} className="pc-img" loading="lazy"
                    onError={(e) => { e.target.src = "/placeholder.png"; }}
                />
            </div>
            <div className="pc-body">
                {product.brand && <div className="pc-brand">{product.brand}</div>}
                <div className="pc-name">{product.name}</div>
                {product.prepTimeMinutes && (
                    <div className="pc-prep"><FaClock size={9} /> {product.prepTimeMinutes} min prep</div>
                )}
                <div className="pc-price-row">
                    <span className="pc-price">{fmt(product.price)}</span>
                    {product.mrp && product.mrp > product.price && (
                        <span className="pc-mrp">{fmt(product.mrp)}</span>
                    )}
                    {discount > 0 && <span className="pc-disc-text">{discount}% off</span>}
                </div>

                {/* Flipkart Minutes style: ADD / qty stepper */}
                {!inCart ? (
                    <button className="pc-add" onClick={handleAdd}>
                        <FaPlus size={10} /> ADD
                    </button>
                ) : (
                    <div className="pc-qty-stepper">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            if (qty <= 1) removeItem(product._id, "urbexon_hour");
                            else decrement(product._id, "urbexon_hour");
                        }}>
                            {qty <= 1 ? <FaTrash size={9} /> : <FaMinus size={9} />}
                        </button>
                        <span>{qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); increment(product._id, "urbexon_hour"); }}>
                            <FaPlus size={9} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Main Page ────────────────────────────────────────── */
const UrbexonHour = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { uhTotalQty, uhTotal } = useCart();

    /* ── State ── */
    const [pincode, setPincode] = useState("");
    const [pinData, setPinData] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState("");
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [waitlistSuccess, setWaitlistSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [savedPincode, setSavedPincode] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showPincodeEdit, setShowPincodeEdit] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [uhDeals, setUhDeals] = useState([]);

    /* ── Load saved pincode on mount ── */
    useEffect(() => {
        const loadSavedPincode = async () => {
            // Try from user account first (logged in)
            if (user) {
                try {
                    const { data } = await api.get("/addresses/uh-pincode");
                    if (data?.uhPincode?.code) {
                        setSavedPincode(data.uhPincode);
                        setPincode(data.uhPincode.code);
                        await checkPincodeInner(data.uhPincode.code);
                        setInitialLoading(false);
                        return;
                    }
                } catch { /* continue to localStorage */ }
            }

            // Fallback to localStorage for guests
            try {
                const stored = localStorage.getItem("uh_pincode");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed?.code && /^\d{6}$/.test(parsed.code)) {
                        setSavedPincode(parsed);
                        setPincode(parsed.code);
                        await checkPincodeInner(parsed.code);
                        setInitialLoading(false);
                        return;
                    }
                }
            } catch { /* ignore */ }

            setInitialLoading(false);
        };

        loadSavedPincode();
    }, []); // eslint-disable-line

    /* ── Save pincode permanently ── */
    const savePincode = useCallback(async (code, pinInfo) => {
        const pincodeData = {
            code,
            area: pinInfo?.area || null,
            city: pinInfo?.city || null,
            state: pinInfo?.state || null,
        };

        // Save to localStorage (works for guests too)
        localStorage.setItem("uh_pincode", JSON.stringify(pincodeData));
        setSavedPincode(pincodeData);

        // Save to user account if logged in
        if (user) {
            try { await api.post("/addresses/uh-pincode", pincodeData); } catch { /* silent */ }
        }
    }, [user]);

    /* ── GPS Detection ── */
    const detectLocation = useCallback(async () => {
        setLocationLoading(true); setError("");
        try {
            if (!navigator.geolocation) {
                setError("Location not supported in your browser");
                setLocationLoading(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async ({ coords: { latitude, longitude } }) => {
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
                            { headers: { "Accept-Language": "en" } }
                        );
                        if (!res.ok) throw new Error("Geocoding failed");
                        const data = await res.json();
                        const pc = data.address?.postcode;
                        if (pc && /^\d{6}$/.test(pc)) {
                            setPincode(pc);
                            await checkPincodeInner(pc);
                        } else {
                            setError("Could not detect your pincode. Please enter it manually.");
                        }
                    } catch {
                        setError("Could not fetch location details. Please enter pincode manually.");
                    } finally { setLocationLoading(false); }
                },
                (err) => {
                    setLocationLoading(false);
                    if (err.code === 1) setError("Location permission denied. Please enter pincode manually.");
                    else if (err.code === 2) setError("Location unavailable. Please enter pincode manually.");
                    else setError("Location timeout. Please enter pincode manually.");
                },
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
            );
        } catch {
            setLocationLoading(false);
            setError("Location detection failed. Please enter pincode manually.");
        }
    }, []);

    /* ── Inner Pincode Check (no useCallback dep issues) ── */
    const checkPincodeInner = async (code) => {
        const pc = code.trim();
        if (!/^\d{6}$/.test(pc)) return;
        setLoading(true); setError(""); setPinData(null); setProducts([]); setCategories([]); setActiveCategory(null);
        try {
            const { data } = await api.get(`/pincode/check/${pc}`);
            setPinData(data);
            if (data.available) {
                const pRes = await api.get("/products", {
                    params: { productType: "urbexon_hour", pincode: pc, limit: 60 },
                });
                const prods = pRes.data.products || pRes.data || [];
                setProducts(prods);

                const catSet = new Set();
                prods.forEach((p) => { if (p.category) catSet.add(p.category); });
                setCategories([...catSet]);

                // Fetch UH deals separately
                try {
                    const dRes = await api.get("/products/urbexon-hour/deals", { params: { limit: 12 } });
                    setUhDeals(dRes.data.products || []);
                } catch { setUhDeals([]); }

                // Save pincode permanently
                const pincodeData = { code: pc, area: data.area || null, city: data.city || null, state: data.state || null };
                localStorage.setItem("uh_pincode", JSON.stringify(pincodeData));
                setSavedPincode(pincodeData);
                if (user) {
                    try { await api.post("/addresses/uh-pincode", pincodeData); } catch { /* silent */ }
                }
                setShowPincodeEdit(false);
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to check pincode. Please try again.");
        } finally { setLoading(false); }
    };

    /* ── Pincode Check (button handler) ── */
    const checkPincode = useCallback(() => {
        if (!/^\d{6}$/.test(pincode.trim())) { setError("Please enter a valid 6-digit pincode"); return; }
        checkPincodeInner(pincode);
    }, [pincode, user]); // eslint-disable-line

    /* ── Change Pincode ── */
    const handleChangePincode = useCallback(() => {
        setShowPincodeEdit(true);
        setPincode("");
        setPinData(null);
        setProducts([]);
        setCategories([]);
        setActiveCategory(null);
    }, []);

    /* ── Waitlist ── */
    const joinWaitlist = useCallback(async () => {
        if (!waitlistEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail)) {
            setError("Please enter a valid email address"); return;
        }
        try {
            await api.post("/pincode/waitlist", { code: pincode, email: waitlistEmail });
            setWaitlistSuccess(true); setError("");
        } catch (err) { setError(err?.response?.data?.message || "Failed to join waitlist"); }
    }, [waitlistEmail, pincode]);

    /* ── Group by Vendor ── */
    const groupByVendor = useCallback((prods) => {
        const map = {};
        prods.forEach((p) => {
            const vid = typeof p.vendorId === "object" ? p.vendorId?._id : p.vendorId || "unknown";
            const vname = typeof p.vendorId === "object" ? p.vendorId?.shopName : p.vendorName || "Local Store";
            if (!map[vid]) map[vid] = { vendorId: vid, vendorName: vname ?? "Local Store", products: [] };
            map[vid].products.push(p);
        });
        return Object.values(map);
    }, []);

    /* ── Search filter ── */
    const filteredProducts = useMemo(() => {
        let prods = products;
        if (activeCategory) prods = prods.filter((p) => p.category === activeCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            prods = prods.filter((p) =>
                p.name?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }
        return prods;
    }, [products, activeCategory, searchQuery]);

    const vendorGroups = groupByVendor(filteredProducts);

    const hasActiveService = pinData?.available && products.length > 0;
    const showHero = !hasActiveService || showPincodeEdit;

    // Show loading spinner while checking saved pincode
    if (initialLoading) {
        return (
            <div className="uh-root">
                <style>{PAGE_CSS}</style>
                <div className="uh-initial-loading">
                    <div className="uh-loader" />
                    <p>Loading Urbexon Hour…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="uh-root">
            <style>{PAGE_CSS}</style>
            <main>

                {/* ── SAVED PINCODE BAR (when products already loaded) ── */}
                {hasActiveService && !showPincodeEdit && (
                    <div className="uh-pin-bar">
                        <div className="container uh-pin-bar-inner">
                            <div className="uh-pin-bar-left">
                                <FaBolt size={14} className="uh-bolt" />
                                <div>
                                    <div className="uh-pin-bar-title">Urbexon Hour</div>
                                    <div className="uh-pin-bar-sub">Express delivery in 45–120 mins</div>
                                </div>
                            </div>
                            <div className="uh-pin-bar-right">
                                <div className="uh-pin-bar-loc">
                                    <FaMapMarkerAlt size={11} />
                                    <span>
                                        {savedPincode?.area || savedPincode?.city || pincode}
                                        {savedPincode?.city && savedPincode?.area ? `, ${savedPincode.city}` : ""}
                                    </span>
                                </div>
                                <button className="uh-change-btn" onClick={handleChangePincode}>
                                    Change
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEARCH BAR (when products loaded) ── */}
                {hasActiveService && !showPincodeEdit && (
                    <div className="uh-search-bar">
                        <div className="container">
                            <div className="uh-search-wrap">
                                <FaSearch size={13} className="uh-search-ic" />
                                <input
                                    className="uh-search-inp"
                                    type="text"
                                    placeholder="Search for products, brands…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="uh-search-clear" onClick={() => setSearchQuery("")}>
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── HERO (first time or changing pincode) ── */}
                {showHero && (
                    <div className="hero">
                        <div className="hero-bg" />
                        <div className="container hero-inner">
                            <div className="hero-content">
                                <div className="hero-badge"><FaBolt size={10} /> 45–120 Min Delivery</div>
                                <h1 className="hero-title">
                                    Express delivery<br />in <em>record time</em>
                                </h1>
                                <p className="hero-sub">
                                    Products from local vendors, delivered fast right to your door.
                                </p>

                                <div className="pin-block">
                                    <div className="pin-row">
                                        <div className="pin-inp-wrap">
                                            <FaSearch size={13} className="pin-search-ic" />
                                            <input
                                                className="pin-inp"
                                                type="tel" inputMode="numeric" maxLength={6}
                                                placeholder="Enter 6-digit pincode"
                                                value={pincode}
                                                onChange={(e) => {
                                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                    setPincode(v); setError(""); setPinData(null);
                                                }}
                                                onKeyDown={(e) => { if (e.key === "Enter" && pincode.length === 6) checkPincode(); }}
                                            />
                                        </div>
                                        <button
                                            className="pin-btn"
                                            onClick={() => checkPincode()}
                                            disabled={loading || pincode.length !== 6}
                                        >
                                            {loading ? <span className="spin" /> : "Check"}
                                        </button>
                                    </div>
                                    <button className="detect-btn" onClick={detectLocation} disabled={locationLoading}>
                                        <FaMapMarkerAlt size={11} />
                                        {locationLoading ? "Detecting location…" : "Use my current location"}
                                    </button>
                                    {savedPincode && showPincodeEdit && (
                                        <button
                                            className="detect-btn"
                                            style={{ marginTop: 4 }}
                                            onClick={() => {
                                                setPincode(savedPincode.code);
                                                checkPincodeInner(savedPincode.code);
                                                setShowPincodeEdit(false);
                                            }}
                                        >
                                            ← Back to {savedPincode.area || savedPincode.city || savedPincode.code}
                                        </button>
                                    )}
                                    {error && <div className="pin-error">{error}</div>}
                                </div>
                            </div>

                            <div className="hero-art">
                                <div className="hero-c1" /><div className="hero-c2" />
                                <span className="hero-emoji">🛵</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TRUST STRIP ── */}
                <div className="trust-strip">
                    <div className="container trust-inner">
                        {[
                            { ic: "🏍️", t: "Fast Delivery", s: "45–120 mins to your door" },
                            { ic: "✅", t: "Quality Checked", s: "Fresh, handpicked items" },
                            { ic: "🏪", t: "Local Vendors", s: "Support your community" },
                            { ic: "🔒", t: "Secure Payments", s: "Safe & encrypted" },
                        ].map((f) => (
                            <div key={f.t} className="trust-item">
                                <span className="trust-ic">{f.ic}</span>
                                <div>
                                    <div className="trust-title">{f.t}</div>
                                    <div className="trust-sub">{f.s}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CATEGORY CHIPS ── */}
                {categories.length > 0 && (
                    <div className="section">
                        <div className="container">
                            <div className="section-head">
                                <span className="section-title">Shop by Category</span>
                                {activeCategory && (
                                    <button className="see-all-btn" onClick={() => setActiveCategory(null)}>
                                        Clear filter
                                    </button>
                                )}
                            </div>
                            <div className="g-cat-grid">
                                {categories.map((cat) => (
                                    <div
                                        key={cat}
                                        className={`g-cat-item${activeCategory === cat ? " active" : ""}`}
                                        onClick={() => setActiveCategory((prev) => prev === cat ? null : cat)}
                                    >
                                        <div className="g-cat-emoji">{getCategoryEmoji(cat)}</div>
                                        <div className="g-cat-label">{cat}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── UH FLASH DEALS ── */}
                {uhDeals.length > 0 && (
                    <div className="uh-deals-section">
                        <div className="container">
                            <div className="uh-deals-header">
                                <div className="uh-deals-title-row">
                                    <div className="uh-deals-icon"><FaFire size={14} /></div>
                                    <div>
                                        <div className="uh-deals-title">Flash Deals</div>
                                        <div className="uh-deals-sub">{uhDeals.length} hot offer{uhDeals.length !== 1 ? "s" : ""} — grab before they expire!</div>
                                    </div>
                                </div>
                            </div>
                            <div className="uh-deals-scroll">
                                {uhDeals.map((p) => (
                                    <div key={p._id} className="uh-deals-scroll-item">
                                        <ProductCard product={p} />
                                        {p.dealEndsAt && (() => {
                                            const diff = new Date(p.dealEndsAt) - new Date();
                                            if (diff <= 0) return null;
                                            const h = Math.floor(diff / 3600000);
                                            const m = Math.floor((diff % 3600000) / 60000);
                                            return <div className="uh-deal-timer"><FaClock size={9} /> {h}h {m}m left</div>;
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── AVAILABILITY BAR ── */}
                {pinData?.available && (
                    <div className="avail-bar">
                        <div className="container avail-inner">
                            <FaMapMarkerAlt size={13} className="avail-pin" />
                            <span>
                                Showing results for{" "}
                                <strong>{pinData.area || pincode}</strong>
                                {pinData.city ? `, ${pinData.city}` : ""} —{" "}
                                <strong>{pinData.vendorCount || vendorGroups.length}</strong>{" "}
                                vendor{(pinData.vendorCount || vendorGroups.length) !== 1 ? "s" : ""} available
                            </span>
                        </div>
                    </div>
                )}

                {/* ── PRODUCTS BY VENDOR ── */}
                {pinData?.available && (
                    <div className="container">
                        {filteredProducts.length === 0 && !loading && (
                            <div className="empty-state">
                                <FaStore size={40} className="empty-ic" />
                                <div className="empty-title">
                                    {activeCategory
                                        ? `No products in "${activeCategory}" for your area`
                                        : searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : "No products available in your area yet"}
                                </div>
                                <div className="empty-sub">We are expanding fast. Check back soon!</div>
                                {(activeCategory || searchQuery) && (
                                    <button
                                        className="pin-btn"
                                        style={{ marginTop: 16 }}
                                        onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
                                    >
                                        Show all products
                                    </button>
                                )}
                            </div>
                        )}

                        {vendorGroups.map((group) => (
                            <div key={group.vendorId} className="vendor-block">
                                <div className="vendor-header">
                                    <div className="vendor-avatar"><FaStore size={18} /></div>
                                    <div className="vendor-info">
                                        <div className="vendor-name">{group.vendorName}</div>
                                        <div className="vendor-meta">
                                            <FaStar size={10} className="star-ic" /> {(group.products[0]?.vendorId?.rating || 4.0).toFixed(1)} &bull;
                                            <FaClock size={10} /> 45–90 min &bull; {group.products.length} items
                                        </div>
                                    </div>
                                </div>
                                <div className="prod-grid">
                                    {group.products.map((p) => <ProductCard key={p._id} product={p} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── NOT IN AREA ── */}
                {pinData && !pinData.available && pinData.status === "not_found" && (
                    <div className="container">
                        <div className="state-card">
                            <div style={{ fontSize: 48 }}>📍</div>
                            <div className="state-title">We are not in your area yet</div>
                            <div className="state-sub">
                                Pincode <strong>{pincode}</strong> is not covered. We are expanding fast!
                            </div>
                        </div>
                    </div>
                )}

                {/* ── WAITLIST ── */}
                {pinData && !pinData.available && pinData.status !== "not_found" && !waitlistSuccess && (
                    <div className="container">
                        <div className="state-card">
                            <FaBell size={32} style={{ color: "#1a1740", marginBottom: 12 }} />
                            <div className="state-title">Launching soon in your area!</div>
                            <div className="state-sub">
                                {pinData.status === "coming_soon" ? "Be the first to know when we go live." : pinData.message}
                            </div>
                            <div className="waitlist-row">
                                <input
                                    type="email" placeholder="your@email.com"
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    className="waitlist-inp"
                                />
                                <button onClick={joinWaitlist} className="waitlist-btn">Notify Me</button>
                            </div>
                            {error && <div className="pin-error" style={{ marginTop: 8, color: "#ef4444" }}>{error}</div>}
                        </div>
                    </div>
                )}

                {waitlistSuccess && (
                    <div className="container">
                        <div className="wl-success">
                            ✅ You are on the waitlist! We will notify you when we launch in your area.
                        </div>
                    </div>
                )}

                <div style={{ height: 80 }} />
            </main>

            {/* ── FLOATING UH CART BUTTON ── */}
            {uhTotalQty > 0 && (
                <button className="float-cart" onClick={() => navigate("/uh-cart")}>
                    <FaShoppingCart size={16} />
                    <span>{uhTotalQty} item{uhTotalQty !== 1 ? "s" : ""}</span>
                    <span className="float-cart-sep">·</span>
                    <span>{fmt(uhTotal)}</span>
                    <span className="float-cart-sep">·</span>
                    <span>View Cart</span>
                    <FaChevronRight size={12} />
                </button>
            )}

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="container footer-inner">
                    <div className="footer-brand">
                        <span className="logo-mark-sm">UX</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>
                            URBEXON<em style={{ color: "#c9a84c", fontStyle: "normal" }}>Hour</em>
                        </span>
                    </div>
                    <div className="footer-sub">Fast, fresh &amp; local — delivered in 45–120 minutes</div>
                </div>
            </footer>
        </div>
    );
};

/* ── Category emoji helper ── */
const CATEGORY_EMOJIS = {
    dairy: "🥛", milk: "🥛", vegetables: "🥦", veggies: "🥦",
    fruits: "🍎", fruit: "🍎", bakery: "🍞", bread: "🍞",
    meat: "🥩", chicken: "🍗", drinks: "🧃", beverages: "🥤",
    frozen: "🍦", pantry: "🫙", groceries: "🛒", electronics: "📱",
    fashion: "👔", lifestyle: "✨", snacks: "🍿", default: "📦",
};

const getCategoryEmoji = (cat) => {
    if (!cat) return "📦";
    const key = cat.toLowerCase().replace(/[^a-z]/g, "");
    for (const [k, v] of Object.entries(CATEGORY_EMOJIS)) {
        if (key.includes(k)) return v;
    }
    return CATEGORY_EMOJIS.default;
};

/* ── CSS ── */
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.uh-root{min-height:100vh;background:#f1f5f9;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif}
.container{max-width:1400px;margin:0 auto;padding:0 clamp(16px,3vw,40px)}

/* Initial loading */
.uh-initial-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:12px;color:#64748b;font-size:14px}
.uh-loader{width:36px;height:36px;border:3px solid #e8e4d9;border-top:3px solid #1a1740;border-radius:50%;animation:uhspin .8s linear infinite}
@keyframes uhspin{to{transform:rotate(360deg)}}

/* Saved pincode bar */
.uh-pin-bar{background:#1a1740;color:#fff;position:sticky;top:0;z-index:20}
.uh-pin-bar-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 0;gap:12px}
.uh-pin-bar-left{display:flex;align-items:center;gap:10px}
.uh-bolt{color:#f59e0b}
.uh-pin-bar-title{font-size:15px;font-weight:800}
.uh-pin-bar-sub{font-size:11px;color:rgba(255,255,255,.5)}
.uh-pin-bar-right{display:flex;align-items:center;gap:10px}
.uh-pin-bar-loc{display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,.7);background:rgba(255,255,255,.08);padding:6px 10px;border-radius:16px}
.uh-change-btn{background:rgba(255,224,102,.15);border:1px solid rgba(255,224,102,.3);color:#ffe066;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s}
.uh-change-btn:hover{background:rgba(255,224,102,.25)}

/* Search bar */
.uh-search-bar{background:#fff;border-bottom:1px solid #e8e4d9;padding:10px 0}
.uh-search-wrap{position:relative;display:flex;align-items:center;max-width:600px}
.uh-search-ic{position:absolute;left:12px;color:#94a3b8;pointer-events:none}
.uh-search-inp{width:100%;padding:10px 36px 10px 36px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1e293b;outline:none;transition:border-color .15s}
.uh-search-inp:focus{border-color:#1a1740}
.uh-search-inp::placeholder{color:#94a3b8}
.uh-search-clear{position:absolute;right:10px;background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px}

/* HERO */
.hero{background:linear-gradient(135deg,#1a1740 0%,#2874f0 55%,#1455c0 100%);position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;pointer-events:none;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")}
.hero-inner{position:relative;z-index:1;display:flex;align-items:center;gap:40px;padding-top:clamp(32px,5vw,60px);padding-bottom:clamp(40px,6vw,70px)}
.hero-content{flex:1}
.hero-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,224,102,.18);border:1px solid rgba(255,224,102,.4);color:#ffe066;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:5px 12px;border-radius:20px;margin-bottom:14px}
.hero-title{font-size:clamp(24px,4vw,44px);font-weight:800;line-height:1.2;color:#fff;margin-bottom:10px}
.hero-title em{font-style:normal;color:#ffe066}
.hero-sub{font-size:15px;color:rgba(255,255,255,.65);margin-bottom:24px;max-width:480px}
.hero-art{position:relative;width:clamp(100px,18vw,220px);flex-shrink:0;align-self:stretch;display:flex;align-items:center;justify-content:center}
.hero-c1{position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.06);right:-30px;top:-20px}
.hero-c2{position:absolute;width:100px;height:100px;border-radius:50%;background:rgba(255,224,102,.08);right:20px;top:40px}
.hero-emoji{font-size:clamp(60px,10vw,110px);position:relative;z-index:2;filter:drop-shadow(4px 8px 16px rgba(0,0,0,.3));animation:bob 2.5s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

/* PINCODE */
.pin-block{max-width:520px}
.pin-row{display:flex;gap:10px;margin-bottom:10px}
.pin-inp-wrap{flex:1;position:relative;display:flex;align-items:center}
.pin-search-ic{position:absolute;left:13px;color:rgba(0,0,0,.35);pointer-events:none}
.pin-inp{width:100%;padding:13px 14px 13px 36px;background:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:2px;color:#1e293b;outline:none;box-shadow:0 3px 12px rgba(0,0,0,.18);font-family:'DM Sans',sans-serif}
.pin-inp::placeholder{color:#94a3b8;letter-spacing:0;font-weight:400;font-size:13px}
.pin-btn{padding:13px 22px;background:#ffe066;border:none;border-radius:8px;color:#1a3a8f;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.18);transition:opacity .2s;white-space:nowrap;display:flex;align-items:center;justify-content:center;min-width:80px;font-family:'DM Sans',sans-serif}
.pin-btn:disabled{opacity:.5;cursor:not-allowed}
.detect-btn{background:none;border:none;color:rgba(255,255,255,.7);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;padding:0;font-family:'DM Sans',sans-serif;font-weight:500;transition:color .15s}
.detect-btn:hover{color:#ffe066}
.detect-btn:disabled{opacity:.5;cursor:not-allowed}
.pin-error{color:#fca5a5;font-size:12px;margin-top:8px;font-weight:500}
.spin{width:16px;height:16px;display:inline-block;border:2.5px solid rgba(26,58,143,.25);border-top-color:#1a3a8f;border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}

/* TRUST STRIP */
.trust-strip{background:#fff;border-bottom:1px solid #e8e4d9}
.trust-inner{display:grid;grid-template-columns:repeat(4,1fr)}
.trust-item{display:flex;align-items:center;gap:10px;padding:14px clamp(6px,2vw,24px);border-right:1px solid #f0ece4}
.trust-item:last-child{border-right:none}
.trust-ic{font-size:clamp(20px,3vw,26px);flex-shrink:0}
.trust-title{font-size:11px;font-weight:700;color:#1e293b}
.trust-sub{font-size:10px;color:#94a3b8}
@media(max-width:640px){
  .trust-inner{grid-template-columns:repeat(2,1fr)}
  .trust-item{border-right:none;border-bottom:1px solid #f0ece4;padding:12px clamp(10px,3vw,20px)}
  .trust-item:nth-child(odd){border-right:1px solid #f0ece4}
  .trust-item:nth-child(3),.trust-item:nth-child(4){border-bottom:none}
  .trust-sub{display:none}
}

/* SECTIONS */
.section{background:#fff;margin:8px 0;padding:20px 0}
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-title{font-size:16px;font-weight:800;color:#1e293b}
.see-all-btn{display:flex;align-items:center;gap:4px;font-size:12px;color:#1a1740;font-weight:700;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif}

/* CATEGORY GRID */
.g-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:10px}
@media(max-width:480px){.g-cat-grid{grid-template-columns:repeat(4,1fr);gap:8px}}
@media(max-width:340px){.g-cat-grid{grid-template-columns:repeat(3,1fr)}}
.g-cat-item{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.g-cat-emoji{width:clamp(48px,8vw,72px);height:clamp(48px,8vw,72px);background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:clamp(20px,3vw,28px);transition:transform .15s,border-color .15s,background .15s}
.g-cat-item:hover .g-cat-emoji,.g-cat-item.active .g-cat-emoji{border-color:#1a1740;background:#eef0fb;transform:translateY(-3px)}
.g-cat-label{font-size:10px;font-weight:600;color:#475569;text-align:center;text-transform:capitalize;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px}

/* AVAILABILITY */
.avail-bar{background:#ecfdf5;border-top:1px solid #bbf7d0;border-bottom:1px solid #bbf7d0;margin:8px 0}
.avail-inner{display:flex;align-items:center;gap:8px;padding-top:12px;padding-bottom:12px;font-size:13px;color:#065f46}
.avail-pin{color:#059669;flex-shrink:0}

/* UH FLASH DEALS */
.uh-deals-section{background:#fff;margin:8px 0;padding:20px 0;overflow:hidden}
.uh-deals-header{margin-bottom:16px}
.uh-deals-title-row{display:flex;align-items:center;gap:10px}
.uh-deals-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ff6b35,#f7c948);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.uh-deals-title{font-size:16px;font-weight:800;color:#1e293b}
.uh-deals-sub{font-size:11px;color:#64748b;margin-top:1px}
.uh-deals-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.uh-deals-scroll::-webkit-scrollbar{height:4px}
.uh-deals-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:4px}
.uh-deals-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
.uh-deals-scroll-item{min-width:170px;max-width:190px;flex-shrink:0;scroll-snap-align:start;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;transition:border-color .15s,box-shadow .2s}
.uh-deals-scroll-item:hover{border-color:#f59e0b;box-shadow:0 4px 16px rgba(245,158,11,.12)}
.uh-deals-scroll-item .pc{padding:10px 10px 6px;border-radius:0}
.uh-deals-scroll-item .pc-img-wrap{border-radius:6px}
.uh-deal-timer{display:flex;align-items:center;gap:4px;padding:6px 10px;background:#fff7ed;border-top:1px solid #fed7aa;font-size:10px;font-weight:700;color:#ea580c}
@media(max-width:480px){.uh-deals-scroll-item{min-width:150px;max-width:160px}}

/* VENDOR BLOCK */
.vendor-block{background:#fff;border-radius:8px;border:1px solid #e8e4d9;margin:12px 0;overflow:hidden}
.vendor-header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9}
@media(min-width:640px){.vendor-header{padding:16px 20px;gap:14px}}
.vendor-avatar{width:40px;height:40px;border-radius:10px;background:#eef0fb;color:#1a1740;display:flex;align-items:center;justify-content:center;flex-shrink:0}
@media(min-width:640px){.vendor-avatar{width:48px;height:48px;border-radius:12px}}
.vendor-info{flex:1}
.vendor-name{font-size:14px;font-weight:700;color:#1e293b}
.vendor-meta{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b;margin-top:3px;flex-wrap:wrap}
.star-ic{color:#f59e0b}

/* PRODUCT GRID */
.prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1px;background:#f1f5f9}
@media(max-width:480px){.prod-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:340px){.prod-grid{grid-template-columns:1fr}}

/* PRODUCT CARD */
.pc{background:#fff;padding:clamp(10px,2vw,16px) clamp(8px,2vw,14px);cursor:pointer;transition:background .15s}
.pc:hover{background:#fafbff}
.pc-img-wrap{position:relative;aspect-ratio:1;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:10px}
.pc-img{width:100%;height:100%;object-fit:cover}
.pc-disc{position:absolute;top:8px;left:8px;background:#16a34a;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:.3px}
.pc-tag{position:absolute;top:8px;right:8px;background:#f97316;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px}
.pc-brand{font-size:10px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.pc-name{font-size:12px;font-weight:600;color:#1e293b;margin-bottom:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(max-width:480px){.pc-name{font-size:11px}}
.pc-prep{display:flex;align-items:center;gap:4px;font-size:10px;color:#94a3b8;margin-bottom:7px}
.pc-price-row{display:flex;align-items:baseline;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.pc-price{font-size:14px;font-weight:800;color:#1e293b}
@media(max-width:480px){.pc-price{font-size:13px}}
.pc-mrp{font-size:11px;color:#94a3b8;text-decoration:line-through}
.pc-disc-text{font-size:11px;font-weight:700;color:#16a34a}

/* ADD button */
.pc-add{width:100%;padding:8px;background:#fff;border:1.5px solid #1a1740;color:#1a1740;font-weight:700;font-size:12px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s;font-family:'DM Sans',sans-serif}
.pc-add:hover{background:#1a1740;color:#fff}

/* QTY Stepper (Flipkart Minutes style) */
.pc-qty-stepper{display:flex;align-items:center;justify-content:space-between;border:1.5px solid #1a1740;border-radius:7px;overflow:hidden;background:#1a1740}
.pc-qty-stepper button{width:32px;height:32px;border:none;background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;font-size:11px}
.pc-qty-stepper button:hover{background:rgba(255,255,255,.1)}
.pc-qty-stepper span{flex:1;text-align:center;font-size:13px;font-weight:800;color:#fff}

/* STATES */
.empty-state{padding:60px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}
.empty-ic{color:#cbd5e1}
.empty-title{font-size:17px;font-weight:700;color:#1e293b}
.empty-sub{font-size:14px;color:#94a3b8}
.state-card{background:#fff;border:1px solid #e8e4d9;border-radius:10px;padding:clamp(32px,5vw,56px) 24px;text-align:center;margin:16px 0;display:flex;flex-direction:column;align-items:center}
.state-title{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:8px}
.state-sub{font-size:14px;color:#64748b;margin-bottom:20px}
.waitlist-row{display:flex;gap:10px;width:100%;max-width:440px}
.waitlist-inp{flex:1;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#1e293b;outline:none;font-family:'DM Sans',sans-serif}
.waitlist-inp:focus{border-color:#1a1740}
.waitlist-btn{padding:12px 18px;background:#1a1740;border:none;border-radius:8px;color:#c9a84c;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:background .15s}
.waitlist-btn:hover{background:#252060}
.wl-success{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;color:#065f46;font-weight:600;font-size:14px;text-align:center;padding:20px;margin:16px 0}

/* FLOATING CART */
.float-cart{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1740;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:14px 24px;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;box-shadow:0 8px 30px rgba(26,23,64,.4);z-index:100;white-space:nowrap;animation:floatIn .3s ease;transition:transform .2s,box-shadow .2s;max-width:calc(100vw - 32px)}
.float-cart:hover{transform:translateX(-50%) translateY(-2px);box-shadow:0 12px 36px rgba(26,23,64,.5)}
@media(max-width:480px){.float-cart{padding:12px 18px;font-size:13px;bottom:16px;gap:6px}}
.float-cart-sep{opacity:.4}
@keyframes floatIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* FOOTER */
.footer{background:#1e293b;border-top:1px solid rgba(255,255,255,.06)}
.footer-inner{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px clamp(16px,3vw,40px);text-align:center}
.footer-brand{display:flex;align-items:center;gap:10px}
.logo-mark-sm{width:24px;height:24px;border-radius:4px;background:#c9a84c;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#1a1740;font-family:'DM Sans',sans-serif}
.footer-sub{font-size:12px;color:rgba(255,255,255,.4)}

/* Mobile responsive */
@media(max-width:640px){
  .hero-art{display:none}
  .uh-pin-bar-inner{flex-direction:column;align-items:flex-start;gap:8px}
  .uh-pin-bar-right{width:100%;justify-content:space-between}
  .hero-sub{font-size:13px;margin-bottom:18px}
}
@media(max-width:480px){
  .hero-title{font-size:clamp(22px,6vw,28px)!important}
  .pin-inp{font-size:14px;padding:11px 14px 11px 34px}
  .pin-btn{padding:11px 18px;font-size:12px}
  .section-title{font-size:14px}
  .vendor-name{font-size:13px}
}
`;

export default UrbexonHour;
