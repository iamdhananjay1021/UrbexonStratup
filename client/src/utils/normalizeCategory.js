export const normalizeCategory = (value = "") =>
    value
        .toLowerCase()
        .replace(/['"]/g, "")        // ✅ apostrophe/quotes hatao
        .replace(/\s+/g, "-")
        .replace(/_/g, "-")
        .replace(/[^a-z0-9-]/g, "") // ✅ special chars hatao
        .replace(/-+/g, "-")
        .trim();