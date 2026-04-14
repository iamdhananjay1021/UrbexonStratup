import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
    persistReducer,
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import cartReducer from "../features/cart/cartSlice";
import orderReducer from "../features/orders/orderSlice";
import productReducer from "../features/products/productSlice";

// ─── Safe User ID ────────────────────────────────────────
const getUserId = () => {
    try {
        const auth = JSON.parse(localStorage.getItem("auth"));
        return auth?.user?._id || "guest";
    } catch {
        return "guest";
    }
};

// ─── Persist Config ──────────────────────────────────────
const persistConfig = {
    key: `cart_v2_${getUserId()}`,
    storage,
    whitelist: ["cart"], // 🔥 only cart persist (fast)
};

// ─── Root Reducer ───────────────────────────────────────
const rootReducer = combineReducers({
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ─── Store ───────────────────────────────────────────────
export const store = configureStore({
    reducer: persistedReducer,

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),

    devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);