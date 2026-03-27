import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
    FaSearch, FaShoppingCart, FaTimes,
    FaUser, FaBox, FaSignOutAlt, FaHome,
    FaChevronDown, FaChevronRight,
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
    { icon: <FaUser size={13} />, label: "My Profile", path: "/profile" },
    { icon: <FaBox size={13} />, label: "My Orders", path: "/orders" },
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
    const [searchFocused, setSearchFocused] = useState(false);

    const userMenuRef = useRef(null);
    const searchInputRef = useRef(null);
    const lastScrollY = useRef(0);

    const totalItems = useSelector(s =>
        s.cart?.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0
    );

    const handleCategoryClick = useCallback((cat) => {
        setMobileOpen(false);
        navigate(cat === "deals" ? "/?deals=true" : `/?category=${cat}`);
    }, [navigate]);

    const isCatActive = useCallback((cat) => {
        const p = new URLSearchParams(location.search);
        return cat === "deals" ? p.get("deals") === "true" : p.get("category") === cat;
    }, [location.search]);

    /* ── Scroll hide/show ── */
    useEffect(() => {
        const fn = () => {
            const y = window.scrollY;
            setScrolled(y > 8);
            if (!mobileOpen && !searchOverlay) {
                setNavHidden(y > lastScrollY.current && y > 80);
            }
            lastScrollY.current = y;
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, [mobileOpen, searchOverlay]);

    /* ── Close user menu on outside click ── */
    useEffect(() => {
        const fn = e => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    /* ── NO body.style manipulation — removed completely ── */

    /* ── Search overlay focus ── */
    useEffect(() => {
        if (searchOverlay) {
            const t = setTimeout(() => searchInputRef.current?.focus(), 150);
            return () => clearTimeout(t);
        } else {
            setSearchVal("");
        }
    }, [searchOverlay]);

    /* ── Escape key ── */
    useEffect(() => {
        const fn = e => {
            if (e.key === "Escape") { setSearchOverlay(false); setMobileOpen(false); }
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, []);

    /* ── Close on route change ── */
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

    const openSearch = useCallback(() => { setNavHidden(false); setSearchOverlay(true); }, []);
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
          --cream:#f7f4ee; --cream2:#ede9df; --cream3:#d9d3c7;
          --navy:#1a1740;
          --sidebar-bg:#f7f4ee;
          --sidebar-border:#e2ddd4;
          --sidebar-text:#3d3527;
          --sidebar-muted:#8a7f6e;
        }

        .nx  { font-family:'DM Sans',sans-serif; }
        .nxlg{ font-family:'Cormorant Garamond',serif; }

        /* ── Keyframes ── */
        @keyframes nxfd   { from{opacity:0}                                         to{opacity:1} }
        @keyframes nxsl   { from{opacity:0;transform:translateX(100%)}              to{opacity:1;transform:translateX(0)} }
        @keyframes nxsi   { from{opacity:0;transform:translateY(-10px)}             to{opacity:1;transform:translateY(0)} }
        @keyframes nxdr   { from{opacity:0;transform:translateY(-8px) scale(.97)}   to{opacity:1;transform:none} }
        @keyframes nxpop  { 0%{transform:scale(.95);opacity:0} 60%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }

        .nxfd  { animation:nxfd  .2s  ease forwards; }
        .nxsl  { animation:nxsl  .3s  cubic-bezier(.32,.72,0,1) forwards; }
        .nxsi  { animation:nxsi  .22s cubic-bezier(.22,1,.36,1) forwards; }
        .nxdr  { animation:nxdr  .22s cubic-bezier(.22,1,.36,1) forwards; transform-origin:top center; }
        .nxpop { animation:nxpop .25s cubic-bezier(.22,1,.36,1) forwards; }

        .ci { transition:all .2s ease; }

        /* ══════════════════════════════
           MOBILE NAV
        ══════════════════════════════ */
        .mnav {
          background:var(--dk);
          border-bottom:1px solid rgba(201,168,76,.18);
          transition:transform .3s cubic-bezier(.4,0,.2,1), background .3s, box-shadow .3s;
          will-change:transform;
        }
        .mnav.msc {
          background:rgba(15,13,42,.97);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          box-shadow:0 4px 30px rgba(0,0,0,.4);
        }

        /* Mobile icon buttons */
        .mact {
          display:flex; align-items:center; justify-content:center;
          width:40px; height:40px; border-radius:10px;
          color:rgba(255,255,255,.65); border:none; background:none; cursor:pointer;
          transition:all .18s;
        }
        .mact:hover  { background:rgba(255,255,255,.09); color:#fff; }
        .mcart:hover .ci { color:var(--g1)!important; transform:rotate(-8deg) scale(1.12); }

        /* Hamburger */
        .nhb span {
          display:block; height:2px; border-radius:2px;
          background:currentColor; transition:all .28s ease;
        }

        /* Badge */
        .nbadge {
          position:absolute; top:-5px; right:-5px;
          background:linear-gradient(135deg,var(--g1),var(--g2));
          font-size:8px; min-width:16px; height:16px; padding:0 3px;
          border-radius:99px; display:flex; align-items:center; justify-content:center;
          font-weight:900;
        }
        .nbadgem { color:var(--dk); border:2px solid var(--dk); }
        .nbadged { color:var(--dk); border:2px solid var(--wh); }
        .nhot    { font-size:7.5px; font-weight:800; letter-spacing:.1em; padding:2px 5px; border-radius:4px; background:var(--g1); color:var(--dk); }

        /* ══════════════════════════════
           MOBILE DRAWER — CREAM SIDEBAR
        ══════════════════════════════ */
        .drw {
          background:var(--sidebar-bg);
          border-left:1px solid var(--sidebar-border);
          display:flex; flex-direction:column;
        }

        /* Drawer header */
        .drw-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 16px 12px;
          border-bottom:1px solid var(--sidebar-border);
          position:sticky; top:0;
          background:var(--sidebar-bg);
          z-index:2;
          flex-shrink:0;
        }

        /* Drawer close btn */
        .drw-cls {
          width:30px; height:30px; border-radius:8px;
          background:var(--cream2); border:none;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:var(--sidebar-muted);
          transition:all .15s;
        }
        .drw-cls:hover { background:var(--cream3); color:var(--sidebar-text); }

        /* Drawer scroll body */
        .drw-body {
          flex:1; overflow-y:auto; overflow-x:hidden;
          padding:8px 10px 24px;
          /* Custom scrollbar */
          scrollbar-width:thin;
          scrollbar-color:var(--cream3) transparent;
        }
        .drw-body::-webkit-scrollbar { width:4px; }
        .drw-body::-webkit-scrollbar-thumb { background:var(--cream3); border-radius:4px; }

        /* Drawer footer — always visible at bottom */
        .drw-footer {
          flex-shrink:0;
          padding:12px 14px 20px;
          border-top:1px solid var(--sidebar-border);
          background:var(--sidebar-bg);
        }

        /* Section label */
        .drw-label {
          font-size:9.5px; font-weight:700; text-transform:uppercase;
          letter-spacing:.14em; color:var(--sidebar-muted);
          padding:10px 6px 4px; margin:0;
        }

        /* Drawer item */
        .di {
          display:flex; align-items:center; gap:11px; width:100%;
          padding:9px 10px; border-radius:10px;
          font-size:13.5px; font-weight:500; color:var(--sidebar-text);
          background:none; border:none; cursor:pointer;
          transition:background .15s, color .15s; text-align:left;
          text-decoration:none; font-family:'DM Sans',sans-serif;
        }
        .di:hover { background:var(--cream2); color:var(--navy); }
        .di:hover .dic { background:var(--cream3); color:var(--g1); }
        .di.di-active { background:rgba(201,168,76,.12); color:var(--navy); font-weight:600; }
        .di.di-active .dic { background:rgba(201,168,76,.2); color:var(--g1); }

        /* Drawer icon bubble */
        .dic {
          width:32px; height:32px; border-radius:10px; flex-shrink:0;
          background:var(--cream2); color:var(--sidebar-muted);
          display:flex; align-items:center; justify-content:center;
          transition:all .15s;
        }

        /* Logout special */
        .di-out { color:#c0392b !important; }
        .di-out:hover { background:#fff0ee !important; color:#c0392b !important; }
        .di-out:hover .dic { background:#ffe4e1 !important; color:#c0392b !important; }
        .di-out .dic { background:#fdecea; color:#e57373; }

        /* ── Mobile search pill ── */
        .mpill {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 12px; border-radius:99px; font-size:12px; font-weight:500;
          background:rgba(255,255,255,.07); color:rgba(255,255,255,.75);
          border:1px solid rgba(201,168,76,.25); cursor:pointer;
          transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif;
        }
        .mpill:hover { background:var(--g1); color:var(--dk); border-color:transparent; }

        /* ══════════════════════════════
           DESKTOP NAV
        ══════════════════════════════ */
        .dnav {
          background:#fff;
          border-bottom:1px solid var(--cream2);
          transition:transform .3s cubic-bezier(.4,0,.2,1), box-shadow .3s;
        }
        .dnav.dsc {
          background:rgba(255,255,255,.97);
          backdrop-filter:blur(16px);
          -webkit-backdrop-filter:blur(16px);
          box-shadow:0 2px 20px rgba(0,0,0,.08);
        }

        /* Desktop search bar */
        .dsrch-wrap {
          display:flex; align-items:center;
          background:#f7f5f0; border:1.5px solid #e8e3da;
          border-radius:10px; height:46px;
          padding:0 6px 0 14px;
          transition:border-color .2s, background .2s, box-shadow .2s;
          flex:1; max-width:580px;
        }
        .dsrch-wrap.focused {
          border-color:var(--g1);
          background:#fffdf7;
          box-shadow:0 0 0 3px rgba(201,168,76,.12);
        }
        .dsrch-inp {
          background:transparent; border:none; outline:none;
          font-size:14px; font-weight:400; color:var(--navy);
          width:100%; font-family:'DM Sans',sans-serif;
        }
        .dsrch-inp::placeholder { color:#b0a898; }
        .dsrch-btn {
          height:34px; padding:0 16px; border-radius:7px; flex-shrink:0;
          background:var(--navy); border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:6px;
          transition:all .18s; color:#fff; font-size:13px; font-weight:600;
          font-family:'DM Sans',sans-serif;
        }
        .dsrch-btn:hover { background:var(--g1); color:var(--navy); }

        /* Desktop icon actions */
        .dact {
          display:flex; align-items:center; justify-content:center;
          width:40px; height:40px; border-radius:10px;
          color:#888; border:none; background:none; cursor:pointer; transition:all .18s;
        }
        .dact:hover { background:var(--cream); color:var(--navy); }
        .dcart:hover .ci { color:var(--g1)!important; transform:rotate(-8deg) scale(1.12); }

        /* Desktop auth buttons */
        .dsin {
          padding:8px 20px; border-radius:9px; border:1.5px solid var(--cream2);
          color:var(--navy); font-size:13px; font-weight:600; background:#fff;
          cursor:pointer; transition:all .18s; font-family:'DM Sans',sans-serif; white-space:nowrap;
        }
        .dsin:hover { border-color:var(--g1); color:var(--g1); }
        .dreg {
          padding:8px 20px; border-radius:9px; border:none;
          color:#fff; font-size:13px; font-weight:600; background:var(--navy);
          cursor:pointer; transition:all .18s; font-family:'DM Sans',sans-serif; white-space:nowrap;
        }
        .dreg:hover { background:var(--g1); color:var(--navy); }

        /* User button */
        .dusr {
          display:flex; align-items:center; gap:8px;
          padding:5px 12px 5px 5px; border-radius:12px;
          border:1.5px solid var(--cream2); background:var(--cream);
          cursor:pointer; transition:all .18s;
        }
        .dusr:hover { border-color:var(--g1); background:#fffdf7; }

        /* Dropdown */
        .ddrop {
          background:#fff; border:1px solid var(--cream2);
          border-radius:16px; overflow:hidden;
          box-shadow:0 16px 50px rgba(0,0,0,.12);
        }
        .dmi {
          width:100%; padding:9px 16px;
          display:flex; align-items:center; gap:11px;
          font-size:13.5px; color:#555; background:none; border:none;
          cursor:pointer; transition:all .15s; text-align:left; font-weight:400;
          font-family:'DM Sans',sans-serif;
        }
        .dmi:hover { background:var(--cream); color:var(--navy); }
        .dmi:hover .dmic { background:var(--cream2); color:var(--g1); }
        .dmic {
          width:28px; height:28px; border-radius:8px;
          background:#f0eee8; color:#999; flex-shrink:0;
          display:flex; align-items:center; justify-content:center; transition:all .15s;
        }
        .avt { background:linear-gradient(135deg,var(--g1),var(--g2)); }

        /* Category bar */
        .dcbar { background:#fff; border-top:1px solid var(--cream2); }
        .dcbi  {
          max-width:80rem; margin:0 auto; padding:0 1.5rem;
          display:flex; align-items:center; overflow-x:auto; scrollbar-width:none;
        }
        .dcbi::-webkit-scrollbar { display:none; }
        .dcl {
          display:inline-flex; align-items:center; gap:5px;
          padding:0 16px; height:40px;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:.06em; color:#777; background:none; border:none;
          cursor:pointer; white-space:nowrap; flex-shrink:0;
          border-bottom:2px solid transparent;
          transition:color .18s, border-color .18s; text-transform:uppercase;
        }
        .dcl:hover { color:var(--navy); border-bottom-color:var(--navy); }
        .dcl.dca   { color:var(--g1);   border-bottom-color:var(--g1); }

        /* Spacer */
        .nx-spacer-mobile  { display:block; height:64px; }
        .nx-spacer-desktop { display:none; }
        @media (min-width:768px) {
          .nx-spacer-mobile  { display:none; }
          .nx-spacer-desktop { display:block; height:110px; }
        }
      `}</style>

            {/* ══════════════════════════════════════════
                MOBILE SEARCH OVERLAY
            ══════════════════════════════════════════ */}
            {searchOverlay && (
                <div className="nx md:hidden" style={{ position: "fixed", inset: 0, zIndex: 510 }}>
                    {/* Backdrop */}
                    <div className="nxfd" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.72)" }} onClick={closeSearch} />
                    {/* Panel */}
                    <div className="nxsi" style={{
                        position: "absolute", left: 0, right: 0, top: 64,
                        background: "#150f38",
                        borderRadius: "0 0 20px 20px",
                        boxShadow: "0 24px 60px rgba(0,0,0,.5)",
                        padding: "16px 18px 22px",
                        zIndex: 10,
                        borderTop: "1px solid rgba(201,168,76,.15)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--g1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaSearch size={12} color="var(--dk)" />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>Search</span>
                            </div>
                            <button onClick={closeSearch} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,.5)" }}>
                                <FaTimes size={11} />
                            </button>
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

            {/* ══════════════════════════════════════════
                MOBILE DRAWER — CREAM SIDEBAR
            ══════════════════════════════════════════ */}
            {mobileOpen && (
                <div className="md:hidden nx" style={{ position: "fixed", inset: 0, zIndex: 490 }}>
                    {/* Backdrop */}
                    <div className="nxfd" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} onClick={() => setMobileOpen(false)} />

                    {/* Drawer panel — flex column so footer stays at bottom */}
                    <div className="nxsl drw" style={{
                        position: "absolute", right: 0, top: 64,
                        height: "calc(100vh - 64px)",
                        width: "78%", maxWidth: 300,
                        borderRadius: "0 0 0 20px",
                        boxShadow: "-8px 0 40px rgba(0,0,0,.18)",
                    }}>
                        {/* ── Header ── */}
                        <div className="drw-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <LogoMark />
                                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: "var(--navy)", letterSpacing: ".04em" }}>
                                    URB<span style={{ color: "var(--g1)" }}>EXON</span>
                                </span>
                            </div>
                            <button className="drw-cls" onClick={() => setMobileOpen(false)}>
                                <FaTimes size={12} />
                            </button>
                        </div>

                        {/* ── Scrollable body ── */}
                        <div className="drw-body">

                            {/* User card if logged in */}
                            {isAuthenticated && (
                                <div className="nxpop" style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 8, background: "linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.05))", border: "1px solid rgba(201,168,76,.2)" }}>
                                    <div className="avt" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, color: "var(--dk)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                                        <p style={{ fontSize: 10, color: "var(--sidebar-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Home + Cart */}
                            {[
                                { icon: <FaHome size={13} />, label: "Home", path: "/" },
                                { icon: <FaShoppingCart size={13} />, label: `Cart${totalItems > 0 ? ` (${totalItems})` : ""}`, path: "/cart" },
                            ].map(({ icon, label, path }) => (
                                <button key={path} onClick={() => go(path)} className="di">
                                    <span className="dic">{icon}</span>{label}
                                </button>
                            ))}

                            {/* Categories */}
                            <p className="drw-label">Categories</p>
                            {CATEGORIES.map(({ label, cat, hot }) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`di${isCatActive(cat) ? " di-active" : ""}`}
                                >
                                    <span className="dic"><FaChevronRight size={9} /></span>
                                    {label}
                                    {hot && <span className="nhot" style={{ marginLeft: 4 }}>HOT</span>}
                                </button>
                            ))}

                            {/* Account links if logged in */}
                            {isAuthenticated && (
                                <>
                                    <p className="drw-label">Account</p>
                                    {MENU_ITEMS.map(({ icon, label, path }) => (
                                        <button key={path} onClick={() => go(path)} className="di">
                                            <span className="dic">{icon}</span>{label}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* ── Footer — always visible, never cut ── */}
                        <div className="drw-footer">
                            {isAuthenticated ? (
                                <button onClick={handleLogout} className="di di-out" style={{ width: "100%", borderRadius: 10, border: "1px solid #fcd5d0" }}>
                                    <span className="dic"><FaSignOutAlt size={13} /></span>
                                    Sign Out
                                </button>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <button onClick={() => go("/login")} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "1.5px solid var(--navy)", color: "var(--navy)", background: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .18s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--navy)"; e.currentTarget.style.color = "#fff"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "var(--navy)"; }}>
                                        Sign In
                                    </button>
                                    <button onClick={() => go("/register")} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", color: "#fff", background: "var(--navy)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .18s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--g1)"; e.currentTarget.style.color = "var(--dk)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "var(--navy)"; e.currentTarget.style.color = "#fff"; }}>
                                        Register
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spacers */}
            <div className="nx-spacer-mobile" />
            <div className="nx-spacer-desktop" />

            {/* ══════════════════════════════════════════
                MOBILE NAVBAR
            ══════════════════════════════════════════ */}
            <nav className={`nx md:hidden fixed top-0 left-0 right-0 z-[500] mnav ${scrolled ? "msc" : ""}`}
                style={{ transform: navHidden && !mobileOpen && !searchOverlay ? "translateY(-100%)" : "translateY(0)", transition: "transform .3s cubic-bezier(.4,0,.2,1)" }}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
                    <button onClick={() => go("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                        <LogoMark />
                        <span className="nxlg" style={{ fontWeight: 700, fontSize: 20, letterSpacing: ".04em", color: "#fff" }}>
                            URB<span style={{ color: "var(--g1)" }}>EXON</span>
                        </span>
                    </button>
                    <div className="ml-auto flex items-center gap-0.5">
                        <button onClick={openSearch} className="mact"><FaSearch size={16} /></button>
                        <button onClick={goCart} className="mcart mact" style={{ position: "relative" }}>
                            <FaShoppingCart size={16} className="ci" />
                            {totalItems > 0 && <span className="nbadge nbadgem">{totalItems > 9 ? "9+" : totalItems}</span>}
                        </button>
                        <button onClick={toggleMobile} className="mact" aria-label={mobileOpen ? "Close menu" : "Open menu"}>
                            <div className="nhb" style={{ width: 18, height: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <span style={{ transform: mobileOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                                <span style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "none" }} />
                                <span style={{ transform: mobileOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════
                DESKTOP NAVBAR
            ══════════════════════════════════════════ */}
            <nav className={`nx hidden md:block fixed top-0 left-0 right-0 z-[500] dnav ${scrolled ? "dsc" : ""}`}
                style={{ transform: navHidden ? "translateY(-100%)" : "translateY(0)", transition: "transform .3s cubic-bezier(.4,0,.2,1)" }}>
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-5" style={{ height: 70 }}>

                    {/* Logo */}
                    <button onClick={() => go("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <LogoMark />
                        <span className="nxlg" style={{ fontWeight: 700, fontSize: 22, letterSpacing: ".04em", color: "var(--navy)" }}>
                            URB<span style={{ color: "var(--g1)" }}>EXON</span>
                        </span>
                    </button>

                    {/* Search bar */}
                    <form className={`dsrch-wrap ${searchFocused ? "focused" : ""}`} onSubmit={onDeskSubmit}>
                        <FaSearch size={15} color={searchFocused ? "#c9a84c" : "#c0b8ae"} style={{ flexShrink: 0, transition: "color .2s" }} />
                        <input
                            type="text"
                            value={deskSearch}
                            onChange={e => setDeskSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            placeholder="Search fashion, electronics, more..."
                            className="dsrch-inp"
                            style={{ margin: "0 8px" }}
                        />
                        {deskSearch && (
                            <button type="button" onClick={() => setDeskSearch("")} style={{ background: "none", border: "none", color: "#c0b8ae", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0, marginRight: 4 }}>
                                <FaTimes size={12} />
                            </button>
                        )}
                        <button type="submit" className="dsrch-btn"><FaSearch size={13} /> Search</button>
                    </form>

                    {/* Right actions */}
                    <div className="flex items-center gap-2" style={{ flexShrink: 0, marginLeft: "auto" }}>
                        <button onClick={goCart} className="dcart dact" style={{ position: "relative" }}>
                            <FaShoppingCart size={18} className="ci" style={{ color: "#666" }} />
                            {totalItems > 0 && <span className="nbadge nbadged">{totalItems > 9 ? "9+" : totalItems}</span>}
                        </button>
                        <div style={{ width: 1, height: 22, background: "#e5e2da", margin: "0 4px" }} />

                        {isAuthenticated ? (
                            <div style={{ position: "relative" }} ref={userMenuRef}>
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
                                    <div className="nxdr ddrop" style={{ position: "absolute", right: 0, marginTop: 10, width: 240, zIndex: 50 }}>
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
                                            <button onClick={handleLogout} className="dmi" style={{ color: "#e55", borderRadius: 10 }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#dc2626"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e55"; }}>
                                                <span className="dmic" style={{ background: "#fff1f2" }}><FaSignOutAlt size={11} color="#e55" /></span>
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

                {/* Category bar */}
                <div className="dcbar">
                    <div className="dcbi">
                        {CATEGORIES.map(({ label, cat, hot }) => (
                            <button key={cat} onClick={() => handleCategoryClick(cat)} className={`dcl${isCatActive(cat) ? " dca" : ""}`}>
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