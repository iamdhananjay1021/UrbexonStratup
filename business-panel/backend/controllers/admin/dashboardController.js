/**
 * dashboardController.js — Admin Analytics v2.0
 * ✅ Single optimized endpoint for all dashboard stats
 * ✅ Revenue growth calculation
 * ✅ Order status breakdown
 * ✅ Recent 30-day revenue chart
 */
import Order   from "../../models/Order.js";
import Product from "../../models/Product.js";
import User    from "../../models/User.js";
import Vendor  from "../../models/vendorModels/Vendor.js";

export const getDashboardStats = async (req, res) => {
    try {
        const now           = new Date();
        const startOfToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrev   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrev     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const last30        = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalOrders, todayOrders, monthOrders, prevMonthOrders,
            revenueAgg, todayRevAgg, monthRevAgg, prevMonthRevAgg,
            totalUsers, newUsersToday, newUsersMonth,
            totalProducts, activeProducts, outOfStock,
            pendingVendors, activeVendors,
            pendingRefunds, openReturns,
            recentOrders,
            ordersByStatus,
            revenueByDay,
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfToday } }),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.countDocuments({ createdAt: { $gte: startOfPrev, $lte: endOfPrev } }),

            Order.aggregate([{ $match: { "payment.status": "PAID" } },           { $group: { _id: null, t: { $sum: "$totalAmount" } } }]),
            Order.aggregate([{ $match: { "payment.status": "PAID", createdAt: { $gte: startOfToday } } }, { $group: { _id: null, t: { $sum: "$totalAmount" } } }]),
            Order.aggregate([{ $match: { "payment.status": "PAID", createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, t: { $sum: "$totalAmount" } } }]),
            Order.aggregate([{ $match: { "payment.status": "PAID", createdAt: { $gte: startOfPrev, $lte: endOfPrev } } }, { $group: { _id: null, t: { $sum: "$totalAmount" } } }]),

            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: startOfToday } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),

            Product.countDocuments(),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ inStock: false, isActive: true }),

            Vendor.countDocuments({ status: "pending",  isDeleted: false }),
            Vendor.countDocuments({ status: "approved", isDeleted: false }),

            Order.countDocuments({ "refund.status": "REQUESTED" }),
            Order.countDocuments({ "return.status": "REQUESTED" }),

            Order.find().sort({ createdAt: -1 }).limit(10)
                .select("customerName totalAmount orderStatus orderMode payment.method createdAt invoiceNumber")
                .lean(),

            Order.aggregate([
                { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
                { $sort:  { count: -1 } },
            ]),

            Order.aggregate([
                { $match: { "payment.status": "PAID", createdAt: { $gte: last30 } } },
                { $group: {
                    _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders:  { $sum: 1 },
                }},
                { $sort: { _id: 1 } },
            ]),
        ]);

        const totalRevenue     = revenueAgg[0]?.t     || 0;
        const todayRevenue     = todayRevAgg[0]?.t    || 0;
        const monthRevenue     = monthRevAgg[0]?.t    || 0;
        const prevMonthRevenue = prevMonthRevAgg[0]?.t || 0;

        const pct = (curr, prev) =>
            prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

        res.json({
            stats: {
                totalOrders,   todayOrders,   monthOrders,   prevMonthOrders,
                ordersGrowth:  pct(monthOrders, prevMonthOrders),
                totalRevenue,  todayRevenue,  monthRevenue,  prevMonthRevenue,
                revenueGrowth: pct(monthRevenue, prevMonthRevenue),
                totalUsers,    newUsersToday, newUsersMonth,
                totalProducts, activeProducts, outOfStock,
                pendingVendors, activeVendors,
                pendingRefunds, openReturns,
            },
            recentOrders,
            ordersByStatus,
            revenueByDay,
        });
    } catch (err) {
        console.error("[getDashboardStats]", err);
        res.status(500).json({ success: false,  message: "Failed to load dashboard" });
    }
};
