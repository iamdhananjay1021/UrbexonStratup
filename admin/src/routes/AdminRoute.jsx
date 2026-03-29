import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";

const AdminRoute = () => {
    const { admin, loading } = useAdminAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    if (!admin) return <Navigate to="/admin/login" replace state={{ from: location }} />;
    if (!["admin", "owner"].includes(admin.role)) return <Navigate to="/admin/login" replace />;

    return <Outlet />;
};

export default AdminRoute;