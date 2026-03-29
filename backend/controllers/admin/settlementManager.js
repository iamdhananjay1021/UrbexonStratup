import { Settlement } from "../../models/vendorModels/Settlement.js";
import Vendor from "../../models/vendorModels/Vendor.js";

// ══════════════════════════════════════════════════════════════
// ADMIN — Get all settlements
// GET /api/admin/settlements?status=pending&vendorId=xxx&page=1
// ══════════════════════════════════════════════════════════════
export const getAllSettlements = async (req, res) => {
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

        res.json({ success: true, settlements, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error("[getAllSettlements]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Process weekly settlements (create batch)
// POST /api/admin/settlements/process
// ══════════════════════════════════════════════════════════════
export const processWeeklySettlements = async (req, res) => {
    try {
        const batchId = `BATCH-${Date.now()}`;
        const pending = await Settlement.find({ status: "pending" });

        if (!pending.length) {
            return res.json({ success: true, message: "No pending settlements to process", count: 0 });
        }

        // Group by vendor for summary
        const vendorMap = {};
        pending.forEach((s) => {
            const vid = s.vendorId.toString();
            if (!vendorMap[vid]) vendorMap[vid] = { total: 0, count: 0 };
            vendorMap[vid].total += s.vendorEarning;
            vendorMap[vid].count += 1;
        });

        await Settlement.updateMany(
            { _id: { $in: pending.map((s) => s._id) } },
            { status: "processing", batchId, settlementDate: new Date() }
        );

        res.json({
            success: true,
            message: "Settlement batch created",
            batchId,
            totalVendors: Object.keys(vendorMap).length,
            totalSettlements: pending.length,
            vendorSummary: Object.entries(vendorMap).map(([vendorId, data]) => ({
                vendorId,
                amount: data.total,
                count: data.count,
            })),
        });
    } catch (err) {
        console.error("[processWeeklySettlements]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Mark single settlement as paid
// PATCH /api/admin/settlements/:id/paid
// ══════════════════════════════════════════════════════════════
export const markSettlementPaid = async (req, res) => {
    try {
        const { paymentRef, paymentMethod } = req.body;

        const settlement = await Settlement.findByIdAndUpdate(
            req.params.id,
            { status: "paid", paymentRef, paymentMethod, settlementDate: new Date() },
            { new: true }
        );
        if (!settlement) return res.status(404).json({ message: "Settlement not found" });

        // Update vendor earnings balance
        await Vendor.findByIdAndUpdate(settlement.vendorId, {
            $inc: {
                pendingSettlement: -settlement.vendorEarning,
                totalEarnings: settlement.vendorEarning,
            },
        });

        res.json({ success: true, message: "Settlement marked as paid", settlement });
    } catch (err) {
        console.error("[markSettlementPaid]", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ══════════════════════════════════════════════════════════════
// ADMIN — Mark entire batch as paid
// PATCH /api/admin/settlements/batch/:batchId/paid
// ══════════════════════════════════════════════════════════════
export const markBatchPaid = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { paymentRef, paymentMethod } = req.body;

        const settlements = await Settlement.find({ batchId, status: "processing" });
        if (!settlements.length) {
            return res.status(404).json({ message: "No processing settlements found for this batch" });
        }

        await Settlement.updateMany(
            { batchId, status: "processing" },
            { status: "paid", paymentRef, paymentMethod, settlementDate: new Date() }
        );

        // Update each vendor's balance
        const vendorMap = {};
        settlements.forEach((s) => {
            const vid = s.vendorId.toString();
            if (!vendorMap[vid]) vendorMap[vid] = 0;
            vendorMap[vid] += s.vendorEarning;
        });

        await Promise.all(
            Object.entries(vendorMap).map(([vendorId, amount]) =>
                Vendor.findByIdAndUpdate(vendorId, {
                    $inc: { pendingSettlement: -amount, totalEarnings: amount },
                })
            )
        );

        res.json({
            success: true,
            message: `Batch ${batchId} marked as paid`,
            totalSettlements: settlements.length,
        });
    } catch (err) {
        console.error("[markBatchPaid]", err);
        res.status(500).json({ message: "Server error" });
    }
};