import { createSlice } from "@reduxjs/toolkit";

// ─── Helpers ─────────────────────────────────────────────
const hasCustomization = (item) =>
    !!(item?.customization?.text ||
        item?.customization?.imageUrl ||
        item?.customization?.note);

const isSameSimpleProduct = (a, b) =>
    a._id === b._id && !hasCustomization(a) && !hasCustomization(b);

// ─── Initial State ───────────────────────────────────────
const initialState = {
    items: [],
};

// ─── Slice ───────────────────────────────────────────────
const cartSlice = createSlice({
    name: "cart",
    initialState,

    reducers: {
        addToCart: (state, { payload }) => {
            // 🔥 Customized item → always new
            if (hasCustomization(payload)) {
                state.items.push({ ...payload, quantity: 1 });
                return;
            }

            // 🔥 Normal item → merge quantity
            const existing = state.items.find((i) =>
                isSameSimpleProduct(i, payload)
            );

            if (existing) {
                existing.quantity++;
            } else {
                state.items.push({ ...payload, quantity: 1 });
            }
        },

        buyNowSingle: (state, { payload }) => {
            state.items = [{ ...payload, quantity: 1 }];
        },

        updateQuantity: (state, { payload }) => {
            const { id, quantity } = payload;

            // 🔥 Guard (performance + safety)
            if (quantity < 1 || quantity > 99) return;

            const item = state.items.find((i) => i._id === id);
            if (item) item.quantity = quantity;
        },

        incQty: (state, { payload }) => {
            const item = state.items.find((i) => i._id === payload);
            if (item && item.quantity < 99) item.quantity++;
        },

        decQty: (state, { payload }) => {
            const item = state.items.find((i) => i._id === payload);
            if (item && item.quantity > 1) item.quantity--;
        },

        removeFromCart: (state, { payload }) => {
            // 🔥 index remove (custom items safe)
            if (typeof payload === "number") {
                state.items.splice(payload, 1);
                return;
            }

            state.items = state.items.filter((i) => i._id !== payload);
        },

        clearCart: (state) => {
            state.items = [];
        },
    },
});

// ─── Exports ─────────────────────────────────────────────
export const {
    addToCart,
    buyNowSingle,
    updateQuantity,
    incQty,
    decQty,
    removeFromCart,
    clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;