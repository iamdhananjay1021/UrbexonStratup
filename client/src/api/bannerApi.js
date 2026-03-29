// ═══════════════════════════════════════════════════
// FILE 1: client/src/api/bannerApi.js
// ═══════════════════════════════════════════════════
import api from "./axios";

// Public — active banners only (for Home.jsx hero slider)
export const fetchActiveBanners = () => api.get("/banners");