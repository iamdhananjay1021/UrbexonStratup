import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, memo } from "react";
import { useAdminAuth } from "../auth/AdminAuthContext";
import {
    FaThLarge, FaBox, FaClipboardList,
    FaSignOutAlt, FaBars, FaTimes, FaChevronRight, FaPlusCircle,
} from "react-icons/fa";

const NAV_ITEMS = [
    { to: ".", end: true, icon: FaThLarge, label: "Dashboard" },
    { to: "orders", icon: FaClipboardList, label: "Orders" },
    { to: "products", icon: FaBox, label: "Products" },
    { to: "products/new", icon: FaPlusCircle, label: "Add Product" },
];

const ADMIN_STYLES = `
    :root {
        --adm-bg: #f0f4ff;
        --adm-sidebar: #ffffff;
        --adm-surface: #ffffff;
        --adm-border: #e2e8f0;
        --adm-blue: #2563eb;
        --adm-blue-dim: rgba(37,99,235,0.08);
        --adm-blue-light: #eff6ff;
        --adm-text: #1e293b;
        --adm-muted: #64748b;
        --adm-faint: #94a3b8;
        --adm-red: #ef4444;
        --adm-topbar: #1e3a8a;
        --adm-topbar-text: #ffffff;
        --adm-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--adm-bg); }

    .adm-root {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    .adm-nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--adm-muted);
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.15s ease;
        margin-bottom: 2px;
    }
    .adm-nav-link:hover {
        color: var(--adm-text);
        background: var(--adm-blue-light);
    }
    .adm-nav-link.active {
        color: var(--adm-blue);
        background: var(--adm-blue-dim);
        border-color: rgba(37,99,235,0.15);
        font-weight: 600;
    }

    .adm-nav-icon {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        flex-shrink: 0;
        background: transparent;
        transition: background 0.15s;
    }
    .adm-nav-link.active .adm-nav-icon {
        background: rgba(37,99,235,0.12);
        color: var(--adm-blue);
    }
    .adm-nav-link:not(.active) .adm-nav-icon {
        color: var(--adm-faint);
    }

    .adm-logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px;
        border-radius: 8px;
        border: 1px solid rgba(239,68,68,0.25);
        background: rgba(239,68,68,0.05);
        color: rgba(239,68,68,0.8);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        letter-spacing: 0.01em;
    }
    .adm-logout-btn:hover {
        background: rgba(239,68,68,0.1);
        color: #ef4444;
        border-color: rgba(239,68,68,0.4);
    }

    .adm-mobile-btn {
        display: none;
        align-items: center;
        justify-content: center;
    }

    @media (max-width: 1023px) {
        .adm-desktop-sidebar { display: none !important; }
        .adm-mobile-btn { display: flex !important; }
    }
`;

/* ── UX Logo — sidebar (matches your brand image: circle with UX) ── */
const UXLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "1.5px solid #2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(37,99,235,0.18)",
            flexShrink: 0,
        }}>
            <span style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 700, fontSize: 13,
                color: "#2563eb", letterSpacing: "0.01em",
            }}>UX</span>
        </div>
        <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--adm-text)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                UrbeXon
            </div>
            <div style={{ fontSize: 10, color: "var(--adm-blue)", letterSpacing: "0.12em", fontWeight: 700, marginTop: 3, textTransform: "uppercase" }}>
                Admin Panel
            </div>
        </div>
    </div>
);

/* ── UX Logo — topbar (white version for dark background) ── */
const UXLogoTopbar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
            width: 30, height: 30, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.12)",
            flexShrink: 0,
        }}>
            <span style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 700, fontSize: 11, color: "#fff",
            }}>UX</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
            UrbeXon
        </span>
    </div>
);

const Avatar = ({ name, size = 32, style = {} }) => (
    <div style={{
        width: size, height: size, borderRadius: 8,
        background: "rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.4,
        flexShrink: 0, ...style,
    }}>
        {name?.[0]?.toUpperCase() || "A"}
    </div>
);

const SidebarAvatar = ({ name, size = 34 }) => (
    <div style={{
        width: size, height: size, borderRadius: 8,
        background: "var(--adm-blue-dim)",
        border: "1px solid rgba(37,99,235,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--adm-blue)", fontWeight: 700, fontSize: size * 0.4,
        flexShrink: 0,
    }}>
        {name?.[0]?.toUpperCase() || "A"}
    </div>
);

