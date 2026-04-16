/**
 * deliveryConfig.js — PRODUCTION
 * COD: Available PAN-INDIA (restriction removed)
 * Urbexon Hour: Local express delivery up to 15km
 */

export const DELIVERY_CONFIG = {
    FREE_DELIVERY_THRESHOLD: 499,
    ONLINE_DELIVERY_CHARGE: 40,
    COD_CHARGE: 70,
    PLATFORM_FEE: 11,

    URBEXON_HOUR: {
        ENABLED: true,
        MAX_RADIUS_KM: 15,
        VENDOR_SELF_RADIUS_KM: 2,
        BASE_CHARGE: 25,
        CHARGE_PER_KM: 8,
        MAX_CHARGE: 150,
        ETA: "45–120 mins",
    },

    SHOP_LAT: 26.41922,
    SHOP_LNG: 82.53598,
    SHOP_PINCODE: process.env.SHOP_PINCODE || "224122",

    // COD managed per-pincode via Pincode DB (Flipkart-style)
    // addressController.verifyPincode checks Pincode model for eligibility
    COD_MANAGED_BY_PINCODE: true,

    DELIVERY_ETA: {
        ECOMMERCE_STANDARD: "3–5 Business Days",
        ONLINE_LOCAL: "2–3 Business Days",
        ONLINE_NATIONAL: "4–7 Business Days",
        URBEXON_HOUR: "45–120 mins",
    },

    SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
};

export const DELIVERY_TYPES = {
    ECOMMERCE_STANDARD: "ECOMMERCE_STANDARD",
    URBEXON_HOUR: "URBEXON_HOUR",
};

export const calcDeliveryCharge = (itemsTotal, paymentMethod, options = {}) => {
    const { deliveryType = DELIVERY_TYPES.ECOMMERCE_STANDARD, distanceKm = 0 } = options;

    if (deliveryType === DELIVERY_TYPES.URBEXON_HOUR) {
        if (!DELIVERY_CONFIG.URBEXON_HOUR.ENABLED) throw new Error("Urbexon Hour is currently unavailable");
        if (distanceKm > DELIVERY_CONFIG.URBEXON_HOUR.MAX_RADIUS_KM)
            throw new Error(`Urbexon Hour supports up to ${DELIVERY_CONFIG.URBEXON_HOUR.MAX_RADIUS_KM} km only`);
        const computed = DELIVERY_CONFIG.URBEXON_HOUR.BASE_CHARGE + (distanceKm * DELIVERY_CONFIG.URBEXON_HOUR.CHARGE_PER_KM);
        return Math.min(Math.round(computed), DELIVERY_CONFIG.URBEXON_HOUR.MAX_CHARGE);
    }

    // COD available everywhere
    if (paymentMethod === "COD") return DELIVERY_CONFIG.COD_CHARGE;
    if (itemsTotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    return DELIVERY_CONFIG.ONLINE_DELIVERY_CHARGE;
};

export const calcItemsTotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

export const calcFinalAmount = (itemsTotal, deliveryCharge) =>
    itemsTotal + deliveryCharge + DELIVERY_CONFIG.PLATFORM_FEE;

// @deprecated — COD eligibility now managed by Pincode DB model (see addressController)
export const isCODServiceable = (_pincode) => true;

export const getDeliveryETA = ({ deliveryType = DELIVERY_TYPES.ECOMMERCE_STANDARD } = {}) => {
    if (deliveryType === DELIVERY_TYPES.URBEXON_HOUR) return DELIVERY_CONFIG.DELIVERY_ETA.URBEXON_HOUR;
    return DELIVERY_CONFIG.DELIVERY_ETA.ECOMMERCE_STANDARD;
};

export const getDeliveryProvider = ({ deliveryType, distanceKm = 0 }) => {
    if (deliveryType !== DELIVERY_TYPES.URBEXON_HOUR) return "SHIPROCKET";
    return distanceKm <= DELIVERY_CONFIG.URBEXON_HOUR.VENDOR_SELF_RADIUS_KM ? "VENDOR_SELF" : "LOCAL_RIDER";
};
