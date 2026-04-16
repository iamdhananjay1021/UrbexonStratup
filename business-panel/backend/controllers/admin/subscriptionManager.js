/**
 * subscriptionManager.js - Admin subscription management
 */
import Subscription from "../../models/vendorModels/Subscription.js";
import Vendor from "../../models/vendorModels/Vendor.js";

const PLAN_CONFIG = {
    basic:    { monthlyFee: 499,  maxProducts: 30  },
    standard: { monthlyFee: 999,  maxProducts: 100 },
    premium:  { monthlyFee: 1999, maxProducts: 500 },
};

// GET /api/admin/subscriptions
export const getAllSubscriptions = async (req, res) => {
    try {
        const subs = await Subscription.find()
            .populate("vendorId", "shopName ownerName email")
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, subscriptions: subs });
    } catch (err) {
        res.status(500).json({ success: false,  message: "Failed" });
    }
};

// POST /api/admin/subscriptions/activate
export const activateSubscription = async (req, res) => {
    try {
        const { vendorId, plan, months = 1 } = req.body;
        if (!PLAN_CONFIG[plan]) return res.status(400).json({ success: false,  message: "Invalid plan" });

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return res.status(404).json({ success: false,  message: "Vendor not found" });

        const now    = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + Number(months));

        const sub = await Subscription.findOneAndUpdate(
            { vendorId },
            {
                vendorId,
                plan,
                monthlyFee:  PLAN_CONFIG[plan].monthlyFee,
                maxProducts: PLAN_CONFIG[plan].maxProducts,
                status:      "active",
                startDate:   now,
                expiryDate:  expiry,
                nextDueDate: expiry,
                lastPaymentDate: now,
                $push: {
                    payments: {
                        amount:    PLAN_CONFIG[plan].monthlyFee * months,
                        method:    "manual",
                        months:    Number(months),
                        date:      now,
                        reference: `ADMIN-${Date.now()}`,
                    },
                },
            },
            { upsert: true, new: true }
        );

        vendor.subscription = { plan, status: "active", expiryDate: expiry };
        await vendor.save();

        res.json({ success: true, subscription: sub });
    } catch (err) {
        console.error("[activateSubscription]", err);
        res.status(500).json({ success: false,  message: "Failed" });
    }
};

// PATCH /api/admin/subscriptions/:id/expire
export const expireSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findByIdAndUpdate(
            req.params.id,
            { status: "expired" },
            { new: true }
        );
        if (!sub) return res.status(404).json({ success: false,  message: "Not found" });
        res.json({ success: true, subscription: sub });
    } catch (err) {
        res.status(500).json({ success: false,  message: "Failed" });
    }
};
