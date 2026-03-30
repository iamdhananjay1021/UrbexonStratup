import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    color: isActive ? "#1d4ed8" : "#334155",
    background: isActive ? "#dbeafe" : "transparent",
});

const VendorLayout = () => {
    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
            <header style={{ background: "#0f172a", color: "#fff", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0, fontSize: 18 }}>Vendor Portal</h1>
                <NavLink to="/" style={{ color: "#bfdbfe", textDecoration: "none", fontSize: 13 }}>← Back to Store</NavLink>
            </header>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
                <aside style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, height: "fit-content" }}>
                    <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <NavLink to="status" style={linkStyle}>Application Status</NavLink>
                        <NavLink to="apply" style={linkStyle}>Apply as Vendor</NavLink>
                        <NavLink to="dashboard" style={linkStyle}>Dashboard</NavLink>
                        <NavLink to="earnings" style={linkStyle}>Earnings</NavLink>
                        <NavLink to="profile" style={linkStyle}>Profile</NavLink>
                    </nav>
                </aside>

                <main style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default VendorLayout;
