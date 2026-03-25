import { useState, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    FiGrid, FiShoppingBag, FiPackage, FiPlusCircle,
    FiEdit, FiMenu, FiX, FiLogOut, FiChevronRight,
    FiUsers, FiMessageSquare, FiBarChart2,
} from "react-icons/fi";

/* ── Logo ── */
const UXLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "1.5px solid #2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(37,99,235,0.15)",
        }}>
            <span style={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: 13, color: "#2563eb", letterSpacing: "0.02em" }}>UX</span>
        </div>
        <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", letterSpacing: "0.01em", lineHeight: 1.2 }}>UrbeXon</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase" }}>Admin Panel</div>
        </div>
    </div>
);

const NAV_ITEMS = [
    { label: "Dashboard", icon: FiGrid, to: "/admin" },
    { label: "Orders", icon: FiShoppingBag, to: "/admin/orders" },
    { label: "Products", icon: FiPackage, to: "/admin/products" },
    { label: "Add Product", icon: FiPlusCircle, to: "/admin/products/new" },
    { label: "Edit Product", icon: FiEdit, to: "/admin/products/edit", match: "/admin/products/edit" },
    { label: "Customers", icon: FiUsers, to: "/admin/users" },
    { label: "Queries", icon: FiMessageSquare, to: "/admin/queries" },
];

const NavItem = ({ item, active, onClick }) => {
    const Icon = item.icon;
    return (
        <Link
            to={item.to}
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 14px", borderRadius: 8,
                textDecoration: "none",
                background: active ? "#eff6ff" : "transparent",
                color: active ? "#2563eb" : "#475569",
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
                transition: "all 0.15s",
                borderLeft: active ? "3px solid #2563eb" : "3px solid transparent",
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#1e293b"; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; } }}
        >
            <Icon size={16} />
            <span>{item.label}</span>
            {active && <FiChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.6 }} />}
        </Link>
    );
};

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = useCallback((item) => {
        if (item.match) return location.pathname.startsWith(item.match);
        if (item.to === "/admin") return location.pathname === "/admin";
        return location.pathname.startsWith(item.to) && item.to !== "/admin";
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    const SidebarContent = () => (
        <div style={{
            display: "flex", flexDirection: "column", height: "100%",
            background: "#fff", borderRight: "1px solid #e2e8f0",
        }}>
            {/* Logo */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <UXLogo />
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px 8px" }}>
                    Navigation
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {NAV_ITEMS.map(item => (
                        <NavItem
                            key={item.to}
                            item={item}
                            active={isActive(item)}
                            onClick={() => setSidebarOpen(false)}
                        />
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div style={{ padding: "12px 8px", borderTop: "1px solid #f1f5f9" }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        padding: "9px 14px", border: "none", borderRadius: 8,
                        background: "transparent", color: "#ef4444",
                        fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                    <FiLogOut size={16} /> Logout
                </button>
                <div style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 12 }}>
                    UrbeXon Admin v2.0
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .adm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; display: none; }
        @media (max-width: 768px) {
          .adm-sidebar-desktop { display: none !important; }
          .adm-overlay { display: block; }
        }
        @media (min-width: 769px) {
          .adm-sidebar-mobile { display: none !important; }
          .adm-topbar-menu-btn { display: none !important; }
        }
      `}</style>

            {/* Desktop sidebar */}
            <div className="adm-sidebar-desktop" style={{ width: 220, flexShrink: 0, position: "sticky", top: 0, height: "100vh", zIndex: 20 }}>
                <SidebarContent />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <>
                    <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
                    <div className="adm-sidebar-mobile" style={{
                        position: "fixed", top: 0, left: 0, width: 240, height: "100vh",
                        zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
                    }}>
                        <div style={{ position: "absolute", top: 12, right: -40 }}>
                            <button onClick={() => setSidebarOpen(false)} style={{ background: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiX size={16} />
                            </button>
                        </div>
                        <SidebarContent />
                    </div>
                </>
            )}

            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Top bar (mobile) */}
                <div className="adm-topbar-menu-btn" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0",
                    position: "sticky", top: 0, zIndex: 30,
                }}>
                    <UXLogo />
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 13 }}
                    >
                        <FiMenu size={16} /> Menu
                    </button>
                </div>

                {/* Page content */}
                <main style={{ flex: 1, padding: "24px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;