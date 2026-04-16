import { createContext, useContext, useEffect, useState } from "react";
import adminApi from "../api/adminApi";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("adminAuth");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.token && parsed?.role) {
                    setAdmin(parsed);
                } else {
                    localStorage.removeItem("adminAuth");
                }
            }
        } catch {
            localStorage.removeItem("adminAuth");
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── Listen for token refresh from axios interceptor ── */
    useEffect(() => {
        const handler = (e) => {
            const data = e.detail;
            if (data?.token) {
                const updated = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    token: data.token,
                };
                localStorage.setItem("adminAuth", JSON.stringify(updated));
                setAdmin(updated);
            }
        };
        window.addEventListener("adminAuth:refreshed", handler);
        return () => window.removeEventListener("adminAuth:refreshed", handler);
    }, []);

    const login = async (email, password) => {
        const { data } = await adminApi.post("/auth/admin/login", { email, password });
        if (!data?.token || !data?._id || !data?.role) {
            throw new Error("Invalid server response");
        }
        if (!["admin", "owner"].includes(data.role)) {
            throw new Error("Access denied. Admin or Owner only.");
        }
        const adminData = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            token: data.token,
        };
        localStorage.setItem("adminAuth", JSON.stringify(adminData));
        setAdmin(adminData);
    };

    const logout = () => {
        localStorage.removeItem("adminAuth");
        setAdmin(null);
    };

    return (
        <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
