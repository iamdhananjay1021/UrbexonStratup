/**
 * useCart.js — Urbexon Dual Cart Hook
 * ─────────────────────────────────────
 * Provides unified interface for both ecommerce + UH carts.
 * Components just call addItem(product) — routing happens automatically.
 */

import { useDispatch, useSelector } from "react-redux";
import {
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
    selectEcommerceItems,
    selectUHItems,
    selectEcommerceTotalItems,
    selectUHTotalItems,
    selectTotalItems,
    selectEcommerceTotalPrice,
    selectUHTotalPrice,
} from "../features/cart/cartSlice";

export const useCart = () => {
    const dispatch = useDispatch();

    const ecommerceItems = useSelector(selectEcommerceItems);
    const uhItems = useSelector(selectUHItems);
    const ecommerceTotalQty = useSelector(selectEcommerceTotalItems);
    const uhTotalQty = useSelector(selectUHTotalItems);
    const totalItems = useSelector(selectTotalItems);
    const ecommerceTotal = useSelector(selectEcommerceTotalPrice);
    const uhTotal = useSelector(selectUHTotalPrice);

    // ── Add to correct cart automatically ─────────────────
    const addItem = (product) => dispatch(addToCart(product));
    const addUHItem = (product) => dispatch(addToUHCart(product));
    const addEcommerceItem = (product) => dispatch(addToEcommerceCart(product));

    // ── Buy now ───────────────────────────────────────────
    const buyNow = (product) => dispatch(buyNowSingle(product));

    // ── Quantity controls ─────────────────────────────────
    const increment = (id, cartType = "ecommerce") => dispatch(incQty({ id, cartType }));
    const decrement = (id, cartType = "ecommerce") => dispatch(decQty({ id, cartType }));
    const setQuantity = (id, quantity, cartType = "ecommerce") =>
        dispatch(updateQuantity({ id, quantity, cartType }));

    // ── Remove ────────────────────────────────────────────
    const removeItem = (id, cartType = "ecommerce") =>
        dispatch(removeFromCart({ id, cartType }));

    // ── Clear ─────────────────────────────────────────────
    const clearEcommerce = () => dispatch(clearEcommerceCart());
    const clearUH = () => dispatch(clearUHCart());
    const clearAll = () => dispatch(clearCart());

    // ── Check if in cart ──────────────────────────────────
    const isInEcommerceCart = (id) => ecommerceItems.some((i) => i._id === id);
    const isInUHCart = (id) => uhItems.some((i) => i._id === id);
    const isInCart = (id) => isInEcommerceCart(id) || isInUHCart(id);

    // ── Legacy aliases (backward compat) ──────────────────
    const cartItems = ecommerceItems;   // pages using cartItems get ecommerce cart
    const cartCount = ecommerceTotalQty;
    const mixTypeError = null;           // no longer applicable
    const clearMixError = () => { };      // no-op

    return {
        // Data
        ecommerceItems,
        uhItems,
        cartItems,          // legacy alias → ecommerceItems
        ecommerceTotalQty,
        uhTotalQty,
        totalItems,         // both carts combined
        cartCount,          // legacy alias → ecommerceTotalQty
        ecommerceTotal,
        uhTotal,

        // Actions
        addItem,            // auto-routes to correct cart
        addUHItem,
        addEcommerceItem,
        buyNow,
        increment,
        decrement,
        setQuantity,
        removeItem,
        clearEcommerce,
        clearUH,
        clearAll,

        // Checks
        isInCart,
        isInEcommerceCart,
        isInUHCart,

        // Legacy
        mixTypeError,
        clearMixError,
    };
};