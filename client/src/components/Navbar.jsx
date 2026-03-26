import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaChevronDown, FaArrowRight,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useAuth } from "../contexts/AuthContext";

/* ── Logo ── */
const LogoMark = memo(() => (
    <svg width="38" height="38" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2 L32 10 L32 26 L18 34 L4 26 L4 10 Z" fill="#1a1740" />
        <path d="M18 2 L32 10 L32 26 L18 34 L4 26 L4 10 Z" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
        <text x="7.5" y="23.5" fontSize="13" fontWeight="900" fill="white" fontFamily="sans-serif">U</text>
        <text x="19" y="23.5" fontSize="13" fontWeight="900" fill="#c9a84c" fontFamily="sans-serif">X</text>
    </svg>
));
LogoMark.displayName = "LogoMark";

const POPULAR_SEARCHES = ["Fashion", "Electronics", "Watches", "Footwear", "Home Decor"];

const MENU_ITEMS = [
    { icon: <FaUser size={12} />, label: "My Profile", path: "/profile" },
    { icon: <FaBox size={12} />, label: "My Orders", path: "/orders" },
];

const CATEGORIES = [
    { label: "Men's Fashion", cat: "mens-fashion" },
    { label: "Women's Fashion", cat: "womens-fashion" },
    { label: "Ethnic Wear", cat: "ethnic-wear" },
    { label: "Bags & Wallets", cat: "bags-wallets" },
    { label: "Electronics", cat: "electronics" },
    { label: "Lifestyle", cat: "lifestyle" },
    { label: "Deals", cat: "deals", hot: true },
];

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const isAuthenticated = Boolean(user);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [navHidden, setNavHidden] = useState(false);
    const [searchOverlay, setSearchOverlay] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const [deskSearch, setDeskSearch] = useState("");

    const userMenuRef = useRef(null);
    const searchInputRef = useRef(null);
    const lastScrollY = useRef(0);

    const totalItems = useSelector(s => s.cart?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0);

    const handleCategoryClick = useCallback((cat) => {
        setMobileOpen(false);
        if (cat === "deals") {
            navigate("/?deals=true");
        } else {
            navigate(`/?category=${cat}`);
        }
    }, [navigate]);

    const isCatActive = useCallback((cat) => {
        const params = new URLSearchParams(location.search);
        if (cat === "deals") return params.get("deals") === "true";
        return params.get("category") === cat;
    }, [location.search]);

    useEffect(() => {
        const fn = () => {
            const y = window.scrollY;
            setScrolled(y > 8);
            // Hide on scroll down (only on mobile, only when drawer/search closed)
            if (!mobileOpen && !searchOverlay) {
                if (y > lastScrollY.current && y > 80) {
                    setNavHidden(true);
                } else {
                    setNavHidden(false);
                }
            }
            lastScrollY.current = y;
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, [mobileOpen, searchOverlay]);

    useEffect(() => {
        const fn = e => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    useEffect(() => {
        if (mobileOpen || searchOverlay) {
            const scrollY = window.scrollY;
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            document.body.style.touchAction = "none";
        } else {
            const scrollY = parseInt(document.body.style.top || "0") * -1;
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            document.body.style.touchAction = "";
            if (scrollY) window.scrollTo(0, scrollY);
        }
        return () => {
            const scrollY = parseInt(document.body.style.top || "0") * -1;
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            document.body.style.touchAction = "";
            if (scrollY) window.scrollTo(0, scrollY);
        };
    }, [mobileOpen, searchOverlay]);

    useEffect(() => {
        if (searchOverlay) {
            const t = setTimeout(() => searchInputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        } else {
            setSearchVal("");
        }
    }, [searchOverlay]);

    useEffect(() => {
        const fn = e => {
            if (e.key === "Escape") { setSearchOverlay(false); setMobileOpen(false); }
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setSearchOverlay(false);
    }, [location.pathname, location.search]);

    const go = useCallback(path => {
        setMobileOpen(false); setUserMenuOpen(false); navigate(path);
    }, [navigate]);

    const handleLogout = useCallback(() => {
        logout(); setUserMenuOpen(false); setMobileOpen(false);
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    const handleSearch = useCallback(q => {
        setMobileOpen(false); setSearchOverlay(false);
        navigate(`/?search=${encodeURIComponent(q)}`);
    }, [navigate]);

    const onOverlaySubmit = useCallback(e => {
        e.preventDefault();
        if (searchVal.trim()) handleSearch(searchVal.trim());
    }, [searchVal, handleSearch]);

    const onDeskSubmit = useCallback(e => {
        e.preventDefault();
        if (deskSearch.trim()) handleSearch(deskSearch.trim());
    }, [deskSearch, handleSearch]);

    const toggleMobile = useCallback(() => {
        setNavHidden(false);
        setMobileOpen(s => !s);
    }, []);
    const openSearch = useCallback(() => {
        setNavHidden(false);
        setSearchOverlay(true);
    }, []);
    const closeSearch = useCallback(() => setSearchOverlay(false), []);
    const toggleMenu = useCallback(() => setUserMenuOpen(p => !p), []);
    const goCart = useCallback(() => go("/cart"), [go]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        :root {
          --g1:#c9a84c; --g2:#e8d49a;
          --dk:#0f0d2a; --dk2:#150f38;
          --wh:#ffffff;
          --cream:#f7f4ee; --cream2:#ede9df;
          --navy:#1a1740;
        }
        .nx { font-family:'DM Sans',sans-serif; }
        .nxlg { font-family:'Cormorant Garamond',serif; }
        @keyframes nxfd { from{opacity:0} to{opacity:1} }
        @keyframes nxdr { from{opacity:0;transform:translateY(-10px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes nxsl { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:none} }
        @keyframes nxsi { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .nxfd { animation:nxfd .2s ease forwards; }
        .nxdr { animation:nxdr .22s cubic-bezier(.22,1,.36,1) forwards; transform-origin:top center; }
        .nxsl { animation:nxsl .28s cubic-bezier(.32,.72,0,1) forwards; }
        .nxsi { animation:nxsi .22s cubic-bezier(.22,1,.36,1) forwards; }
        .ci { transition:all .2s ease; }

        /* ── MOBILE NAV ── */
        .mnav { background:var(--dk); border-bottom:1px solid rgba(201,168,76,.18); transition:transform .3s cubic-bezier(.4,0,.2,1), background .3s, box-shadow .3s; will-change:transform; }
        .mnav.msc { background:rgba(15,13,42,.97); backdrop-filter:blur(20px); box-shadow:0 4px 30px rgba(0,0,0,.4); }
        .mact { display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;color:rgba(255,255,255,.65);border:none;background:none;cursor:pointer;transition:all .18s; }
        .mact:hover { background:rgba(255,255,255,.09); color:#fff; }
        .mcart:hover .ci { color:var(--g1)!important; transform:rotate(-8deg) scale(1.12); }
        .mcls { width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.08);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.55);transition:all .15s; }
        .mcls:hover { background:rgba(220,38,38,.2); color:#f87171; }
        .mpill { display:inline-flex;align-items:center;gap:5px;padding:5px 14px;border-radius:99px;font-size:12px;font-weight:500;background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);border:1px solid rgba(201,168,76,.25);cursor:pointer;transition:all .18s;white-space:nowrap;font-family:'DM Sans',sans-serif; }
        .mpill:hover { background:var(--g1);color:var(--dk);border-color:transparent; }
        .drw { background:#150f38;border-left:1px solid rgba(201,168,76,.15); }
        .di { display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border-radius:12px;font-size:13.5px;font-weight:400;color:rgba(255,255,255,.6);background:none;border:none;cursor:pointer;transition:all .15s;text-align:left;text-decoration:none;font-family:'DM Sans',sans-serif; }
        .di:hover { background:rgba(255,255,255,.07);color:#fff; }
        .di:hover .dic { background:rgba(201,168,76,.15);color:var(--g1); }
        .di.di-active { color:#fff; background:rgba(201,168,76,.1); }
        .di.di-active .dic { background:rgba(201,168,76,.2);color:var(--g1); }
        .dic { width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);flex-shrink:0;transition:all .15s; }
        .diout { color:#f87171!important; }
        .diout:hover { background:rgba(220,38,38,.12)!important; }
        .nbadge { position:absolute;top:-5px;right:-5px;background:linear-gradient(135deg,var(--g1),var(--g2));font-size:8px;min-width:16px;height:16px;padding:0 3px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-weight:900; }
        .nbadgem { color:var(--dk);border:2px solid var(--dk); }
        .nbadged { color:var(--dk);border:2px solid var(--wh); }
        .nhot { font-size:7.5px;font-weight:800;letter-spacing:.1em;padding:2px 5px;border-radius:4px;background:var(--g1);color:var(--dk); }
        .nhb span { display:block;height:2px;border-radius:2px;background:currentColor;transition:all .25s ease; }

        /* ── DESKTOP NAV ── */
        .dnav { background:#fff;border-bottom:1px solid var(--cream2); transition:transform .3s cubic-bezier(.4,0,.2,1), background .3s, box-shadow .3s; will-change:transform; }
        .dnav.dsc { background:rgba(255,255,255,.97);backdrop-filter:blur(16px);box-shadow:0 2px 20px rgba(0,0,0,.08); }
        .dsrch { display:flex;align-items:center;gap:10px;background:var(--cream);border:1.5px solid var(--cream2);border-radius:12px;padding:0 6px 0 16px;height:48px;transition:border-color .2s,background .2s;flex:1;max-width:620px; }
        .dsrch:focus-within { border-color:var(--g1);background:#fffdf7;box-shadow:0 0 0 3px rgba(201,168,76,.1); }
        .dsinp { background:transparent;border:none;outline:none;font-size:14.5px;font-weight:400;color:var(--navy);width:100%;font-family:'DM Sans',sans-serif; }
        .dsinp::placeholder { color:#aaa; }
        .dsbtn { height:36px;padding:0 18px;border-radius:8px;flex-shrink:0;background:var(--navy);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .18s;color:#fff;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif; }
        .dsbtn:hover { background:var(--g1);color:var(--navy); }
        .dact { display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;color:#888;border:none;background:none;cursor:pointer;transition:all .18s; }
        .dact:hover { background:var(--cream);color:var(--navy); }
        .dcart:hover .ci { color:var(--g1)!important;transform:rotate(-8deg) scale(1.12); }
        .dsin { padding:9px 22px;border-radius:10px;border:1.5px solid var(--cream2);color:var(--navy);font-size:13.5px;font-weight:500;background:#fff;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;white-space:nowrap; }
        .dsin:hover { border-color:var(--g1);color:var(--g1); }
        .dreg { padding:9px 22px;border-radius:10px;border:none;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;background:var(--navy);transition:all .18s;font-family:'DM Sans',sans-serif;white-space:nowrap; }
        .dreg:hover { background:var(--g1);color:var(--navy); }
        .dusr { display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:12px;border:1.5px solid var(--cream2);background:var(--cream);cursor:pointer;transition:all .18s; }
        .dusr:hover { border-color:var(--g1);background:#fffdf7; }
        .ddrop { background:#fff;border:1px solid var(--cream2);border-radius:16px;overflow:hidden;box-shadow:0 16px 50px rgba(0,0,0,.12); }
        .dmi { width:100%;padding:9px 16px;display:flex;align-items:center;gap:11px;font-size:13.5px;color:#555;background:none;border:none;cursor:pointer;transition:all .15s;text-align:left;font-weight:400;font-family:'DM Sans',sans-serif; }
        .dmi:hover { background:var(--cream);color:var(--navy); }
        .dmi:hover .dmic { background:var(--cream2);color:var(--g1); }
        .dmic { width:28px;height:28px;border-radius:8px;background:#f0eee8;display:flex;align-items:center;justify-content:center;color:#999;flex-shrink:0;transition:all .15s; }
        .dcbar { background:#fff;border-top:1px solid var(--cream2); }
        .dcbi { max-width:80rem;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;overflow-x:auto;scrollbar-width:none; }
        .dcbi::-webkit-scrollbar { display:none; }
        .dcl { display:inline-flex;align-items:center;gap:5px;padding:0 16px;height:40px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em;color:#777;background:none;border:none;cursor:pointer;white-space:nowrap;flex-shrink:0;border-bottom:2px solid transparent;transition:color .18s,border-color .18s;text-transform:uppercase; }
        .dcl:hover { color:var(--navy);border-bottom-color:var(--navy); }
        .dcl.dca { color:var(--g1);border-bottom-color:var(--g1); }
        .avt { background:linear-gradient(135deg,var(--g1),var(--g2)); }
        /* Spacer for fixed navbar */
        .nx-spacer-mobile { display:block; height:64px; }
        @media (min-width:768px) { .nx-spacer-mobile { display:none; } }
        .nx-spacer-desktop { display:none; }
        @media (min-width:768px) { .nx-spacer-desktop { display:block; height:110px; } }
      `}</style>

            {/* ── MOBILE SEARCH OVERLAY ── z-[510] — above nav */}
            {searchOverlay && (
                <div className="nx md:hidden" style={{ position: "fixed", inset: 0, zIndex: 510 }}>
                    <div className="nxfd absolute inset-0" style={{ background: "rgba(0,0,0,.75)" }} onClick={closeSearch} />
                    <div className="nxsi absolute left-0 right-0" style={{ top: 64, background: "#150f38", borderRadius: "0 0 20px 20px", boxShadow: "0 24px 60px rgba(0,0,0,.5)", padding: "16px 18px 22px", zIndex: 10, borderTop: "1px solid rgba(201,168,76,.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--g1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaSearch size={12} color="var(--dk)" />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>Search</span>
                            </div>
                            <button className="mcls" onClick={closeSearch}><FaTimes size={11} /></button>
                        </div>
                        <form onSubmit={onOverlaySubmit} style={{ display: "flex", gap: 8 }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Search for products..."
                                style={{ flex: 1, background: "rgba(255,255,255,.07)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 12, padding: "11px 16px", fontSize: 14, color: "#fff", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                            />
                            <button type="submit" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--g1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                                <FaSearch size={14} color="var(--dk)" />
                            </button>
                        </form>
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>Trending</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {POPULAR_SEARCHES.map(tag => (
                                    <button key={tag} onClick={() => handleSearch(tag)} className="mpill">✦ {tag}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MOBILE DRAWER ── z-[490] — below nav so nav stays always on top */}
            {mobileOpen && (
                <div className="md:hidden nx" style={{ position: "fixed", inset: 0, zIndex: 490 }}>
                    <div className="nxfd absolute inset-0" style={{ background: "rgba(0,0,0,.65)" }} onClick={() => setMobileOpen(false)} />
                    <div className="nxsl drw absolute right-0 overflow-y-auto shadow-2xl" style={{ top: 64, height: "calc(100vh - 64px)", width: "76%", maxWidth: 300, borderRadius: "0 0 0 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px", borderBottom: "1px solid rgba(201,168,76,.12)", position: "sticky", top: 0, background: "#150f38", zIndex: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".14em" }}>Menu</span>
                            <button className="mcls" onClick={() => setMobileOpen(false)}><FaTimes size={11} /></button>
                        </div>
                        <div style={{ padding: "8px 10px 18px" }}>
                            {isAuthenticated && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 14, marginBottom: 8, background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.15)" }}>
                                    <div className="avt" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, color: "var(--dk)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: 13, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                                        <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                                    </div>
                                </div>
                            )}

                            {[
                                { icon: <FaHome size={12} />, label: "Home", path: "/" },
                                { icon: <FaShoppingCart size={12} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                            ].map(({ icon, label, path }) => (
                                <button key={path} onClick={() => go(path)} className="di">
                                    <span className="dic">{icon}</span>{label}
                                </button>
                            ))}

                            <div style={{ padding: "8px 10px 3px", marginTop: 4 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".12em", margin: 0 }}>Categories</p>
                            </div>

                            {CATEGORIES.map(({ label, cat, hot }) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`di${isCatActive(cat) ? " di-active" : ""}`}
                                >
                                    <span className="dic" style={{ fontSize: 11 }}>→</span>
                                    {label}
                                    {hot && <span className="nhot" style={{ marginLeft: 4 }}>HOT</span>}
                                </button>
                            ))}

                            {isAuthenticated ? (
                                <>
                                    <div style={{ padding: "8px 10px 3px", marginTop: 4 }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".12em", margin: 0 }}>Account</p>
                                    </div>
                                    {MENU_ITEMS.map(({ icon, label, path }) => (
                                        <button key={path} onClick={() => go(path)} className="di">
                                            <span className="dic">{icon}</span>{label}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", margin: "6px 0 3px" }} />
                                    <button onClick={handleLogout} className="di diout">
                                        <span className="dic" style={{ background: "rgba(220,38,38,.15)", color: "#f87171" }}>
                                            <FaSignOutAlt size={11} />
                                        </span>
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
                                    <button onClick={() => go("/login")} className="dsin" style={{ flex: 1 }}>Sign In</button>
                                    <button onClick={() => go("/register")} className="dreg" style={{ flex: 1 }}>Register</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spacers for fixed navbars */}
            <div className="nx-spacer-mobile" />
            <div className="nx-spacer-desktop" />

            {/* ── MOBILE NAVBAR ── z-[500] — always above page content & drawer */}
            <nav className={`nx md:hidden fixed top-0 left-0 right-0 z-[500] transition-all duration-300 mnav ${scrolled ? "msc" : ""}`}
                style={{ transform: navHidden && !mobileOpen && !searchOverlay ? "translateY(-100%)" : "translateY(0)" }}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => go("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                        <LogoMark />
                        <span className="nxlg" style={{ fontWeight: 700, fontSize: 20, letterSpacing: ".04em", color: "#fff" }}>
                            URB<span style={{ color: "var(--g1)" }}>EXON</span>
                        </span>
                    </button>
                    <div className="ml-auto flex items-center gap-0.5">
                        <button onClick={openSearch} className="mact"><FaSearch size={16} /></button>
                        <button onClick={goCart} className="mcart mact relative">
                            <FaShoppingCart size={16} className="ci" />
                            {totalItems > 0 && <span className="nbadge nbadgem">{totalItems > 9 ? "9+" : totalItems}</span>}
                        </button>
                        <button onClick={toggleMobile} className="mact" aria-label={mobileOpen ? "Close" : "Open menu"}>
                            <div className="nhb" style={{ width: 18, height: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <span style={{ transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                                <span style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }} />
                                <span style={{ transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── DESKTOP NAVBAR ── z-[500] */}
            <nav className={`nx hidden md:block fixed top-0 left-0 right-0 z-[500] transition-all duration-300 dnav ${scrolled ? "dsc" : ""}`}
                style={{ transform: navHidden ? "translateY(-100%)" : "translateY(0)" }}>
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-5" style={{ height: 70 }}>
                    <button onClick={() => go("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <LogoMark />
                        <span className="nxlg" style={{ fontWeight: 700, fontSize: 22, letterSpacing: ".04em", color: "var(--navy)" }}>
                            URB<span style={{ color: "var(--g1)" }}>EXON</span>

                        </span>
                    </button>

                    <form className="dsrch" onSubmit={onDeskSubmit}>
                        <FaSearch size={15} color="#bbb" style={{ flexShrink: 0 }} />
                        <input
                            type="text"
                            value={deskSearch}
                            onChange={e => setDeskSearch(e.target.value)}
                            placeholder="Search fashion, electronics, more..."
                            className="dsinp"
                        />
                        {deskSearch && (
                            <button type="button" onClick={() => setDeskSearch("")} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                                <FaTimes size={12} />
                            </button>
                        )}
                        <button type="submit" className="dsbtn"><FaSearch size={13} /></button>
                    </form>

                    <div className="flex items-center gap-2" style={{ flexShrink: 0, marginLeft: "auto" }}>
                        <button onClick={goCart} className="dcart dact relative">
                            <FaShoppingCart size={18} className="ci" style={{ color: "#666" }} />
                            {totalItems > 0 && <span className="nbadge nbadged">{totalItems > 9 ? "9+" : totalItems}</span>}
                        </button>
                        <div style={{ width: 1, height: 22, background: "#e5e2da", margin: "0 4px" }} />
                        {isAuthenticated ? (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={toggleMenu} className="dusr">
                                    <div className="avt" style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "var(--navy)", flexShrink: 0 }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span style={{ color: "var(--navy)", fontSize: 13.5, fontWeight: 500, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {user?.name?.split(" ")[0]}
                                    </span>
                                    <FaChevronDown size={9} style={{ color: "#aaa", transition: "transform .2s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
                                </button>
                                {userMenuOpen && (
                                    <div className="nxdr ddrop absolute right-0 mt-2.5 w-60 z-50">
                                        <div style={{ background: "var(--cream)", padding: "14px 16px", borderBottom: "1px solid var(--cream2)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                                <div className="avt" style={{ width: 38, height: 38, borderRadius: "50%", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 600, color: "var(--navy)", fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                                                    <p style={{ fontSize: 11, color: "#999", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: "6px 0" }}>
                                            {MENU_ITEMS.map(({ icon, label, path }) => (
                                                <button key={path} onClick={() => go(path)} className="dmi">
                                                    <span className="dmic">{icon}</span><span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--cream2)", padding: "6px" }}>
                                            <button
                                                onClick={handleLogout}
                                                style={{ width: "100%", padding: "9px 10px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#e55", background: "none", border: "none", cursor: "pointer", fontWeight: 400, transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#dc2626"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e55"; }}
                                            >
                                                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <FaSignOutAlt size={11} color="#e55" />
                                                </span>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => go("/login")} className="dsin">Sign In</button>
                                <button onClick={() => go("/register")} className="dreg">Register</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop Category Bar */}
                <div className="dcbar">
                    <div className="dcbi">
                        {CATEGORIES.map(({ label, cat, hot }) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={`dcl${isCatActive(cat) ? " dca" : ""}`}
                            >
                                {label}
                                {hot && <span className="nhot" style={{ marginLeft: 4 }}>HOT</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default memo(Navbar);