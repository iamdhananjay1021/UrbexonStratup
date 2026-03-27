/**
 * deliveryConfig.js
 * ✅ SINGLE SOURCE OF TRUTH for all delivery/pricing logic
 * Frontend never calculates prices — always fetched from backend
 */

export const DELIVERY_CONFIG = {
    // Pricing
    FREE_DELIVERY_THRESHOLD: 499,    // online orders above this → free delivery
    ONLINE_DELIVERY_CHARGE: 40,      // online payment delivery fee (below threshold)
    COD_CHARGE: 70,                  // COD delivery fee always applied
    PLATFORM_FEE: 0,                 // platform fee (0 for now)

    // Shop location
    SHOP_LAT: 26.41922,
    SHOP_LNG: 82.53598,

    // COD rules
    COD_RADIUS_KM: 15,               // max distance for COD
    COD_SERVICEABLE_PINCODES: ["224122"], // ✅ Only these pincodes get COD + 1-day delivery

    // Delivery ETAs
    DELIVERY_ETA: {
        COD_AREA: "1 Business Day",          // 224122 area
        ONLINE_LOCAL: "2-3 Business Days",   // within state
        ONLINE_NATIONAL: "4-7 Business Days",// rest of India
    },

    // Coming soon pincodes (everything except COD_SERVICEABLE_PINCODES)
    // Frontend shows "Coming Soon" for COD on these
};

/**
 * Calculate delivery charge based on payment method and items total
 * @param {number} itemsTotal
 * @param {"COD"|"RAZORPAY"} paymentMethod
 * @returns {number}
 */
export const calcDeliveryCharge = (itemsTotal, paymentMethod) => {
    if (paymentMethod === "COD") return DELIVERY_CONFIG.COD_CHARGE;
    if (itemsTotal >= DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    return DELIVERY_CONFIG.ONLINE_DELIVERY_CHARGE;
};

/**
 * Calculate items total from validated DB prices
 * @param {Array} items - [{price, qty}]
 * @returns {number}
 */
export const calcItemsTotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

/**
 * Calculate final amount
 * @param {number} itemsTotal
 * @param {number} deliveryCharge
 * @returns {number}
 */
export const calcFinalAmount = (itemsTotal, deliveryCharge) =>
    itemsTotal + deliveryCharge + DELIVERY_CONFIG.PLATFORM_FEE;

/**
 * Check if pincode is COD serviceable
 * @param {string} pincode
 * @returns {boolean}
 */
export const isCODServiceable = (pincode) =>
    DELIVERY_CONFIG.COD_SERVICEABLE_PINCODES.includes(pincode?.trim());

/**
 * Get delivery ETA string for a pincode + payment method
 * @param {string} pincode
 * @param {"COD"|"RAZORPAY"} paymentMethod
 * @returns {string}
 */
export const getDeliveryETA = (pincode, paymentMethod) => {
    if (paymentMethod === "COD" && isCODServiceable(pincode))
        return DELIVERY_CONFIG.DELIVERY_ETA.COD_AREA;
    return DELIVERY_CONFIG.DELIVERY_ETA.ONLINE_NATIONAL;
};