const SidebarContent = memo(({ admin, logout, onClose }) => {
    const roleColor = admin?.role === "owner" ? "#d97706" : "#2563eb";
    const roleBg = admin?.role === "owner" ? "rgba(217,119,6,0.08)" : "var(--adm-blue-dim)";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Brand / Logo */}
            <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--adm-border)" }}>
                <UXLogo />
            </div>

            {/* Profile */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--adm-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SidebarAvatar name={admin?.name} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {admin?.name || "Admin"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--adm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                            {admin?.email}
                        </div>
                    </div>
                </div>
                <div style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                    border: `1px solid ${roleColor}30`, background: roleBg,
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 11, fontWeight: 600, color: roleColor,
                    textTransform: "capitalize", letterSpacing: "0.02em",
                }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: roleColor }} />
                    {admin?.role || "admin"}
                </div>
            </div>

            {/* Nav */}
            <div style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: "var(--adm-faint)",
                    letterSpacing: "0.12em", padding: "0 8px 10px", textTransform: "uppercase",
                }}>
                    Navigation
                </div>
                <nav>
                    {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            className={({ isActive }) => `adm-nav-link${isActive ? " active" : ""}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="adm-nav-icon">
                                        <Icon size={13} />
                                    </div>
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {isActive && (
                                        <FaChevronRight size={9} style={{ color: "var(--adm-blue)", opacity: 0.6 }} />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Logout */}
            <div style={{ padding: "10px 10px 20px" }}>
                <div style={{ height: 1, background: "var(--adm-border)", marginBottom: 12 }} />
                <button onClick={logout} className="adm-logout-btn">
                    <FaSignOutAlt size={11} /> Sign Out
                </button>
            </div>
        </div>
    );
});
SidebarContent.displayName = "SidebarContent";

const Admin = () => {
    const { admin, logout } = useAdminAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const currentLabel = (() => {
        const seg = location.pathname.replace(/.*\/admin\/?/, "") || ".";
        return NAV_ITEMS.find(n => n.to === seg || (n.to === "." && seg === "."))?.label || "Dashboard";
    })();

    const closeMobile = () => setMobileOpen(false);

    return (
        <div className="adm-root" style={{ minHeight: "100vh", background: "var(--adm-bg)", display: "flex", flexDirection: "column" }}>
            <style>{ADMIN_STYLES}</style>

            {/* TOPBAR */}
            <header style={{
                height: 54,
                background: "var(--adm-topbar)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "0 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "sticky", top: 0, zIndex: 50,
                boxShadow: "0 2px 8px rgba(30,58,138,0.25)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMobileOpen(v => !v)}
                        className="adm-mobile-btn"
                        style={{
                            alignItems: "center", justifyContent: "center",
                            width: 32, height: 32,
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 7, color: "rgba(255,255,255,0.8)", cursor: "pointer",
                        }}
                    >
                        {mobileOpen ? <FaTimes size={12} /> : <FaBars size={12} />}
                    </button>

                    {/* Logo */}
                    <UXLogoTopbar />

                    {/* Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>/</span>
                        <span style={{ fontSize: 13, color: "#fff", fontWeight: 700, letterSpacing: "-0.01em" }}>
                            {currentLabel}
                        </span>
                    </div>
                </div>

                {/* Right: user + logout */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 9, padding: "5px 12px 5px 6px",
                    }}>
                        <Avatar name={admin?.name} size={26} />
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                                {admin?.name || "Admin"}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "capitalize", letterSpacing: "0.03em" }}>
                                {admin?.role}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8,
                            border: "1px solid rgba(239,68,68,0.4)",
                            background: "rgba(239,68,68,0.12)",
                            color: "rgba(255,120,120,0.9)",
                            fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                            cursor: "pointer", transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.22)"; e.currentTarget.style.color = "#fca5a5"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "rgba(255,120,120,0.9)"; }}
                    >
                        <FaSignOutAlt size={10} /> Logout
                    </button>
                </div>
            </header>

            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

                {/* Desktop Sidebar */}
                <aside
                    className="adm-desktop-sidebar"
                    style={{
                        width: 220, flexShrink: 0,
                        background: "var(--adm-sidebar)",
                        borderRight: "1px solid var(--adm-border)",
                        height: "calc(100vh - 54px)",
                        position: "sticky", top: 54,
                        overflowY: "auto",
                        boxShadow: "var(--adm-shadow)",
                    }}
                >
                    <SidebarContent admin={admin} logout={logout} onClose={closeMobile} />
                </aside>

                {/* Mobile Drawer */}
                {mobileOpen && (
                    <>
                        <div
                            onClick={closeMobile}
                            style={{
                                position: "fixed", inset: 0, zIndex: 40,
                                background: "rgba(15,23,42,0.5)",
                                backdropFilter: "blur(4px)",
                            }}
                        />
                        <div style={{
                            position: "fixed", left: 0, top: 54, bottom: 0,
                            width: 224, background: "var(--adm-sidebar)",
                            borderRight: "1px solid var(--adm-border)",
                            zIndex: 45, overflowY: "auto",
                            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
                        }}>
                            <SidebarContent admin={admin} logout={logout} onClose={closeMobile} />
                        </div>
                    </>
                )}

                {/* Main Content */}
                <main style={{
                    flex: 1, minWidth: 0,
                    overflowY: "auto",
                    background: "var(--adm-bg)",
                    padding: "24px",
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Admin;