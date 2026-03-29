// ═══════════════════════════════════════════════════
// FILE 3: admin/src/api/bannerApi.js
// ═══════════════════════════════════════════════════
import adminApi from "./adminApi";

// Admin — full CRUD
export const fetchAllBanners = () => adminApi.get("/banners/all");
export const createBanner = (formData) => adminApi.post("/banners", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateBanner = (id, formData) => adminApi.put(`/banners/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteBanner = (id) => adminApi.delete(`/banners/${id}`);
export const toggleBanner = (id) => adminApi.patch(`/banners/${id}/toggle`);