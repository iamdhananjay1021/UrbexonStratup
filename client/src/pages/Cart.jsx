import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    selectCartItems,
    selectTotalItems,
    selectTotalPrice,
} from "../features/cart/cartSelectors";

import {
    incQty,
    decQty,
    removeFromCart,
    clearCart,
} from "../features/cart/cartSlice";

import { useMemo, useCallback } from "react";
import { FaTrash } from "react-icons/fa";

// ─── Constants ─────────────────────
const PLATFORM_FEE = 9;
const DELIVERY_CHARGE = 49;
const FREE_DELIVERY = 499;

const Cart = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 🔥 Selectors (optimized)
    const cartItems = useSelector(selectCartItems);
    const totalItems = useSelector(selectTotalItems);
    const totalPrice = useSelector(selectTotalPrice);

    // 🔥 Calculations
    const delivery = useMemo(
        () => (totalPrice >= FREE_DELIVERY ? 0 : DELIVERY_CHARGE),
        [totalPrice]
    );

    const grandTotal = useMemo(
        () => totalPrice + delivery + PLATFORM_FEE,
        [totalPrice, delivery]
    );

    // 🔥 Handlers
    const handleInc = useCallback((id) => dispatch(incQty(id)), [dispatch]);
    const handleDec = useCallback((id) => dispatch(decQty(id)), [dispatch]);
    const handleRemove = useCallback((id) => dispatch(removeFromCart(id)), [dispatch]);
    const handleClear = useCallback(() => dispatch(clearCart()), [dispatch]);
    const handleCheckout = useCallback(() => navigate("/checkout"), [navigate]);

    // ─── Empty State ─────────────────
    if (!cartItems.length) {
        return (
            <div className="h-screen flex items-center justify-center">
                <h1 className="text-gray-500 text-lg">Your cart is empty</h1>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-semibold">
                    SHOPPING CART ({totalItems})
                </h2>

                <button
                    onClick={handleClear}
                    className="text-sm text-red-500 hover:underline"
                >
                    Clear Cart
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">

                {/* LEFT: Items */}
                <div className="flex-1">

                    {cartItems.map((item, index) => {
                        const imageUrl =
                            item?.images?.[0]?.url ||
                            item?.image ||
                            "https://via.placeholder.com/100";

                        return (
                            <div
                                key={`${item._id}-${index}`}
                                className="flex items-center gap-5 border-b py-5"
                            >
                                {/* Image */}
                                <Link to={`/product/${item._id}`}>
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-20 h-24 object-cover hover:scale-105 transition"
                                    />
                                </Link>

                                {/* Info */}
                                <div className="flex-1">
                                    <Link to={`/product/${item._id}`}>
                                        <h3 className="text-sm font-medium text-gray-800 hover:text-indigo-600">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    <p className="text-xs text-gray-500 mt-1">
                                        ₹{item.price.toLocaleString("en-IN")}
                                    </p>

                                    {item.selectedSize && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Size: {item.selectedSize}
                                        </p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="flex items-center gap-2 border px-2 py-1 text-sm">
                                    <button onClick={() => handleDec(item._id)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => handleInc(item._id)}>+</button>
                                </div>

                                {/* Price */}
                                <p className="w-20 text-right font-semibold">
                                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                </p>

                                {/* Remove */}
                                <button
                                    onClick={() => handleRemove(item._id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT: Summary */}
                <div className="w-full lg:w-[300px]">

                    <div className="border p-5 rounded-md">

                        <div className="flex justify-between text-sm mb-3">
                            <span>Total MRP</span>
                            <span>₹{totalPrice}</span>
                        </div>

                        <div className="flex justify-between text-sm mb-3 text-red-500">
                            <span>Discount</span>
                            <span>- ₹0</span>
                        </div>

                        <div className="flex justify-between font-semibold border-t pt-3">
                            <span>Total Amount</span>
                            <span>₹{grandTotal}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full mt-5 bg-[#2d3a8c] text-white py-3 text-sm font-semibold"
                    >
                        CHECKOUT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;