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
            localStorage.removeItem("adminAuth");
            const path = window.location.pathname;
            if (!path.includes("/admin/login")) {
                window.location.replace("/admin/login");
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