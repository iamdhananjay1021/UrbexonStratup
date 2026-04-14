/**
 * Wishlist.js — User wishlist model
 */
import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
}, { timestamps: true });

wishlistSchema.index({ userId: 1 });

export default mongoose.model("Wishlist", wishlistSchema);
