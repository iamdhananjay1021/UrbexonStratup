import Vendor from "../../models/vendorModels/Vendor.js";
import { Settlement } from "../../models/vendorModels/Settlement.js";

// ══════════════════════════════════════════════════════════════
// VENDOR — Get earnings summary
// GET /api/vendor/earnings
// ══════════════════════════════════════════════════════════════
export const getEarnings = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.vendor._id, isDeleted: false });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const settlements = await Settlement.find({ vendorId: vendor._id })
            .populate("orderId", "orderStatus createdAt totalAmount")
            .sort({ createdAt: -1 })
            .limit(50);

        const totalEarned = settlements
            .filter((s) => s.status === "paid")
            .reduce((sum, s) => sum + s.vendorEarning, 0);

        const pendingAmount = settlements
            .filter((s) => s.status === "pending")
            .reduce((sum, s) => sum + s.vendorEarning, 0);

        res.json({
            success: true,
            totalEarned,
            pendingAmount,
            totalOrders: vendor.totalOrders,
            totalRevenue: vendor.totalRevenue,
            commissionRate: vendor.commissionRate,
            recentSettlements: settlements,
        });
    } catch (err) {
        console.error("[getEarnings]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// VENDOR — Get weekly earnings breakdown
// GET /api/vendor/earnings/weekly
// ══════════════════════════════════════════════════════════════
export const getWeeklyEarnings = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.vendor._id, isDeleted: false });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const settlements = await Settlement.find({
            vendorId: vendor._id,
            createdAt: { $gte: sevenDaysAgo },
        })
            .populate("orderId", "orderStatus createdAt totalAmount")
            .sort({ createdAt: -1 });

        const weeklyTotal = settlements.reduce((sum, s) => sum + s.vendorEarning, 0);

        // Group by day
        const dailyBreakdown = {};
        settlements.forEach((s) => {
            const day = new Date(s.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
            if (!dailyBreakdown[day]) dailyBreakdown[day] = 0;
            dailyBreakdown[day] += s.vendorEarning;
        });

        res.json({
            success: true,
            weeklyTotal,
            dailyBreakdown,
            settlements,
        });
    } catch (err) {
        console.error("[getWeeklyEarnings]", err);
        res.status(500).json({ message: "Server error" });
    }
};