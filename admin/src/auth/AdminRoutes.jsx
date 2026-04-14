import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";

const ADMIN_ROLES = ["admin", "owner"];

const AdminRoute = () => {
    const { admin, loading } = useAdminAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0e1a",
                gap: 12,
            }}>
                <style>{`
                    @keyframes al-spin { to { transform: rotate(360deg); } }
                `}</style>
                <div style={{
                    width: 36, height: 36,
                    border: "2px solid rgba(14,230,195,0.2)",
                    borderTopColor: "#0ee6c3",
                    borderRadius: "50%",
                    animation: "al-spin 0.7s linear infinite",
                }} />
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Authenticating
                </p>
            </div>
        );
    }

    // Not logged in → go to admin login
    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    // Logged in but not admin/owner (extra safety)
    if (!ADMIN_ROLES.includes(admin.role)) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;