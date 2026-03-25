// utils/normalizeCategory.js
export const normalizeCategory = (value = "") =>
    value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-")
        .replace(/-+/g, "-")
        .trim();