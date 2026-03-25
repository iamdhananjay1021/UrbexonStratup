import { createSelector } from "@reduxjs/toolkit";

// Base selector
const selectCart = (state) => state.cart.items;

// 🔥 Memoized selectors (NO re-renders)
export const selectCartItems = selectCart;

export const selectTotalItems = createSelector(
    [selectCart],
    (items) => items.reduce((acc, i) => acc + i.quantity, 0)
);

export const selectTotalPrice = createSelector(
    [selectCart],
    (items) => items.reduce((acc, i) => acc + i.price * i.quantity, 0)
);

export const selectCartCount = createSelector(
    [selectCart],
    (items) => items.length
);