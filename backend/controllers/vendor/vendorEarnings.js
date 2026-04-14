/**
 * vendorEarnings.js — Production, fixed
 * Fixed: Proper order-based revenue calculation (no commission model)
 */
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Subscription from "../../models/vendorModels/Subscription.js";

// GET /api/vendor/earnings
export const getEarnings = async (req, res) => {
    try {
        const vendorId = req.vendor._id;
        const productIds = await Product.find({ vendorId }).distinct("_id");

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [totals, monthTotals, lastMonthTotals, pendingTotals, recentOrders, subscription] = await Promise.all([
            // All-time delivered
            Order.aggregate([
                { $match: { "items.productId": { $in: productIds }, orderStatus: "DELIVERED" } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } }, count: { $sum: 1 } } },
            ]),
            // This month delivered
            Order.aggregate([
                { $match: { "items.productId": { $in: productIds }, orderStatus: "DELIVERED", createdAt: { $gte: thisMonthStart } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } }, count: { $sum: 1 } } },
            ]),
            // Last month delivered (for growth comparison)
            Order.aggregate([
                { $match: { "items.productId": { $in: productIds }, orderStatus: "DELIVERED", createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } }, count: { $sum: 1 } } },
            ]),
            // Pending orders (placed/confirmed/packed — not yet delivered)
            Order.aggregate([
                { $match: { "items.productId": { $in: productIds }, orderStatus: { $in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$totalAmount", 0] } }, count: { $sum: 1 } } },
            ]),
            // Recent 20 delivered orders as transactions
            Order.find({ "items.productId": { $in: productIds }, orderStatus: "DELIVERED" })
                .sort({ createdAt: -1 })
                .limit(20)
                .select("invoiceNumber totalAmount createdAt payment.method payment.status customerName orderStatus _id")
                .lean(),
            Subscription.findOne({ vendorId }).lean(),
        ]);

        const t = totals[0] || { total: 0, count: 0 };
        const m = monthTotals[0] || { total: 0, count: 0 };
        const lm = lastMonthTotals[0] || { total: 0, count: 0 };
        const p = pendingTotals[0] || { total: 0, count: 0 };

        // Growth percentage vs last month
        const growth = lm.total > 0 ? ((m.total - lm.total) / lm.total) * 100 : m.total > 0 ? 100 : 0;

        res.json({
            success: true,
            earnings: {
                total: t.total,
                thisMonth: m.total,
                lastMonth: lm.total,
                totalOrders: t.count,
                monthOrders: m.count,
                pendingAmount: p.total,
                pendingOrders: p.count,
                growth: Math.round(growth * 10) / 10,
            },
            transactions: recentOrders.map(o => ({
                _id: o._id,
                invoiceNumber: o.invoiceNumber || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
                amount: o.totalAmount || 0,
                date: o.createdAt,
                paymentMethod: o.payment?.method || "COD",
                paymentStatus: o.payment?.status || "PENDING",
                customerName: o.customerName || "Customer",
            })),
            subscription: subscription || null,
        });
    } catch (err) {
        console.error("[getEarnings]", err);
        res.status(500).json({ success: false, message: "Failed to fetch earnings" });
    }
};

// GET /api/vendor/earnings/weekly
export const getWeeklyEarnings = async (req, res) => {
    try {
        const vendorId = req.vendor._id;
        const productIds = await Product.find({ vendorId }).distinct("_id");

        // Last 7 days — single aggregation instead of 7 queries
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyAgg = await Order.aggregate([
            {
                $match: {
                    "items.productId": { $in: productIds },
                    orderStatus: "DELIVERED",
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    orders: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const aggMap = {};
        for (const d of dailyAgg) aggMap[d._id] = d;

        const weekly = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().split("T")[0];
            const match = aggMap[key];
            weekly.push({
                date: key,
                label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
                orders: match?.orders || 0,
                revenue: match?.revenue || 0,
            });
        }

        res.json({ success: true, weekly });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch weekly earnings" });
    }
};

// GET /api/vendor/subscription
export const getSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ vendorId: req.vendor._id }).lean();
        res.json({ success: true, subscription: subscription || null, plans: Subscription.PLANS || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch subscription" });
    }
};
