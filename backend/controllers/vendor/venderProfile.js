import Vendor from "../../models/vendorModels/Vendor.js";
import { uploadToCloudinary, uploadBanner } from "../../config/cloudinary.js";

// ══════════════════════════════════════════════════════════════
// VENDOR — Get own profile
// GET /api/vendor/me
// ══════════════════════════════════════════════════════════════
export const getMyProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.vendor._id, isDeleted: false });
        if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
        res.json({ success: true, vendor });
    } catch (err) {
        console.error("[getMyProfile]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Update profile
// PUT /api/vendor/me
// ══════════════════════════════════════════════════════════════
export const updateMyProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.vendor._id, isDeleted: false });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        if (vendor.status !== "approved") {
            return res.status(403).json({ message: "Only approved vendors can update their profile" });
        }

        const allowedFields = [
            "shopDescription", "shopCategory", "whatsapp", "alternatePhone",
            "deliveryMode", "deliveryChargePerKm", "freeDeliveryAbove",
            "isOpen", "acceptingOrders", "minOrderAmount", "maxOrderAmount",
            "preparationTime",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                vendor[field] = req.body[field];
            }
        });

        // Parse JSON string fields
        const jsonFields = ["address", "servicePincodes", "bankDetails"];
        jsonFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                vendor[field] = typeof req.body[field] === "string"
                    ? JSON.parse(req.body[field])
                    : req.body[field];
            }
        });

        // Handle logo update
        if (req.files?.shopLogo?.[0]) {
            vendor.shopLogo = await uploadToCloudinary(
                req.files.shopLogo[0].buffer, "logos",
                { width: 400, height: 400, crop: "fill" }
            );
        }

        // Handle banner update
        if (req.files?.shopBanner?.[0]) {
            vendor.shopBanner = await uploadBanner(req.files);
        }

        await vendor.save();
        res.json({ success: true, message: "Profile updated successfully", vendor });
    } catch (err) {
        console.error("[updateMyProfile]", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Toggle shop open/closed
// PATCH /api/vendor/toggle-shop
// ══════════════════════════════════════════════════════════════
export const toggleShopOpen = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.vendor._id, isDeleted: false });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        vendor.isOpen = !vendor.isOpen;
        await vendor.save();

        res.json({
            success: true,
            message: `Shop is now ${vendor.isOpen ? "OPEN" : "CLOSED"}`,
            isOpen: vendor.isOpen,
        });
    } catch (err) {
        console.error("[toggleShopOpen]", err);
        res.status(500).json({ message: "Server error" });
    }
};