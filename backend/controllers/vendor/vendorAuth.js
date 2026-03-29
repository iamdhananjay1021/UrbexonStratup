import Vendor from "../../models/vendorModels/Vendor.js";
import Pincode from "../../models/vendorModels/Pincode.js";
import { uploadDocuments, uploadLogo } from "../../config/cloudinary.js";

// ══════════════════════════════════════════════════════════════
// VENDOR — Register / Apply
// POST /api/vendor/register
// ══════════════════════════════════════════════════════════════
export const registerVendor = async (req, res) => {
    try {
        const userId = req.user._id;

        const existing = await Vendor.findOne({ userId, isDeleted: false });
        if (existing) {
            return res.status(409).json({
                message: "You have already applied as a vendor.",
                status: existing.status,
                vendorId: existing._id,
            });
        }

        const {
            shopName, shopDescription, shopCategory,
            ownerName, email, phone, whatsapp,
            alternatePhone, gstNumber, panNumber,
            businessType, deliveryMode,
        } = req.body;

        const address = req.body.address
            ? typeof req.body.address === "string" ? JSON.parse(req.body.address) : req.body.address
            : {};

        const servicePincodes = req.body.servicePincodes
            ? typeof req.body.servicePincodes === "string" ? JSON.parse(req.body.servicePincodes) : req.body.servicePincodes
            : [];

        const bankDetails = req.body.bankDetails
            ? typeof req.body.bankDetails === "string" ? JSON.parse(req.body.bankDetails) : req.body.bankDetails
            : {};

        if (!shopName || !ownerName || !phone || !email) {
            return res.status(400).json({ message: "shopName, ownerName, phone and email are required." });
        }

        if (servicePincodes.length > 0) {
            const validPincodes = await Pincode.find({
                code: { $in: servicePincodes },
                status: { $in: ["active", "coming_soon"] },
            }).select("code");
            const validCodes = validPincodes.map((p) => p.code);
            const invalidCodes = servicePincodes.filter((c) => !validCodes.includes(c));
            if (invalidCodes.length > 0) {
                return res.status(400).json({
                    message: `These pincodes are not serviceable: ${invalidCodes.join(", ")}`,
                });
            }
        }

        const [documents, shopLogo] = await Promise.all([
            uploadDocuments(req.files),
            uploadLogo(req.files),
        ]);

        const vendor = await Vendor.create({
            userId, shopName, shopDescription, shopCategory, shopLogo,
            ownerName, email, phone, whatsapp: whatsapp || phone,
            alternatePhone, gstNumber, panNumber, businessType,
            address, servicePincodes, deliveryMode, bankDetails,
            documents, status: "pending",
        });

        res.status(201).json({
            success: true,
            message: "Application submitted! We'll review and respond within 24–48 hours.",
            vendorId: vendor._id,
            status: vendor.status,
        });
    } catch (err) {
        console.error("[registerVendor]", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Get application status
// GET /api/vendor/status
// ══════════════════════════════════════════════════════════════
export const getVendorStatus = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({
            userId: req.user._id,
            isDeleted: false,
        }).select("status rejectionReason subscription shopName shopLogo createdAt");

        if (!vendor) {
            return res.status(404).json({ message: "No vendor application found.", applied: false });
        }

        res.json({
            applied: true,
            status: vendor.status,
            shopName: vendor.shopName,
            shopLogo: vendor.shopLogo,
            rejectionReason: vendor.rejectionReason,
            subscription: vendor.subscription,
            appliedAt: vendor.createdAt,
        });
    } catch (err) {
        console.error("[getVendorStatus]", err);
        res.status(500).json({ message: "Server error" });
    }
};