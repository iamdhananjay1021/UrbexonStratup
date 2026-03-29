import Vendor from "../../models/vendorModels/Vendor.js";
import Pincode from "../../models/vendorModels/Pincode.js";

const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ── Cloudinary upload helper ──────────────────────────────────
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `urbexon/vendors/${folder}`, resource_type: "auto" },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// ══════════════════════════════════════════════════════════════
// PUBLIC — Check if vendor/service available at pincode
// GET /api/pincode/check/:code
// ══════════════════════════════════════════════════════════════
exports.checkPincode = async (req, res) => {
    try {
        const { code } = req.params;
        const pincode = await Pincode.findOne({ code })
            .populate("assignedVendors", "shopName shopLogo rating isOpen acceptingOrders");

        if (!pincode) {
            return res.json({
                available: false,
                status: "not_found",
                message: "We don't have data for this pincode yet.",
            });
        }

        if (pincode.status === "blocked") {
            return res.json({
                available: false,
                status: "blocked",
                message: "Service not available in your area.",
            });
        }

        if (pincode.status === "coming_soon") {
            return res.json({
                available: false,
                status: "coming_soon",
                message: "We're coming to your area soon!",
                expectedLaunchDate: pincode.expectedLaunchDate,
                waitlistCount: pincode.waitlistCount,
            });
        }

        // Active pincode
        const activeVendors = pincode.assignedVendors.filter(v => v.isOpen);
        return res.json({
            available: true,
            status: "active",
            area: pincode.area,
            city: pincode.city,
            vendors: activeVendors,
            vendorCount: activeVendors.length,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// PUBLIC — Join waitlist for coming_soon pincode
// POST /api/pincode/waitlist
// ══════════════════════════════════════════════════════════════
exports.joinWaitlist = async (req, res) => {
    try {
        const { code, name, email, phone } = req.body;
        if (!code || !email) return res.status(400).json({ message: "Pincode and email required" });

        const pincode = await Pincode.findOne({ code });
        if (!pincode) return res.status(404).json({ message: "Pincode not found" });
        if (pincode.status === "active") return res.status(400).json({ message: "Service already active in your area!" });

        // Check duplicate
        const exists = pincode.waitlist.find(w => w.email === email);
        if (exists) return res.status(400).json({ message: "You are already on the waitlist!" });

        pincode.waitlist.push({ name, email, phone });
        pincode.waitlistCount += 1;
        await pincode.save();

        res.json({ message: "You've been added to the waitlist! We'll notify you when we launch." });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Register / Apply
// POST /api/vendor/register
// ══════════════════════════════════════════════════════════════
exports.registerVendor = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check if already applied
        const existing = await Vendor.findOne({ userId });
        if (existing) {
            return res.status(400).json({
                message: "You have already applied.",
                status: existing.status,
            });
        }

        const {
            shopName, shopDescription, shopCategory,
            ownerName, email, phone, whatsapp,
            gstNumber, panNumber, businessType,
            address, servicePincodes, deliveryMode,
            bankDetails,
        } = req.body;

        // Validate required
        if (!shopName || !ownerName || !phone || !email) {
            return res.status(400).json({ message: "shopName, ownerName, phone, email are required" });
        }

        // Upload documents if provided
        const documents = {};
        const docFields = ["shopPhoto", "ownerPhoto", "gstCertificate", "panCard", "cancelledCheque", "addressProof"];
        for (const field of docFields) {
            if (req.files?.[field]?.[0]) {
                documents[field] = await uploadToCloudinary(req.files[field][0].buffer, "documents");
            }
        }

        // Upload logo if provided
        let shopLogo;
        if (req.files?.shopLogo?.[0]) {
            shopLogo = await uploadToCloudinary(req.files.shopLogo[0].buffer, "logos");
        }

        const vendor = await Vendor.create({
            userId,
            shopName,
            shopDescription,
            shopCategory,
            shopLogo,
            ownerName,
            email,
            phone,
            whatsapp: whatsapp || phone,
            gstNumber,
            panNumber,
            businessType,
            address: typeof address === "string" ? JSON.parse(address) : address,
            servicePincodes: typeof servicePincodes === "string" ? JSON.parse(servicePincodes) : servicePincodes || [],
            deliveryMode,
            bankDetails: typeof bankDetails === "string" ? JSON.parse(bankDetails) : bankDetails,
            documents,
            status: "pending",
        });

        res.status(201).json({
            message: "Application submitted! We'll review and get back to you within 24–48 hours.",
            vendorId: vendor._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Get own profile
// GET /api/vendor/me
// ══════════════════════════════════════════════════════════════
exports.getMyVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
        res.json(vendor);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Update profile / settings
// PUT /api/vendor/me
// ══════════════════════════════════════════════════════════════
exports.updateVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) return res.status(404).json({ message: "Not found" });
        if (vendor.status !== "approved") return res.status(403).json({ message: "Only approved vendors can update profile" });

        const allowed = [
            "shopDescription", "shopCategory", "whatsapp", "alternatePhone",
            "address", "servicePincodes", "deliveryMode", "deliveryChargePerKm",
            "freeDeliveryAbove", "isOpen", "acceptingOrders", "minOrderAmount",
            "maxOrderAmount", "preparationTime", "bankDetails",
        ];

        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                vendor[field] = typeof req.body[field] === "string" && field !== "shopDescription"
                    ? JSON.parse(req.body[field])
                    : req.body[field];
            }
        });

        // Handle logo/banner update
        if (req.files?.shopLogo?.[0]) {
            vendor.shopLogo = await uploadToCloudinary(req.files.shopLogo[0].buffer, "logos");
        }
        if (req.files?.shopBanner?.[0]) {
            vendor.shopBanner = await uploadToCloudinary(req.files.shopBanner[0].buffer, "banners");
        }

        await vendor.save();
        res.json({ message: "Profile updated", vendor });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Get earnings summary
// GET /api/vendor/earnings
// ══════════════════════════════════════════════════════════════
exports.getVendorEarnings = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user._id });
        if (!vendor) return res.status(404).json({ message: "Not found" });

        const settlements = await Settlement.find({ vendorId: vendor._id })
            .populate("orderId", "orderStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(50);

        const totalEarned = settlements
            .filter(s => s.status === "paid")
            .reduce((sum, s) => sum + s.vendorEarning, 0);

        const pendingAmount = settlements
            .filter(s => s.status === "pending")
            .reduce((sum, s) => sum + s.vendorEarning, 0);

        res.json({
            totalEarned,
            pendingAmount,
            totalOrders: vendor.totalOrders,
            totalRevenue: vendor.totalRevenue,
            commissionRate: vendor.commissionRate,
            recentSettlements: settlements,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Get all vendors
// GET /api/admin/vendors?status=pending&page=1
// ══════════════════════════════════════════════════════════════
exports.adminGetAllVendors = async (req, res) => {
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

        res.json({ vendors, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Get single vendor detail
// GET /api/admin/vendors/:id
// ══════════════════════════════════════════════════════════════
exports.adminGetVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).populate("userId", "name email");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        res.json(vendor);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Approve vendor
// PATCH /api/admin/vendors/:id/approve
// ══════════════════════════════════════════════════════════════
exports.adminApproveVendor = async (req, res) => {
    try {
        const { commissionRate, plan, note } = req.body;
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: "Not found" });

        // Get plan commission rate if not overriding
        let finalCommission = commissionRate;
        if (!commissionRate) {
            const planDoc = await SubscriptionPlan.findOne({ name: plan || "starter" });
            finalCommission = planDoc?.commissionRate || 18;
        }

        vendor.status = "approved";
        vendor.approvedAt = new Date();
        vendor.approvedBy = req.admin._id;
        vendor.adminNote = note;
        vendor.commissionRate = Number(finalCommission);
        vendor.commissionOverride = !!commissionRate;
        vendor.subscription.plan = plan || "starter";
        vendor.subscription.isActive = true;
        vendor.subscription.startDate = new Date();
        vendor.subscription.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial

        // Add vendor to their service pincodes
        if (vendor.servicePincodes?.length) {
            await Pincode.updateMany(
                { code: { $in: vendor.servicePincodes } },
                { $addToSet: { assignedVendors: vendor._id } }
            );
        }

        await vendor.save();
        res.json({ message: "Vendor approved successfully", vendor });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Reject vendor
// PATCH /api/admin/vendors/:id/reject
// ══════════════════════════════════════════════════════════════
exports.adminRejectVendor = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: "Rejection reason required" });

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: "rejected", rejectionReason: reason },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Not found" });

        res.json({ message: "Vendor rejected", vendor });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Suspend vendor
// PATCH /api/admin/vendors/:id/suspend
// ══════════════════════════════════════════════════════════════
exports.adminSuspendVendor = async (req, res) => {
    try {
        const { reason } = req.body;
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: "suspended", adminNote: reason },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Not found" });

        // Remove from pincodes
        await Pincode.updateMany(
            { assignedVendors: vendor._id },
            { $pull: { assignedVendors: vendor._id } }
        );

        res.json({ message: "Vendor suspended", vendor });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Update vendor commission manually
// PATCH /api/admin/vendors/:id/commission
// ══════════════════════════════════════════════════════════════
exports.adminUpdateCommission = async (req, res) => {
    try {
        const { commissionRate } = req.body;
        if (!commissionRate || commissionRate < 0 || commissionRate > 50) {
            return res.status(400).json({ message: "Commission must be between 0–50%" });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { commissionRate: Number(commissionRate), commissionOverride: true },
            { new: true }
        );
        if (!vendor) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Commission updated", commissionRate: vendor.commissionRate });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Pincode CRUD
// ══════════════════════════════════════════════════════════════
exports.adminGetPincodes = async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) filter.$or = [
            { code: { $regex: search } },
            { city: { $regex: search, $options: "i" } },
            { area: { $regex: search, $options: "i" } },
        ];

        const pincodes = await Pincode.find(filter)
            .populate("assignedVendors", "shopName status")
            .sort({ priority: -1, createdAt: -1 });

        res.json(pincodes);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.adminCreatePincode = async (req, res) => {
    try {
        const { code, status, area, city, district, state, expectedLaunchDate, note, priority } = req.body;
        if (!code) return res.status(400).json({ message: "Pincode code required" });

        const existing = await Pincode.findOne({ code });
        if (existing) return res.status(400).json({ message: "Pincode already exists" });

        const pincode = await Pincode.create({
            code, status, area, city, district, state,
            expectedLaunchDate, note, priority,
            isServicable: status === "active",
        });

        res.status(201).json({ message: "Pincode created", pincode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.adminUpdatePincode = async (req, res) => {
    try {
        const updates = req.body;
        if (updates.status === "active") updates.isServicable = true;
        if (updates.status === "blocked") updates.isServicable = false;

        const pincode = await Pincode.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!pincode) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Pincode updated", pincode });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.adminDeletePincode = async (req, res) => {
    try {
        await Pincode.findByIdAndDelete(req.params.id);
        res.json({ message: "Pincode deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Settlement: process weekly batch
// POST /api/admin/settlements/process
// ══════════════════════════════════════════════════════════════
exports.adminProcessSettlements = async (req, res) => {
    try {
        const batchId = `BATCH-${Date.now()}`;
        const pending = await Settlement.find({ status: "pending" });

        if (!pending.length) return res.json({ message: "No pending settlements", count: 0 });

        // Group by vendor
        const vendorMap = {};
        pending.forEach(s => {
            const vid = s.vendorId.toString();
            if (!vendorMap[vid]) vendorMap[vid] = { total: 0, ids: [] };
            vendorMap[vid].total += s.vendorEarning;
            vendorMap[vid].ids.push(s._id);
        });

        // Mark as processing + set batch
        await Settlement.updateMany(
            { _id: { $in: pending.map(s => s._id) } },
            { status: "processing", batchId, settlementDate: new Date() }
        );

        res.json({
            message: "Settlement batch created",
            batchId,
            totalVendors: Object.keys(vendorMap).length,
            totalSettlements: pending.length,
            vendorSummary: Object.entries(vendorMap).map(([vendorId, data]) => ({
                vendorId,
                amount: data.total,
                count: data.ids.length,
            })),
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Get all settlements
// GET /api/admin/settlements?status=pending&vendorId=xxx
// ══════════════════════════════════════════════════════════════
exports.adminGetSettlements = async (req, res) => {
    try {
        const { status, vendorId, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (vendorId) filter.vendorId = vendorId;

        const total = await Settlement.countDocuments(filter);
        const settlements = await Settlement.find(filter)
            .populate("vendorId", "shopName ownerName bankDetails")
            .populate("orderId", "orderStatus totalAmount")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ settlements, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Mark settlement as paid
// PATCH /api/admin/settlements/:id/paid
// ══════════════════════════════════════════════════════════════
exports.adminMarkSettlementPaid = async (req, res) => {
    try {
        const { paymentRef, paymentMethod } = req.body;
        const settlement = await Settlement.findByIdAndUpdate(
            req.params.id,
            { status: "paid", paymentRef, paymentMethod, settlementDate: new Date() },
            { new: true }
        );
        if (!settlement) return res.status(404).json({ message: "Not found" });

        // Update vendor pending settlement
        await Vendor.findByIdAndUpdate(settlement.vendorId, {
            $inc: { pendingSettlement: -settlement.vendorEarning, totalEarnings: settlement.vendorEarning }
        });

        res.json({ message: "Settlement marked as paid", settlement });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
