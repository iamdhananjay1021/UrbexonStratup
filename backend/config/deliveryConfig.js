/**
 * deliveryConfig.js
 * ─────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all delivery + pricing logic
 * Frontend never calculates prices — always fetched from backend
 * ─────────────────────────────────────────────────────────
 */

export const DELIVERY_CONFIG = {

    /* ── Pricing ── */
    FREE_DELIVERY_THRESHOLD: 499,
    ONLINE_DELIVERY_CHARGE: 40,
    COD_CHARGE: 70,
    PLATFORM_FEE: 11,

    /* ── Urbexon Hour (local quick delivery) ── */
    URBEXON_HOUR: {
        ENABLED: true,
        MAX_RADIUS_KM: 15,
        VENDOR_SELF_RADIUS_KM: 2,
        BASE_CHARGE: 25,
        CHARGE_PER_KM: 8,
        MAX_CHARGE: 150,
        ETA: "45–120 mins",
    },

    /* ── Shop / Hub location ── */
    SHOP_LAT: 26.41922,
    SHOP_LNG: 82.53598,
    SHOP_PINCODE: process.env.SHOP_PINCODE || "224122",

    /* ── COD rules ── */
    COD_RADIUS_KM: 15,
    COD_SERVICEABLE_PINCODES: ["224122"],

    /* ── Delivery ETAs ── */
    DELIVERY_ETA: {
        ECOMMERCE_STANDARD: "3–5 Business Days",
        COD_AREA: "1 Business Day",
        ONLINE_LOCAL: "2–3 Business Days",
        ONLINE_NATIONAL: "4–7 Business Days",
        URBEXON_HOUR: "45–120 mins",
    },

    /* ── Shiprocket ── */
    SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
};

export const DELIVERY_TYPES = {
    ECOMMERCE_STANDARD: "ECOMMERCE_STANDARD",
    URBEXON_HOUR: "URBEXON_HOUR",
};

/* ══════════════════════════════════════════════════════
   CALCULATE DELIVERY CHARGE
══════════════════════════════════════════════════════ */
export const calcDeliveryCharge = (itemsTotal, paymentMethod, options = {}) => {
    const { deliveryType = DELIVERY_TYPES.ECOMMERCE_STANDARD, distanceKm = 0 } = options;

    if (deliveryType === DELIVERY_TYPES.URBEXON_HOUR) {
        if (!DELIVERY_CONFIG.URBEXON_HOUR.ENABLED) throw new Error("Urbexon Hour is currently unavailable");
        if (distanceKm <= 0 || distanceKm > DELIVERY_CONFIG.URBEXON_HOUR.MAX_RADIUS_KM) {
            throw new Error(`Urbexon Hour supports up to ${DELIVERY_CONFIG.URBEXON_HOUR.MAX_RADIUS_KM} km only`);
        }

        const computed = DELIVERY_CONFIG.URBEXON_HOUR.BASE_CHARGE + (distanceKm * DELIVERY_CONFIG.URBEXON_HOUR.CHARGE_PER_KM);
        return Math.min(Math.round(computed), DELIVERY_CONFIG.URBEXON_HOUR.MAX_CHARGE);
    }

    if (paymentMethod === "COD") return DELIVERY_CONFIG.COD_CHARGE;
    if (itemsTotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    return DELIVERY_CONFIG.ONLINE_DELIVERY_CHARGE;
};

export const calcItemsTotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

export const calcFinalAmount = (itemsTotal, deliveryCharge) =>
    itemsTotal + deliveryCharge + DELIVERY_CONFIG.PLATFORM_FEE;

export const isCODServiceable = (pincode) =>
    DELIVERY_CONFIG.COD_SERVICEABLE_PINCODES.includes(pincode?.trim());

export const getDeliveryETA = ({ pincode, paymentMethod, deliveryType = DELIVERY_TYPES.ECOMMERCE_STANDARD }) => {
    if (deliveryType === DELIVERY_TYPES.URBEXON_HOUR) return DELIVERY_CONFIG.DELIVERY_ETA.URBEXON_HOUR;
    if (paymentMethod === "COD" && isCODServiceable(pincode)) return DELIVERY_CONFIG.DELIVERY_ETA.COD_AREA;
    if (isCODServiceable(pincode)) return DELIVERY_CONFIG.DELIVERY_ETA.ONLINE_LOCAL;
    return DELIVERY_CONFIG.DELIVERY_ETA.ONLINE_NATIONAL;
};

export const getDeliveryProvider = ({ deliveryType, distanceKm = 0 }) => {
    if (deliveryType !== DELIVERY_TYPES.URBEXON_HOUR) return "SHIPROCKET";
    return distanceKm <= DELIVERY_CONFIG.URBEXON_HOUR.VENDOR_SELF_RADIUS_KM ? "VENDOR_SELF" : "LOCAL_RIDER";
};
