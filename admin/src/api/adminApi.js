import axios from "axios";

const baseURL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:9000/api";

const api = axios.create({
    baseURL,
    timeout: 60_000, // 60s — handles Render cold starts
});

/* ── Request: attach admin token ─────────────────────────── */
api.interceptors.request.use(
    (config) => {
        try {
            const raw = localStorage.getItem("adminAuth");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            }
        } catch {
            localStorage.removeItem("adminAuth");
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/* ── Response: handle errors ─────────────────────────────── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const msg = String(error.response?.data?.message || "").toLowerCase();
            const reqUrl = String(error.config?.url || "").toLowerCase();
            const isAuthRoute = reqUrl.includes("/auth/admin/login")
                || reqUrl.includes("/auth/admin/forgot-password")
                || reqUrl.includes("/auth/admin/reset-password");
            const isTokenError = msg.includes("token")
                || msg.includes("not authorized")
                || msg.includes("not authenticated")
                || msg.includes("invalid token")
                || msg.includes("user not found");

            // Only force logout when backend explicitly indicates auth/token issue.
            if (!isAuthRoute && isTokenError) {
                localStorage.removeItem("adminAuth");
                const path = window.location.pathname;
                if (!path.includes("/admin/login")) {
                    window.location.assign("/admin/login");
                }
            }
        }

        if (error.code === "ECONNABORTED") {
            error.message = "Request timed out. Please try again.";
        }

        if (!error.response) {
            error.message = "Network error. Please check your connection.";
        }

        return Promise.reject(error);
    }
);

export default api;
