import api from "./axios";

export const registerVendor = (formData) =>
    api.post("/vendor/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getVendorStatus = () => api.get("/vendor/status");
export const getVendorProfile = () => api.get("/vendor/me");
export const updateVendorProfile = (payload) => api.put("/vendor/me", payload);
export const toggleShopStatus = () => api.patch("/vendor/toggle-shop");

export const getVendorEarnings = () => api.get("/vendor/earnings");
export const getVendorWeeklyEarnings = () => api.get("/vendor/earnings/weekly");
