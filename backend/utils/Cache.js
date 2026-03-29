/**
 * cache.js
 * ─────────────────────────────────────────────────────────
 * In-memory cache using node-cache — free, no Redis needed
 * Works perfectly on Railway/Render single instance
 *
 * TTLs:
 *   products list  → 5 min  (changes when admin updates)
 *   homepage data  → 5 min
 *   single product → 10 min
 *   categories     → 30 min (rarely changes)
 *   deals          → 2 min  (time-sensitive)
 *
 * Auto-invalidated on create/update/delete via invalidateProduct()
 * ─────────────────────────────────────────────────────────
 */

import NodeCache from "node-cache";

const cache = new NodeCache({
    stdTTL: 300,   // default 5 min
    checkperiod: 60,    // cleanup every 60s
    useClones: false, // faster — don't deep-clone cached objects
    deleteOnExpire: true,
});

/* ── TTL constants (seconds) ── */
export const TTL = {
    PRODUCTS_LIST: 300,   // 5 min
    SINGLE_PRODUCT: 600,   // 10 min
    HOMEPAGE: 300,   // 5 min
    CATEGORIES: 1800,  // 30 min
    DEALS: 120,   // 2 min
    SUGGESTED: 300,   // 5 min
};

/* ── Cache key builders ── */
export const KEYS = {
    productsList: (q) => `products:list:${JSON.stringify(q)}`,
    singleProduct: (id) => `products:single:${id}`,
    homepage: () => "products:homepage",
    categories: () => "products:categories",
    deals: () => "products:deals",
    suggested: () => "products:suggested",
};

/* ── Get / set helpers ── */
export const getCache = (key) => cache.get(key) ?? null;
export const setCache = (key, val, ttl) => cache.set(key, val, ttl);
export const delCache = (key) => cache.del(key);

/* ── Invalidate all product-related cache on any product change ── */
export const invalidateProductCache = (productId = null) => {
    // Always clear list + homepage + deals + suggested
    const keys = cache.keys().filter(k =>
        k.startsWith("products:list:") ||
        k === KEYS.homepage() ||
        k === KEYS.categories() ||
        k === KEYS.deals() ||
        k === KEYS.suggested()
    );
    cache.del(keys);

    // Clear specific product cache if id provided
    if (productId) cache.del(KEYS.singleProduct(productId));

    console.log(`[Cache] Invalidated ${keys.length + (productId ? 1 : 0)} keys`);
};

/* ── Stats for health check / admin ── */
export const getCacheStats = () => ({
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
});

export default cache;