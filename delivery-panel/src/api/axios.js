/**
 * axios.js — Delivery Panel v2.1
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api";

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem("deliveryAuth");
        if (raw) {
            const { token } = JSON.parse(raw);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
    } catch { /* ignore */ }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;

        if (!err.response && err.code === "ERR_NETWORK") {
            window.dispatchEvent(new CustomEvent("api:error", { detail: { type: "network", message: "Network error — check your connection" } }));
        } else if (status >= 500) {
            window.dispatchEvent(new CustomEvent("api:error", { detail: { type: "error", message: "Server error — please try again" } }));
        }

        if (status === 401) {
            localStorage.removeItem("deliveryAuth");
            if (!window.location.pathname.includes("/login"))
                window.location.replace("/login");
        }
        return Promise.reject(err);
    }
);

export default api;
