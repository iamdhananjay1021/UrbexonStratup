import { useDispatch, useSelector } from "react-redux";
import {
    addToCart,
    buyNowSingle,
    removeFromCart,
    updateQuantity,
    clearCart,
} from "../features/cart/cartSlice";

export const useCart = () => {
    const dispatch = useDispatch();
    const cartItems = useSelector(s => s.cart?.items || []);

    const totalItems = cartItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const totalPrice = cartItems.reduce((s, i) => s + (Number(i.price) * (Number(i.quantity) || 0)), 0);

    return {
        cartItems,
        totalItems,
        totalPrice,
        addItem: (p) => dispatch(addToCart(p)),
        buyNow: (p) => dispatch(buyNowSingle(p)),
        removeItem: (id) => dispatch(removeFromCart(id)),

        updateQty: (id, q) => {
            const quantity = Math.max(1, Number(q));
            dispatch(updateQuantity({ id, quantity }));
        },

        incQty: (id) => {
            const item = cartItems.find(i => i._id === id);
            if (item) dispatch(updateQuantity({ id, quantity: item.quantity + 1 }));
        },

        decQty: (id) => {
            const item = cartItems.find(i => i._id === id);
            if (item && item.quantity > 1) {
                dispatch(updateQuantity({ id, quantity: item.quantity - 1 }));
            }
        },

        clear: () => dispatch(clearCart()),
    };
};