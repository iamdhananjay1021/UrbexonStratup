/**
 * deliveryConfig.js
 * ─────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all delivery + pricing logic
 * Frontend never calculates prices — always fetched from backend
 * ─────────────────────────────────────────────────────────
 */

export const DELIVERY_CONFIG = {

    /* ── Pricing ── */
    FREE_DELIVERY_THRESHOLD: 499,   // Online orders above this → free delivery
    ONLINE_DELIVERY_CHARGE: 40,    // Online payment delivery fee (below threshold)
    COD_CHARGE: 70,    // COD delivery fee — always applied
    PLATFORM_FEE: 11,     // Platform fee (0 for now)

    /* ── Shop / Hub location ── */
    SHOP_LAT: 26.41922,
    SHOP_LNG: 82.53598,
    SHOP_PINCODE: process.env.SHOP_PINCODE || "224122",

    /* ── COD rules ── */
    COD_RADIUS_KM: 15,
    COD_SERVICEABLE_PINCODES: ["224122"], // Only these pincodes get COD + 1-day delivery

    /* ── Delivery ETAs ── */
    DELIVERY_ETA: {
        COD_AREA: "1 Business Day",
        ONLINE_LOCAL: "2–3 Business Days",
        ONLINE_NATIONAL: "4–7 Business Days",
    },

    /* ── Shiprocket ── */
    SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    // SHIPROCKET_MOCK=true  → mock mode (no account needed, for testing)
    // SHIPROCKET_MOCK=false → real mode (needs SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD)
};

/* ══════════════════════════════════════════════════════
   CALCULATE DELIVERY CHARGE
══════════════════════════════════════════════════════ */
export const calcDeliveryCharge = (itemsTotal, paymentMethod) => {
    if (paymentMethod === "COD") return DELIVERY_CONFIG.COD_CHARGE;
    if (itemsTotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    return DELIVERY_CONFIG.ONLINE_DELIVERY_CHARGE;
};

/* ══════════════════════════════════════════════════════
   CALCULATE ITEMS TOTAL
══════════════════════════════════════════════════════ */
export const calcItemsTotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

/* ══════════════════════════════════════════════════════
   CALCULATE FINAL AMOUNT
══════════════════════════════════════════════════════ */
export const calcFinalAmount = (itemsTotal, deliveryCharge) =>
    itemsTotal + deliveryCharge + DELIVERY_CONFIG.PLATFORM_FEE;

/* ══════════════════════════════════════════════════════
   COD SERVICEABILITY
══════════════════════════════════════════════════════ */
export const isCODServiceable = (pincode) =>
    DELIVERY_CONFIG.COD_SERVICEABLE_PINCODES.includes(pincode?.trim());

/* ══════════════════════════════════════════════════════
   DELIVERY ETA STRING
══════════════════════════════════════════════════════ */
export const getDeliveryETA = (pincode, paymentMethod) => {
    if (paymentMethod === "COD" && isCODServiceable(pincode))
        return DELIVERY_CONFIG.DELIVERY_ETA.COD_AREA;
    return DELIVERY_CONFIG.DELIVERY_ETA.ONLINE_NATIONAL;
};