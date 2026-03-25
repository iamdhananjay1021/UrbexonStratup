import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";

const AdminRoute = () => {
    const { admin, loading } = useAdminAuth();
    const location = useLocation();

    /* ⏳ Wait until auth check finishes */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-slate-300 border-t-slate-900 rounded-full"></div>
            </div>
        );
    }

    /* 🔐 Not logged in → redirect to admin login */
    if (!admin) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: location }}
            />
        );
    }

    /* 🛑 Role protection (extra safety) */
    if (!["admin", "owner"].includes(admin.role)) {
        return <Navigate to="/admin/login" replace />;
    }

    /* ✅ Access granted */
    return <Outlet />;
};

export default AdminRoute;