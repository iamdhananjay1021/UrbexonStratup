// src/features/orders/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const getMyOrders = createAsyncThunk(
    "orders/getMyOrders",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/orders/my");
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch orders"
            );
        }
    }
);

const orderSlice = createSlice({
    name: "orders",
    initialState: {
        orders: [],
        status: "idle",
        error: null,
    },
    reducers: {
        clearOrders: (state) => {
            state.orders = [];
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyOrders.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getMyOrders.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.orders = action.payload;
            })
            .addCase(getMyOrders.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
                state.orders = [];
            });
    },
});

export const { clearOrders } = orderSlice.actions;
export default orderSlice.reducer;