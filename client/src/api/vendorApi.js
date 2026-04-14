/**
 * client/src/api/vendorApi.js — FIXED
 * Added: getVendorOrders (was missing, VendorDashboard needs it)
 * Fixed: updateVendorProfile must send multipart when FormData
 */
import api from "./axios";

export const registerVendor = (formData) =>
    api.post("/vendor/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const getVendorStatus  = () => api.get("/vendor/status");
export const getVendorProfile = () => api.get("/vendor/me");

export const updateVendorProfile = (payload) => {
    const isFormData = payload instanceof FormData;
    return api.put("/vendor/me", payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
};

export const toggleShopStatus = () => api.patch("/vendor/toggle-shop");

export const getVendorEarnings       = () => api.get("/vendor/earnings");
export const getVendorWeeklyEarnings = () => api.get("/vendor/earnings/weekly");

// Vendor orders — route needs to exist on backend (see vendorRoutes fix)
export const getVendorOrders = (params) => api.get("/vendor/orders", { params });
