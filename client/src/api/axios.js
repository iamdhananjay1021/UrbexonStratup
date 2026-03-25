import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:9000/api";

const api = axios.create({
  baseURL,
  timeout: 60_000, // 60s — handles Render cold starts
});

/* ── Request: attach user token ──────────────────────────── */
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      localStorage.removeItem("auth");
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
      localStorage.removeItem("auth");
      const path = window.location.pathname;
      // ✅ FIX: only redirect to /login for client routes
      // Admin routes have their own adminApi with separate interceptor
      if (!path.includes("/login") && !path.startsWith("/admin")) {
        window.location.replace("/login");
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