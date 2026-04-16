/**
 * cartSlice.js — Urbexon Dual Cart System
 * ─────────────────────────────────────────
 * TWO separate carts:
 *   • ecommerceCart  → regular products (productType: "ecommerce" or undefined)
 *   • uhCart         → Urbexon Hour products (productType: "urbexon_hour")
 *
 * No mixing, no conflicts, clean checkout separation.
 */

import { createSlice, createSelector } from "@reduxjs/toolkit";

// ─── Helpers ─────────────────────────────────────────────
const hasCustomization = (item) =>
    !!(
        item?.customization?.text ||
        item?.customization?.imageUrl ||
        item?.customization?.note
    );

const isSameSimpleProduct = (a, b) =>
    a._id === b._id && !hasCustomization(a) && !hasCustomization(b);

const isUHProduct = (item) => item?.productType === "urbexon_hour";

// ─── Initial State ───────────────────────────────────────
const initialState = {
    // Standard ecommerce cart
    ecommerceCart: [],

    // Urbexon Hour express cart
    uhCart: [],
};

// ─── Slice ───────────────────────────────────────────────
const cartSlice = createSlice({
    name: "cart",
    initialState,

    reducers: {
        // ── Add to correct cart automatically ──────────────
        addToCart: (state, { payload }) => {
            const isUH = isUHProduct(payload);
            const cart = isUH ? state.uhCart : state.ecommerceCart;
            const key = isUH ? "uhCart" : "ecommerceCart";

            if (hasCustomization(payload)) {
                state[key].push({ ...payload, quantity: 1 });
                return;
            }

            const existing = cart.find((i) => isSameSimpleProduct(i, payload));
            if (existing) {
                existing.quantity = Math.min(existing.quantity + 1, 99);
            } else {
                state[key].push({ ...payload, quantity: 1 });
            }
        },

        // ── Add specifically to UH cart ────────────────────
        addToUHCart: (state, { payload }) => {
            const existing = state.uhCart.find((i) => isSameSimpleProduct(i, payload));
            if (existing) {
                existing.quantity = Math.min(existing.quantity + 1, 99);
            } else {
                state.uhCart.push({ ...payload, productType: "urbexon_hour", quantity: 1 });
            }
        },

        // ── Add specifically to ecommerce cart ─────────────
        addToEcommerceCart: (state, { payload }) => {
            const existing = state.ecommerceCart.find((i) => isSameSimpleProduct(i, payload));
            if (existing) {
                existing.quantity = Math.min(existing.quantity + 1, 99);
            } else {
                state.ecommerceCart.push({ ...payload, quantity: 1 });
            }
        },

        // ── Buy now (replaces cart for that type) ──────────
        buyNowSingle: (state, { payload }) => {
            if (isUHProduct(payload)) {
                state.uhCart = [{ ...payload, quantity: 1 }];
            } else {
                state.ecommerceCart = [{ ...payload, quantity: 1 }];
            }
        },

        // ── Quantity controls (works for both carts) ───────
        updateQuantity: (state, { payload }) => {
            const { id, quantity, cartType = "ecommerce" } = payload;
            if (quantity < 1 || quantity > 99) return;
            const cart = cartType === "urbexon_hour" ? state.uhCart : state.ecommerceCart;
            const item = cart.find((i) => i._id === id);
            if (item) item.quantity = quantity;
        },

        incQty: (state, { payload }) => {
            const { id, cartType = "ecommerce" } = typeof payload === "string"
                ? { id: payload }
                : payload;
            const cart = cartType === "urbexon_hour" ? state.uhCart : state.ecommerceCart;
            const item = cart.find((i) => i._id === id);
            if (item && item.quantity < 99) item.quantity++;
        },

        decQty: (state, { payload }) => {
            const { id, cartType = "ecommerce" } = typeof payload === "string"
                ? { id: payload }
                : payload;
            const cart = cartType === "urbexon_hour" ? state.uhCart : state.ecommerceCart;
            const item = cart.find((i) => i._id === id);
            if (item && item.quantity > 1) item.quantity--;
        },

        removeFromCart: (state, { payload }) => {
            const { id, cartType = "ecommerce" } = typeof payload === "string"
                ? { id: payload }
                : payload;
            if (cartType === "urbexon_hour") {
                state.uhCart = state.uhCart.filter((i) => i._id !== id);
            } else {
                state.ecommerceCart = state.ecommerceCart.filter((i) => i._id !== id);
            }
        },

        // ── Clear individual carts ─────────────────────────
        clearEcommerceCart: (state) => {
            state.ecommerceCart = [];
        },

        clearUHCart: (state) => {
            state.uhCart = [];
        },

        // ── Clear everything ───────────────────────────────
        clearCart: (state) => {
            state.ecommerceCart = [];
            state.uhCart = [];
        },

        // ── Legacy: kept for backward compat ──────────────
        clearMixError: () => { /* no-op — no longer needed */ },
    },
});

// ─── Actions ─────────────────────────────────────────────
export const {
    addToCart,
    addToUHCart,
    addToEcommerceCart,
    buyNowSingle,
    updateQuantity,
    incQty,
    decQty,
    removeFromCart,
    clearEcommerceCart,
    clearUHCart,
    clearCart,
    clearMixError, // kept for backward compat
} = cartSlice.actions;

export default cartSlice.reducer;

// ─── Selectors ───────────────────────────────────────────
const selectCartState = (state) => state.cart;

// All ecommerce items
export const selectEcommerceItems = createSelector(
    [selectCartState],
    (cart) => cart.ecommerceCart ?? []
);

// All UH items
export const selectUHItems = createSelector(
    [selectCartState],
    (cart) => cart.uhCart ?? []
);

// Legacy selector: "items" → returns ecommerce cart (backward compat for checkout pages)
export const selectCartItems = selectEcommerceItems;

// Total count: ecommerce cart
export const selectEcommerceTotalItems = createSelector(
    [selectEcommerceItems],
    (items) => items.reduce((acc, i) => acc + (i.quantity || 0), 0)
);

// Total count: UH cart
export const selectUHTotalItems = createSelector(
    [selectUHItems],
    (items) => items.reduce((acc, i) => acc + (i.quantity || 0), 0)
);

// Grand total count (both carts combined — for Navbar badge)
export const selectTotalItems = createSelector(
    [selectEcommerceTotalItems, selectUHTotalItems],
    (ec, uh) => ec + uh
);

// Total price: ecommerce cart
export const selectEcommerceTotalPrice = createSelector(
    [selectEcommerceItems],
    (items) => items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0)
);

// Total price: UH cart
export const selectUHTotalPrice = createSelector(
    [selectUHItems],
    (items) => items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0)
);

// Legacy: total price for ecommerce cart
export const selectTotalPrice = selectEcommerceTotalPrice;

// Cart count (number of unique products, not qty)
export const selectCartCount = createSelector(
    [selectEcommerceItems],
    (items) => items.length
);

export const selectUHCartCount = createSelector(
    [selectUHItems],
    (items) => items.length
);