/**
 * wishlistController.js
 */
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// GET /api/wishlist
export const getWishlist = async (req, res) => {
    try {
        const wl = await Wishlist.findOne({ userId: req.user._id })
            .populate("products", "name price mrp images isActive inStock productType slug")
            .lean();
        const products = (wl?.products || []).filter(p => p?.isActive);
        res.json({ products, count: products.length });
    } catch (err) {
        console.error("[getWishlist]", err);
        res.status(500).json({ success: false,  message: "Failed to fetch wishlist" });
    }
};

// POST /api/wishlist/:productId
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).select("_id isActive").lean();
        if (!product || !product.isActive)
            return res.status(404).json({ success: false,  message: "Product not found" });

        const wl = await Wishlist.findOneAndUpdate(
            { userId: req.user._id },
            { $addToSet: { products: productId } },
            { upsert: true, new: true }
        );
        res.json({ success: true, count: wl.products.length });
    } catch (err) {
        console.error("[addToWishlist]", err);
        res.status(500).json({ success: false,  message: "Failed to add to wishlist" });
    }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const wl = await Wishlist.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { products: productId } },
            { new: true }
        );
        res.json({ success: true, count: wl?.products?.length || 0 });
    } catch (err) {
        console.error("[removeFromWishlist]", err);
        res.status(500).json({ success: false,  message: "Failed to remove from wishlist" });
    }
};

// DELETE /api/wishlist
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { products: [] } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false,  message: "Failed to clear wishlist" });
    }
};

// GET /api/wishlist/check/:productId
export const checkWishlist = async (req, res) => {
    try {
        const wl = await Wishlist.findOne({
            userId: req.user._id,
            products: req.params.productId,
        }).lean();
        res.json({ inWishlist: !!wl });
    } catch (err) {
        res.status(500).json({ success: false,  message: "Failed" });
    }
};
