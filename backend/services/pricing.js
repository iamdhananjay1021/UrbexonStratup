/**
 * pricing.js — Backend pricing utility
 * ✅ NEVER trusts frontend prices
 * ✅ Always fetches prices from DB
 * ✅ Single function used by both COD + Online payment flows
 */

import Product from "../models/Product.js";
import {
    calcDeliveryCharge,
    calcItemsTotal,
    calcFinalAmount,
    DELIVERY_CONFIG,
} from "../config/deliveryConfig.js";

/**
 * Validate and price cart items from DB
 * Returns formatted items with DB prices (ignores frontend prices)
 *
 * @param {Array} frontendItems - items from frontend request
 * @returns {{ formattedItems, itemsTotal, outOfStock }}
 */
export const validateAndPriceItems = async (frontendItems) => {
    if (!Array.isArray(frontendItems) || frontendItems.length === 0)
        throw new Error("Cart is empty");
    if (frontendItems.length > 20)
        throw new Error("Too many items in cart (max 20)");

    const formattedItems = [];
    let itemsTotal = 0;

    for (const item of frontendItems) {
        const productId = item.productId || item._id;
        if (!productId) throw new Error("Invalid product in cart");

        const product = await Product.findById(productId)
            .select("name price mrp inStock stock images")
            .lean();

        if (!product) throw new Error(`Product not found: ${productId}`);

        const qty = Math.min(Math.max(1, Number(item.qty || item.quantity || 1)), 100);

        if (!product.inStock || product.stock < qty)
            throw new Error(`"${product.name}" is out of stock`);

        // ✅ Use DB price — completely ignore frontend price
        const dbPrice = Number(product.price);
        itemsTotal += dbPrice * qty;

        formattedItems.push({
            productId: product._id,
            name: String(product.name).slice(0, 200),
            price: dbPrice,                          // ✅ DB price
            mrp: product.mrp ? Number(product.mrp) : null,
            qty,
            image: typeof item.image === "string"
                ? item.image
                : product.images?.[0]?.url || "",
            customization: {
                text: String(item.customization?.text || "").trim().slice(0, 500),
                imageUrl: String(item.customization?.imageUrl || "").trim().slice(0, 1000),
                note: String(item.customization?.note || "").trim().slice(0, 1000),
            },
            selectedSize: String(item.selectedSize || "").trim().slice(0, 50),
        });
    }

    return { formattedItems, itemsTotal };
};

/**
 * Deduct stock for all items
 * Call AFTER creating order (within same try-catch)
 * Rolls back if any deduction fails
 *
 * @param {Array} items - validated formatted items
 */
export const deductStock = async (items) => {
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) continue;
        if (!product.inStock || product.stock < item.qty)
            throw new Error(`"${item.name}" went out of stock`);
        product.stock -= item.qty;
        product.inStock = product.stock > 0;
        await product.save();
    }
};

/**
 * Restore stock (on order cancel / payment failure)
 * Silent per item — logs warnings only
 *
 * @param {Array} items
 */
export const restoreStock = async (items) => {
    for (const item of items) {
        try {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.qty;
                product.inStock = product.stock > 0;
                await product.save();
            }
        } catch (e) {
            console.warn("[StockRestore] Failed for", item.productId, e.message);
        }
    }
};

/**
 * Full pricing calculation — used by both COD + Online flows
 *
 * @param {Array} frontendItems
 * @param {"COD"|"RAZORPAY"} paymentMethod
 * @returns {{ formattedItems, itemsTotal, deliveryCharge, finalTotal }}
 */
export const calculateOrderPricing = async (frontendItems, paymentMethod) => {
    const { formattedItems, itemsTotal } = await validateAndPriceItems(frontendItems);
    const deliveryCharge = calcDeliveryCharge(itemsTotal, paymentMethod);
    const finalTotal = calcFinalAmount(itemsTotal, deliveryCharge);

    return {
        formattedItems,
        itemsTotal,
        deliveryCharge,
        platformFee: DELIVERY_CONFIG.PLATFORM_FEE,
        finalTotal,
    };
};