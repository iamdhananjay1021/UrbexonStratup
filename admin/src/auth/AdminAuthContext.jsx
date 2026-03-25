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

    const login = async (email, password) => {
        const { data } = await adminApi.post("/auth/admin/login", { email, password });
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

        // ✅ Token set hone ka wait karo
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    const logout = () => {
        localStorage.removeItem("adminAuth");
        setAdmin(null);
        // ✅ window.location nahi — AdminRoute khud /admin/login pe redirect karega
    };

    return (
        <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);