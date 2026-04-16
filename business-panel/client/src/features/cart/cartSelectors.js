import { createSelector } from "@reduxjs/toolkit";

// Base selector — ecommerce cart (primary cart)
const selectCart = (state) => state.cart.ecommerceCart || [];

// 🔥 Memoized selectors (NO re-renders)
export const selectCartItems = selectCart;

export const selectTotalItems = createSelector(
    [selectCart],
    (items) => items.reduce((acc, i) => acc + (i.quantity || 0), 0)
);

export const selectTotalPrice = createSelector(
    [selectCart],
    (items) => items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0)
);

export const selectCartCount = createSelector(
    [selectCart],
    (items) => items.length
);