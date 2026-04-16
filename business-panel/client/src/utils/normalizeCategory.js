/**
 * normalizeCategory
 * ─────────────────
 * Accepts any format:
 *   "mens-fashion"     → "Mens-Fashion"  ← slug from URL
 *   "Men's Fashion"    → "Mens-Fashion"  ← display name
 *   "MENS FASHION"     → "Mens-Fashion"  ← uppercase
 *   "mens fashion"     → "Mens-Fashion"  ← lowercase with space
 *
 * Stored in DB as: "Mens-Fashion" (title-case slug)
 * This ensures consistent matching regardless of input source.
 */
export const normalizeCategory = (raw) => {
    if (!raw || typeof raw !== "string") return "";

    return raw
        .trim()
        .toLowerCase()
        .replace(/'/g, "")          // remove apostrophes: men's → mens
        .replace(/\s+/g, "-")       // spaces → hyphens
        .replace(/[^a-z0-9-]/g, "") // remove special chars
        .replace(/-+/g, "-")        // collapse multiple hyphens
        .replace(/^-|-$/g, "")      // trim leading/trailing hyphens
        .replace(/(^|-)([a-z])/g, (_, sep, char) => sep + char.toUpperCase()); // Title-Case each word
};

/**
 * slugToLabel
 * ───────────
 * "mens-fashion" → "Men's Fashion"
 * Used for display purposes.
 */
export const slugToLabel = (slug) => {
    if (!slug) return "";
    const OVERRIDES = {
        "mens-fashion": "Men's Fashion",
        "womens-fashion": "Women's Fashion",
        "ethnic-wear": "Ethnic Wear",
        "bags-wallets": "Bags & Wallets",
        "electronics": "Electronics",
        "lifestyle": "Lifestyle",
        "kids-wear": "Kids' Wear",
        "footwear": "Footwear",
        "watches": "Watches",
        "jewellery": "Jewellery",
        "mobile-phones": "Mobile Phones",
        "laptops-pcs": "Laptops & PCs",
        "audio-earphones": "Audio & Earphones",
        "smart-gadgets": "Smart Gadgets",
        "camera-photo": "Camera & Photo",
        "home-decor": "Home Decor",
        "kitchen-essentials": "Kitchen Essentials",
        "bedding-bath": "Bedding & Bath",
        "furniture": "Furniture",
        "skincare": "Skincare",
        "perfumes": "Perfumes",
        "haircare": "Haircare",
        "sports-fitness": "Sports & Fitness",
        "outdoor-travel": "Outdoor & Travel",
        "books-stationery": "Books & Stationery",
        "toys-games": "Toys & Games",
        "grocery-food": "Grocery & Food",
    };
    return OVERRIDES[slug.toLowerCase()] || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};