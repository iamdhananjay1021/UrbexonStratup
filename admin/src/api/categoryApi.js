// ═══════════════════════════════════════════════════
// FILE 4: admin/src/api/categoryApi.js
// ═══════════════════════════════════════════════════
import adminApi from "./adminApi";

// Admin — full CRUD
export const fetchAllCategories = () => adminApi.get("/categories/admin/all");
export const createCategory = (formData) => adminApi.post("/categories", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateCategory = (id, formData) => adminApi.put(`/categories/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteCategory = (id) => adminApi.delete(`/categories/${id}`);