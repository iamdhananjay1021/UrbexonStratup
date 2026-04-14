/**
 * vendorPublic.js — Public vendor endpoints
 * GET /vendor/featured?limit=N → top-rated approved vendors
 * GET /vendor/store/:slug       → vendor store page (profile + products)
 */
import Vendor from "../../models/vendorModels/Vendor.js";
import Product from "../../models/Product.js";

export const getVendorStore = async (req, res) => {
    try {
        const { slug } = req.params;

        const vendor = await Vendor.findOne({
            $or: [{ shopSlug: slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : undefined }],
            status: "approved",
            isDeleted: false,
        })
            .select("shopName shopLogo shopBanner shopSlug shopCategory shopDescription rating ratingCount totalOrders isOpen address.city address.state createdAt")
            .lean();

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }

        const products = await Product.find({
            vendorId: vendor._id,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .select("name slug images price mrp rating numReviews stock inStock category")
            .lean();

        res.json({ success: true, vendor, products });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch vendor store" });
    }
};

export const getFeaturedVendors = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 8, 1), 20);

        const vendors = await Vendor.find({
            status: "approved",
            isDeleted: false,
            isOpen: true,
        })
            .sort({ rating: -1, totalOrders: -1, createdAt: -1 })
            .limit(limit)
            .select("shopName shopLogo shopSlug shopCategory rating ratingCount totalOrders totalRevenue")
            .lean();

        res.json({ success: true, vendors });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch featured vendors" });
    }
};
