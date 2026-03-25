import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaChevronDown, FaArrowRight, FaBars,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useAuth } from "../contexts/AuthContext";
import SearchBar from "./SearchBar";

/* ── Logo ── */
const LogoMark = memo(() => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="ux-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0d0a2e" />
                <stop offset="100%" stopColor="#1e1760" />
            </linearGradient>
            <linearGradient id="ux-accent" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c6dfa" />
                <stop offset="100%" stopColor="#4f9cf9" />
            </linearGradient>
        </defs>
        <path d="M18 2 L32 10 L32 26 L18 34 L4 26 L4 10 Z" fill="url(#ux-grad)" />
        <path d="M18 2 L32 10 L32 26 L18 34 L4 26 L4 10 Z" fill="none" stroke="#7c6dfa" strokeWidth="1.2" strokeOpacity="0.6" />
        <text x="7.5" y="23.5" fontSize="13" fontWeight="900" fill="white" fontFamily="sans-serif">U</text>
        <text x="19" y="23.5" fontSize="13" fontWeight="900" fill="#7c6dfa" fontFamily="sans-serif">X</text>
    </svg>
));
LogoMark.displayName = "LogoMark";

const POPULAR_SEARCHES = ["Fashion", "Electronics", "Watches", "Footwear", "Home Decor"];

