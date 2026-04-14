/**
 * Payout.js — Unified payout/withdrawal model for vendors + delivery partners
 */
import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
    {
        // ── Recipient ────────────────────────────────────────
        recipientType: {
            type: String,
            enum: ["vendor", "delivery"],
            required: true,
            index: true,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "recipientModel",
            index: true,
        },
        recipientModel: {
            type: String,
            enum: ["Vendor", "DeliveryBoy"],
            required: true,
        },
        recipientName: { type: String, default: "" },

        // ── Amount ───────────────────────────────────────────
        amount: { type: Number, required: true, min: 1 },

        // ── Status ───────────────────────────────────────────
        status: {
            type: String,
            enum: ["requested", "approved", "processing", "completed", "rejected"],
            default: "requested",
            index: true,
        },

        // ── Bank Details (snapshot at request time) ──────────
        bankDetails: {
            accountHolder: { type: String, default: "" },
            accountNumber: { type: String, default: "" },
            ifsc: { type: String, default: "" },
            bankName: { type: String, default: "" },
            upiId: { type: String, default: "" },
        },

        // ── Payment Info ─────────────────────────────────────
        paymentMethod: {
            type: String,
            enum: ["bank_transfer", "upi", null],
            default: null,
        },
        paymentRef: { type: String, default: "" },

        // ── Timestamps ───────────────────────────────────────
        requestedAt: { type: Date, default: Date.now },
        approvedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        rejectedAt: { type: Date, default: null },

        // ── Admin ────────────────────────────────────────────
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        adminNote: { type: String, default: "" },
        rejectionReason: { type: String, default: "" },
    },
    { timestamps: true }
);

payoutSchema.index({ recipientType: 1, recipientId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Payout", payoutSchema);
