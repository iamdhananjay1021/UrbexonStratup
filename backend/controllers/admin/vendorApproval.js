import Vendor from "../../models/vendorModels/Vendor.js";
import Pincode from "../../models/vendorModels/Pincode.js";

// ══════════════════════════════════════════════════════════════
// ADMIN — Get all vendors
// GET /api/admin/vendors?status=pending&page=1&search=
// ══════════════════════════════════════════════════════════════
export const getAllVendors = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const filter = { isDeleted: false };

        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { shopName: { $regex: search, $options: "i" } },
                { ownerName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Vendor.countDocuments(filter);
        const vendors = await Vendor.find(filter)
            .select("-documents -bankDetails")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            vendors,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("[getAllVendors]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Get single vendor detail
// GET /api/admin/vendors/:id
// ══════════════════════════════════════════════════════════════
export const getVendorDetail = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).populate("userId", "name email");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        res.json({ success: true, vendor });
    } catch (err) {
        console.error("[getVendorDetail]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Approve vendor
// PATCH /api/admin/vendors/:id/approve
// ══════════════════════════════════════════════════════════════
export const approveVendor = async (req, res) => {
    try {
        const { commissionRate, plan, note } = req.body;

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const finalCommission = commissionRate ? Number(commissionRate) : 18;

        vendor.status = "approved";
        vendor.approvedAt = new Date();
        vendor.adminNote = note || "";
        vendor.commissionRate = finalCommission;
        vendor.commissionOverride = !!commissionRate;
        vendor.subscription = {
            plan: plan || "starter",
            isActive: true,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        // Add vendor to their service pincodes
        if (vendor.servicePincodes?.length) {
            await Pincode.updateMany(
                { code: { $in: vendor.servicePincodes } },
                { $addToSet: { assignedVendors: vendor._id } }
            );
        }

        await vendor.save();
        res.json({ success: true, message: "Vendor approved successfully", vendor });
    } catch (err) {
        console.error("[approveVendor]", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Reject vendor
// PATCH /api/admin/vendors/:id/reject
// ══════════════════════════════════════════════════════════════
export const rejectVendor = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: "rejected", rejectionReason: reason },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        res.json({ success: true, message: "Vendor rejected", vendor });
    } catch (err) {
        console.error("[rejectVendor]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Suspend vendor
// PATCH /api/admin/vendors/:id/suspend
// ══════════════════════════════════════════════════════════════
export const suspendVendor = async (req, res) => {
    try {
        const { reason } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: "suspended", adminNote: reason || "" },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Remove from all pincodes
        await Pincode.updateMany(
            { assignedVendors: vendor._id },
            { $pull: { assignedVendors: vendor._id } }
        );

        res.json({ success: true, message: "Vendor suspended", vendor });
    } catch (err) {
        console.error("[suspendVendor]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Update commission manually
// PATCH /api/admin/vendors/:id/commission
// ══════════════════════════════════════════════════════════════
export const updateCommission = async (req, res) => {
    try {
        const { commissionRate } = req.body;
        if (commissionRate === undefined || commissionRate < 0 || commissionRate > 50) {
            return res.status(400).json({ message: "Commission must be between 0–50%" });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { commissionRate: Number(commissionRate), commissionOverride: true },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        res.json({ success: true, message: "Commission updated", commissionRate: vendor.commissionRate });
    } catch (err) {
        console.error("[updateCommission]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Soft delete vendor
// DELETE /api/admin/vendors/:id
// ══════════════════════════════════════════════════════════════
export const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true, status: "suspended" },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Remove from all pincodes
        await Pincode.updateMany(
            { assignedVendors: vendor._id },
            { $pull: { assignedVendors: vendor._id } }
        );

        res.json({ success: true, message: "Vendor deleted successfully" });
    } catch (err) {
        console.error("[deleteVendor]", err);
        res.status(500).json({ message: "Server error" });
    }
};