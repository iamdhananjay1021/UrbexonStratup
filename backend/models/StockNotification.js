/**
 * StockNotification.js — Back-in-Stock alert subscriptions
 * Users subscribe with email + productId. When product restocks,
 * emails are sent and subscriptions marked as notified.
 */
import mongoose from "mongoose";

const stockNotificationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    notified: {
        type: Boolean,
        default: false,
        index: true,
    },
    notifiedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// One email per product (prevent duplicates)
stockNotificationSchema.index({ productId: 1, email: 1 }, { unique: true });

// TTL: auto-delete notified entries after 30 days
stockNotificationSchema.index({ notifiedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("StockNotification", stockNotificationSchema);
