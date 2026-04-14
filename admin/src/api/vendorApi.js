import api from "./adminApi";

// ── Vendors ───────────────────────────────────────────────────
export const fetchVendors = (params) => api.get("/admin/vendors", { params });
export const fetchVendorById = (id) => api.get(`/admin/vendors/${id}`);
export const approveVendor = (id, payload) => api.patch(`/admin/vendors/${id}/approve`, payload);
export const rejectVendor = (id, payload) => api.patch(`/admin/vendors/${id}/reject`, payload);
export const suspendVendor = (id, payload) => api.patch(`/admin/vendors/${id}/suspend`, payload);
export const updateCommission = (id, payload) => api.patch(`/admin/vendors/${id}/commission`, payload);
export const deleteVendor = (id) => api.delete(`/admin/vendors/${id}`);

// ── Pincodes ──────────────────────────────────────────────────
export const fetchPincodes = (params) => api.get("/admin/pincodes", { params });
export const createPincode = (payload) => api.post("/admin/pincodes", payload);
export const updatePincode = (id, payload) => api.put(`/admin/pincodes/${id}`, payload);
export const deletePincode = (id) => api.delete(`/admin/pincodes/${id}`);
export const checkPincode = (code) => api.get(`/pincode/check/${code}`);

// ── Settlements ───────────────────────────────────────────────
export const fetchSettlements = (params) => api.get("/admin/settlements", { params });
export const processSettlements = () => api.post("/admin/settlements/process");
export const markSettlementPaid = (id, payload) => api.patch(`/admin/settlements/${id}/paid`, payload);
export const markBatchPaid = (batchId, payload) => api.patch(`/admin/settlements/batch/${batchId}/paid`, payload);