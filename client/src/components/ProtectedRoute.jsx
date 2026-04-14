import { memo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = memo(({ allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    // 🔄 Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-t-[#1a1447] border-gray-200 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading…</p>
                </div>
            </div>
        );
    }

    // ❌ Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // ❌ Role not allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // ✅ Access granted
    return <Outlet />;
});

ProtectedRoute.displayName = "ProtectedRoute";
export default ProtectedRoute;