/**
 * Product.js
 * ─────────────────────────────────────────────────────────
 * ✅ All indexes added for fast queries
 * ✅ isDeal + dealEndsAt compound index
 * ✅ inStock index
 * ✅ price index for sort
 * ✅ rating index for sort
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 5000,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        mrp: {
            type: Number,
            default: null,
            min: 0,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            sparse: true,
        },
        category: {
            type: String,
            required: true,
        },
        images: {
            type: [{
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            }],
            validate: (v) => v.length > 0,
        },
        tags: { type: [String], default: [] },
        sizes: { type: [String], default: [] },
        highlights: { type: Map, of: String, default: {} },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        numReviews: { type: Number, default: 0 },
        isCustomizable: { type: Boolean, default: false },
        stock: { type: Number, default: 0, min: 0 },
        inStock: { type: Boolean, default: true },

        /* ── Deals ── */
        isDeal: { type: Boolean, default: false },
        dealEndsAt: { type: Date },
        dealTag: { type: String },

        /* ── Shipping ── */
        weight: {
            type: Number,
            default: 500,
            min: [1, "Weight must be at least 1g"],
            max: [30000, "Weight cannot exceed 30kg"],
        },
        dimensions: {
            length: { type: Number, default: 10 },
            breadth: { type: Number, default: 10 },
            height: { type: Number, default: 10 },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* ══════════════════════════════════════════════════════
   INDEXES
   — text search on name, description, tags
   — compound: category + inStock + createdAt (main listing query)
   — compound: isDeal + dealEndsAt (deals page query)
   — sort indexes: price, rating
══════════════════════════════════════════════════════ */
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, inStock: 1, createdAt: -1 }); // category listing
productSchema.index({ inStock: 1, createdAt: -1 });               // all products listing
productSchema.index({ isDeal: 1, dealEndsAt: 1, inStock: 1 });   // deals query
productSchema.index({ price: 1 });                                // price sort
productSchema.index({ rating: -1 });                              // rating sort
productSchema.index({ createdAt: -1 });                           // newest sort

/* ══════════════════════════════════════════════════════
   AUTO SLUG
   Uses _id suffix for instant uniqueness — no DB loop
══════════════════════════════════════════════════════ */
productSchema.pre("save", function () {
    if (!this.isModified("name") && this.slug) return;

    const base = slugify(this.name, { lower: true, strict: true })
        .split("-").slice(0, 8).join("-");

    if (!this.slug || this.isModified("name")) {
        this.slug = this.isNew
            ? `${base}-${this._id.toString().slice(-5)}`
            : base;
    }
});

/* ══════════════════════════════════════════════════════
   VIRTUAL — discount percent
══════════════════════════════════════════════════════ */
productSchema.virtual("discountPercent").get(function () {
    if (this.mrp && this.mrp > this.price)
        return Math.round(((this.mrp - this.price) / this.mrp) * 100);
    return null;
});

export default mongoose.model("Product", productSchema);