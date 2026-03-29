import Pincode from "../../models/vendorModels/Pincode.js";

// ══════════════════════════════════════════════════════════════
// PUBLIC — Check pincode availability
// GET /api/pincode/check/:code
// ══════════════════════════════════════════════════════════════
export const checkPincode = async (req, res) => {
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

        const activeVendors = pincode.assignedVendors.filter((v) => v.isOpen);
        return res.json({
            available: true,
            status: "active",
            area: pincode.area,
            city: pincode.city,
            vendors: activeVendors,
            vendorCount: activeVendors.length,
        });
    } catch (err) {
        console.error("[checkPincode]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// PUBLIC — Join waitlist
// POST /api/pincode/waitlist
// ══════════════════════════════════════════════════════════════
export const joinWaitlist = async (req, res) => {
    try {
        const { code, name, email, phone } = req.body;
        if (!code || !email) return res.status(400).json({ message: "Pincode and email are required" });

        const pincode = await Pincode.findOne({ code });
        if (!pincode) return res.status(404).json({ message: "Pincode not found" });
        if (pincode.status === "active") {
            return res.status(400).json({ message: "Service is already active in your area!" });
        }

        const exists = pincode.waitlist?.find((w) => w.email === email);
        if (exists) return res.status(400).json({ message: "You are already on the waitlist!" });

        pincode.waitlist = pincode.waitlist || [];
        pincode.waitlist.push({ name, email, phone });
        pincode.waitlistCount = (pincode.waitlistCount || 0) + 1;
        await pincode.save();

        res.json({ success: true, message: "You've been added to the waitlist! We'll notify you when we launch." });
    } catch (err) {
        console.error("[joinWaitlist]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Get all pincodes
// GET /api/admin/pincodes?status=active&search=
// ══════════════════════════════════════════════════════════════
export const getAllPincodes = async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { code: { $regex: search } },
                { city: { $regex: search, $options: "i" } },
                { area: { $regex: search, $options: "i" } },
            ];
        }

        const pincodes = await Pincode.find(filter)
            .populate("assignedVendors", "shopName status")
            .sort({ priority: -1, createdAt: -1 });

        res.json({ success: true, pincodes });
    } catch (err) {
        console.error("[getAllPincodes]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Create pincode
// POST /api/admin/pincodes
// ══════════════════════════════════════════════════════════════
export const createPincode = async (req, res) => {
    try {
        const { code, status, area, city, district, state, expectedLaunchDate, note, priority } = req.body;
        if (!code) return res.status(400).json({ message: "Pincode code is required" });

        const existing = await Pincode.findOne({ code });
        if (existing) return res.status(400).json({ message: "Pincode already exists" });

        const pincode = await Pincode.create({
            code, status: status || "coming_soon", area, city, district, state,
            expectedLaunchDate, note, priority: priority || 0,
            isServicable: status === "active",
        });

        res.status(201).json({ success: true, message: "Pincode created", pincode });
    } catch (err) {
        console.error("[createPincode]", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Update pincode
// PUT /api/admin/pincodes/:id
// ══════════════════════════════════════════════════════════════
export const updatePincode = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.status === "active") updates.isServicable = true;
        if (updates.status === "blocked") updates.isServicable = false;

        const pincode = await Pincode.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!pincode) return res.status(404).json({ message: "Pincode not found" });

        res.json({ success: true, message: "Pincode updated", pincode });
    } catch (err) {
        console.error("[updatePincode]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Delete pincode
// DELETE /api/admin/pincodes/:id
// ══════════════════════════════════════════════════════════════
export const deletePincode = async (req, res) => {
    try {
        const pincode = await Pincode.findByIdAndDelete(req.params.id);
        if (!pincode) return res.status(404).json({ message: "Pincode not found" });
        res.json({ success: true, message: "Pincode deleted" });
    } catch (err) {
        console.error("[deletePincode]", err);
        res.status(500).json({ message: "Server error" });
    }
};