const MENU_ITEMS = [
    { icon: <FaUser size={12} />, label: "My Profile", path: "/profile" },
    { icon: <FaBox size={12} />, label: "My Orders", path: "/orders" },
];

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isAuthenticated = Boolean(user);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchOverlay, setSearchOverlay] = useState(false);
    const [searchVal, setSearchVal] = useState("");

    const userMenuRef = useRef(null);
    const searchInputRef = useRef(null);

    const totalItems = useSelector(
        useCallback(s => s.cart?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0, [])
    );

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    useEffect(() => {
        const fn = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    useEffect(() => {
        document.body.style.overflow = (mobileOpen || searchOverlay) ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
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
        const fn = (e) => {
            if (e.key === "Escape") { setSearchOverlay(false); setMobileOpen(false); }
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, []);

    const go = useCallback((path) => {
        setMobileOpen(false); setUserMenuOpen(false); navigate(path);
    }, [navigate]);

    const handleLogout = useCallback(() => {
        logout(); setUserMenuOpen(false); setMobileOpen(false);
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    const handleSearch = useCallback((query) => {
        setMobileOpen(false); setSearchOverlay(false);
        navigate(`/?search=${encodeURIComponent(query)}`);
    }, [navigate]);

    const handleOverlaySearch = useCallback((e) => {
        e.preventDefault();
        if (searchVal.trim()) handleSearch(searchVal.trim());
    }, [searchVal, handleSearch]);

    const toggleMobile = useCallback(() => setMobileOpen(s => !s), []);
    const openSearch = useCallback(() => setSearchOverlay(true), []);
    const closeSearch = useCallback(() => setSearchOverlay(false), []);
    const toggleUserMenu = useCallback(() => setUserMenuOpen(p => !p), []);
    const goCart = useCallback(() => go("/cart"), [go]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --ux-dark:   #0d0a2e;
          --ux-mid:    #1e1760;
          --ux-accent: #7c6dfa;
          --ux-blue:   #4f9cf9;
          --ux-surface:#f7f6ff;
          --ux-border: #ebe9ff;
          --ux-muted:  #9590b8;
        }

        .ux-nav  { font-family: 'DM Sans', sans-serif; }
        .ux-logo { font-family: 'Syne', sans-serif; }

        @keyframes ux-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes ux-dropin  { from{opacity:0;transform:translateY(-12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes ux-slidein { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        @keyframes ux-searchin{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ux-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .ux-fadein   { animation: ux-fadein  0.2s ease forwards; }
        .ux-dropin   { animation: ux-dropin  0.24s cubic-bezier(.22,1,.36,1) forwards; transform-origin:top center; }
        .ux-slidein  { animation: ux-slidein 0.3s cubic-bezier(.32,.72,0,1) forwards; }
        .ux-searchin { animation: ux-searchin 0.24s cubic-bezier(.22,1,.36,1) forwards; }

        /* Logo hover */
        .ux-logo-hover:hover { opacity: 0.85; }

        /* Cart */
        .ux-cart-btn .ux-cart-icon { transition: all 0.22s ease; }
        .ux-cart-btn:hover .ux-cart-icon { color: var(--ux-accent); transform: rotate(-8deg) scale(1.12); }

        .ux-badge {
          position:absolute; top:-5px; right:-5px;
          background: linear-gradient(135deg, #7c6dfa, #4f9cf9);
          color:#fff; font-size:8.5px; min-width:17px; height:17px;
          padding:0 3px; border-radius:99px;
          display:flex; align-items:center; justify-content:center;
          font-weight:900; box-shadow:0 2px 8px rgba(124,109,250,0.5);
          border:2px solid #fff;
        }

        /* Pills */
        .ux-pill {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 13px; border-radius:99px; font-size:12px; font-weight:600;
          background: var(--ux-surface); color: var(--ux-dark);
          border:1.5px solid var(--ux-border);
          cursor:pointer; transition:all 0.18s ease; white-space:nowrap;
        }
        .ux-pill:hover {
          background: linear-gradient(135deg, var(--ux-accent), var(--ux-blue));
          color:#fff; border-color:transparent;
          box-shadow: 0 4px 14px rgba(124,109,250,0.35);
        }
        .ux-pill:active { transform:scale(0.95); }

        /* Drawer items */
        .ux-drawer-item {
          display:flex; align-items:center; gap:11px;
          width:100%; padding:10px 12px; border-radius:12px;
          font-size:13.5px; font-weight:400; color:#5a567e;
          background:none; border:none; cursor:pointer;
          transition:all 0.15s; text-align:left;
        }
        .ux-drawer-item:hover { background: var(--ux-surface); color: var(--ux-dark); }
        .ux-drawer-item:hover .ux-d-icon { background: var(--ux-border); color: var(--ux-accent); }
        .ux-d-icon {
          width:32px; height:32px; border-radius:10px;
          background:#f0eff8; display:flex; align-items:center;
          justify-content:center; color:#9590b8; flex-shrink:0; transition:all 0.15s;
        }
        .ux-drawer-out { color:#f87171; }
        .ux-drawer-out:hover { background:#fff1f2; color:#dc2626; }
        .ux-drawer-out:hover .ux-d-icon-red { background:#fee2e2; color:#dc2626; }
        .ux-d-icon-red {
          width:32px; height:32px; border-radius:10px; background:#fff1f2;
          display:flex; align-items:center; justify-content:center;
          color:#f87171; flex-shrink:0; transition:all 0.15s;
        }

        /* Hamburger */
        .ux-hb span {
          display:block; height:2px; border-radius:2px;
          background:currentColor; transition:all 0.25s ease;
        }

        /* Action buttons */
        .ux-nav-action {
          display:flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:11px;
          color: var(--ux-muted); border:none; background:none; cursor:pointer;
          transition:all 0.18s ease;
        }
        .ux-nav-action:hover { background: var(--ux-surface); color: var(--ux-dark); }

        /* Close button */
        .ux-close-btn {
          width:28px; height:28px; border-radius:8px; background:#f0eff8;
          border:none; display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:#9590b8; transition:all 0.15s;
        }
        .ux-close-btn:hover { background:#fee2e2; color:#dc2626; }

        /* User button */
        .ux-user-btn {
          display:flex; align-items:center; gap:8px;
          padding:5px 12px 5px 5px; border-radius:12px;
          border:1.5px solid transparent; background:none; cursor:pointer;
          transition:all 0.18s ease;
        }
        .ux-user-btn:hover { background: var(--ux-surface); border-color: var(--ux-border); }

        /* Avatar */
        .ux-avatar {
          background: linear-gradient(135deg, var(--ux-accent), var(--ux-blue));
          box-shadow: 0 2px 10px rgba(124,109,250,0.35);
        }

        /* Login / Register */
        .ux-login-btn {
          padding:8px 18px; border-radius:10px;
          border:1.5px solid var(--ux-border);
          color: var(--ux-dark); font-size:13px; font-weight:400;
          background: var(--ux-surface); cursor:pointer;
          transition:all 0.18s ease; font-family:'DM Sans',sans-serif;
        }
        .ux-login-btn:hover {
          border-color: var(--ux-accent); color: var(--ux-accent);
          background:#fff;
        }

        .ux-reg-btn {
          padding:8px 18px; border-radius:10px;
          border:none; color:#fff;
          font-size:13px; font-weight:400; cursor:pointer;
          background: linear-gradient(135deg, var(--ux-accent) 0%, var(--ux-blue) 100%);
          box-shadow: 0 4px 14px rgba(124,109,250,0.35);
          transition:all 0.18s ease; font-family:'DM Sans',sans-serif;
          position:relative; overflow:hidden;
        }
        .ux-reg-btn::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg, var(--ux-blue) 0%, var(--ux-accent) 100%);
          opacity:0; transition:opacity 0.2s;
        }
        .ux-reg-btn:hover::after { opacity:1; }
        .ux-reg-btn span { position:relative; z-index:1; }

        /* Scrolled nav glow */
        .ux-nav-scrolled {
          background: rgba(255,255,255,0.97) !important;
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--ux-border) !important;
          box-shadow: 0 4px 24px rgba(13,10,46,0.07), 0 1px 0 var(--ux-border) !important;
        }

        /* Dropdown menu item */
        .ux-menu-item {
          width:100%; padding:9px 16px;
          display:flex; align-items:center; gap:11px;
          font-size:13.5px; color:#5a567e; background:none; border:none;
          cursor:pointer; transition:all 0.15s; text-align:left; font-weight:400;
        }
        .ux-menu-item:hover { background: var(--ux-surface); color: var(--ux-dark); }
        .ux-menu-item:hover .ux-menu-icon { background: var(--ux-border); color: var(--ux-accent); }
        .ux-menu-icon {
          width:28px; height:28px; border-radius:8px;
          background:#f0eff8; display:flex; align-items:center;
          justify-content:center; color:#9590b8; flex-shrink:0; transition:all 0.15s;
        }

        /* Domain tag */
        .ux-domain-tag {
          display:inline-block; font-size:9px; font-weight:700;
          padding:1px 6px; border-radius:4px; letter-spacing:0.06em;
          background: linear-gradient(135deg, var(--ux-accent), var(--ux-blue));
          color:#fff; margin-left:4px; vertical-align:middle;
          opacity:0.85;
        }
      `}</style>

            {/* ── SEARCH OVERLAY (mobile) ── */}
            {searchOverlay && (
                <div className="ux-nav md:hidden" style={{ position: "fixed", inset: 0, zIndex: 200 }}>
                    <div
                        className="ux-fadein absolute inset-0"
                        style={{ background: "rgba(13,10,46,0.55)", backdropFilter: "blur(6px)" }}
                        onClick={closeSearch}
                    />
                    <div
                        className="ux-searchin absolute left-0 right-0 bg-white"
                        style={{
                            top: 64,
                            borderRadius: "0 0 22px 22px",
                            boxShadow: "0 24px 60px rgba(13,10,46,0.18)",
                            padding: "16px 18px 22px",
                            zIndex: 10,
                            borderTop: "1px solid var(--ux-border)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    background: "linear-gradient(135deg,#7c6dfa,#4f9cf9)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <FaSearch size={11} color="#fff" />
                                </div>
                                <span className="ux-logo" style={{ fontWeight: 800, fontSize: 14, color: "#0d0a2e" }}>Search Products</span>
                            </div>
                            <button className="ux-close-btn" onClick={closeSearch}><FaTimes size={11} /></button>
                        </div>

                        <form onSubmit={handleOverlaySearch}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 14px", borderRadius: 14,
                                border: "1.5px solid var(--ux-border)",
                                background: "var(--ux-surface)",
                            }}>
                                <FaSearch size={13} color="#7c6dfa" style={{ flexShrink: 0 }} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                    placeholder="Search fashion, electronics, more..."
                                    style={{
                                        background: "transparent", border: "none", outline: "none",
                                        fontSize: "14px", fontWeight: 600, color: "#0d0a2e",
                                        width: "100%", fontFamily: "'DM Sans', sans-serif",
                                    }}
                                />
                                {searchVal && (
                                    <button type="button" onClick={() => setSearchVal("")}
                                        style={{ background: "none", border: "none", color: "#9590b8", cursor: "pointer", padding: 0, display: "flex" }}>
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>
                            <button type="submit"
                                style={{
                                    width: "100%", marginTop: 10, padding: "12px 0",
                                    borderRadius: 12, border: "none", cursor: "pointer",
                                    fontWeight: 800, fontSize: 14,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    background: searchVal.trim()
                                        ? "linear-gradient(135deg,#7c6dfa,#4f9cf9)"
                                        : "#f0eff8",
                                    color: searchVal.trim() ? "#fff" : "#9590b8",
                                    boxShadow: searchVal.trim() ? "0 6px 20px rgba(124,109,250,0.35)" : "none",
                                    transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                                }}>
                                <FaSearch size={11} />
                                Search
                                {searchVal.trim() && <FaArrowRight size={10} />}
                            </button>
                        </form>

                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: "#9590b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                                Trending
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {POPULAR_SEARCHES.map(tag => (
                                    <button key={tag} onClick={() => handleSearch(tag)} className="ux-pill">
                                        ✦ {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MOBILE DRAWER ── */}
            {mobileOpen && (
                <div className="md:hidden ux-nav" style={{ position: "fixed", inset: 0, zIndex: 150 }}>
                    <div
                        className="ux-fadein absolute inset-0"
                        style={{ background: "rgba(13,10,46,0.55)", backdropFilter: "blur(6px)" }}
                        onClick={() => setMobileOpen(false)}
                    />
                    <div
                        className="ux-slidein absolute right-0 bg-white shadow-2xl overflow-y-auto"
                        style={{
                            top: 64, maxHeight: "65vh", width: "76%", maxWidth: 300,
                            borderRadius: "0 0 0 22px",
                            borderLeft: "1px solid var(--ux-border)",
                        }}
                    >
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 14px 8px", borderBottom: "1px solid var(--ux-border)",
                            position: "sticky", top: 0, background: "#fff", zIndex: 1,
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#9590b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                                Navigation
                            </span>
                            <button className="ux-close-btn" onClick={() => setMobileOpen(false)}>
                                <FaTimes size={11} />
                            </button>
                        </div>

                        <div style={{ padding: "8px 10px 18px" }}>
                            {isAuthenticated && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "12px", borderRadius: 14, marginBottom: 8,
                                    background: "var(--ux-surface)", border: "1.5px solid var(--ux-border)",
                                }}>
                                    <div className="ux-avatar" style={{
                                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                                        color: "#fff", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontWeight: 900, fontSize: 15,
                                        fontFamily: "'Syne', sans-serif",
                                    }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: "#0d0a2e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user?.name}
                                        </p>
                                        <p style={{ fontSize: 10, color: "#9590b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {[
                                { icon: <FaHome size={12} />, label: "Home", path: "/" },
                                { icon: <FaShoppingCart size={12} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                            ].map(({ icon, label, path }) => (
                                <button key={path} onClick={() => go(path)} className="ux-drawer-item">
                                    <span className="ux-d-icon">{icon}</span>
                                    {label}
                                </button>
                            ))}

                            {isAuthenticated ? (
                                <>
                                    <div style={{ padding: "8px 10px 3px" }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: "#9590b8", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
                                            Account
                                        </p>
                                    </div>
                                    {MENU_ITEMS.map(({ icon, label, path }) => (
                                        <button key={path} onClick={() => go(path)} className="ux-drawer-item">
                                            <span className="ux-d-icon">{icon}</span>
                                            {label}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: "1px solid var(--ux-border)", margin: "6px 0 3px" }} />
                                    <button onClick={handleLogout} className="ux-drawer-item ux-drawer-out">
                                        <span className="ux-d-icon-red"><FaSignOutAlt size={11} /></span>
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
                                    <button onClick={() => go("/login")} className="ux-login-btn" style={{ flex: 1 }}>
                                        Login
                                    </button>
                                    <button onClick={() => go("/register")} className="ux-reg-btn" style={{ flex: 1 }}>
                                        <span>Register</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══ MAIN NAVBAR ══ */}
            <nav
                className={`ux-nav sticky top-0 z-[100] transition-all duration-300 bg-white border-b border-[#ebe9ff] ${scrolled ? "ux-nav-scrolled" : ""}`}
            >
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

                    {/* LOGO */}
                    <button onClick={() => go("/")} className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
                        <div style={{ transition: "transform 0.2s ease, filter 0.2s ease" }}
                            className="group-hover:scale-105 group-hover:drop-shadow-[0_0_8px_rgba(124,109,250,0.5)]">
                            <LogoMark />
                        </div>
                        <span className="ux-logo" style={{
                            fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px",
                            color: "#0d0a2e", whiteSpace: "nowrap",
                            fontFamily: "'Syne', sans-serif",
                        }}>
                            Urb<span style={{ color: "#7c6dfa" }}>exon</span>
                        </span>
                    </button>

                    {/* DESKTOP SEARCH */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4">
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden md:flex items-center gap-1 ml-auto">

                        {/* Cart */}
                        <button onClick={goCart} className="ux-cart-btn ux-nav-action relative">
                            <FaShoppingCart size={17} className="ux-cart-icon" />
                            {totalItems > 0 && (
                                <span className="ux-badge">{totalItems > 9 ? "9+" : totalItems}</span>
                            )}
                        </button>

                        {/* Divider */}
                        <div style={{ width: 1, height: 22, background: "var(--ux-border)", margin: "0 6px" }} />

                        {/* User */}
                        {isAuthenticated ? (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={toggleUserMenu} className="ux-user-btn">
                                    <div className="ux-avatar w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                                        style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="max-w-[90px] truncate text-sm font-normal" style={{ color: "#0d0a2e" }}>
                                        {user?.name?.split(" ")[0]}
                                    </span>
                                    <FaChevronDown size={9} style={{ color: "#9590b8", transition: "transform 0.2s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
                                </button>

                                {userMenuOpen && (
                                    <div className="ux-dropin absolute right-0 mt-2.5 w-60 bg-white border border-[#ebe9ff] rounded-2xl shadow-2xl overflow-hidden z-50"
                                        style={{ boxShadow: "0 16px 50px rgba(13,10,46,0.12)" }}>
                                        <div style={{ background: "var(--ux-surface)", padding: "14px 16px", borderBottom: "1px solid var(--ux-border)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                                <div className="ux-avatar" style={{
                                                    width: 38, height: 38, borderRadius: "50%",
                                                    color: "#fff", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontWeight: 900, fontSize: 15,
                                                    fontFamily: "'Syne', sans-serif", flexShrink: 0,
                                                }}>
                                                    {user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 700, color: "#0d0a2e", fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {user?.name}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: "#9590b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: "6px 0" }}>
                                            {MENU_ITEMS.map(({ icon, label, path }) => (
                                                <button key={path} onClick={() => go(path)} className="ux-menu-item">
                                                    <span className="ux-menu-icon">{icon}</span>
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--ux-border)", padding: "6px" }}>
                                            <button onClick={handleLogout}
                                                style={{
                                                    width: "100%", padding: "9px 10px", borderRadius: 10,
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    fontSize: 13.5, color: "#f87171", background: "none",
                                                    border: "none", cursor: "pointer", fontWeight: 400,
                                                    transition: "all 0.15s", textAlign: "left",
                                                    fontFamily: "'DM Sans', sans-serif",
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#dc2626"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#f87171"; }}
                                            >
                                                <span style={{
                                                    width: 28, height: 28, borderRadius: 8, background: "#fff1f2",
                                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                }}>
                                                    <FaSignOutAlt size={11} color="#f87171" />
                                                </span>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => go("/login")} className="ux-login-btn">Login</button>
                                <button onClick={() => go("/register")} className="ux-reg-btn">
                                    <span>Register</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MOBILE: search + cart + hamburger */}
                    <div className="md:hidden ml-auto flex items-center gap-0.5">
                        <button onClick={openSearch} className="ux-nav-action">
                            <FaSearch size={16} />
                        </button>
                        <button onClick={goCart} className="ux-cart-btn ux-nav-action relative">
                            <FaShoppingCart size={16} className="ux-cart-icon" />
                            {totalItems > 0 && (
                                <span className="ux-badge">{totalItems > 9 ? "9+" : totalItems}</span>
                            )}
                        </button>
                        <button
                            onClick={toggleMobile}
                            className="ux-nav-action"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        >
                            <div className="ux-hb" style={{ width: 18, height: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <span style={{ transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                                <span style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }} />
                                <span style={{ transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default memo(Navbar);