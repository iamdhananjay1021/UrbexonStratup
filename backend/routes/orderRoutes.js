/**
 * orderRoutes.js
 * ✅ Added /pricing endpoint for frontend to fetch server-calculated prices
 * ✅ Added /admin/returns and /:id/return/process routes
 */

import express from "express";
import {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    retryRefund,
    getRefundQueue,
    getReturnQueue,
    processReturn,
    getFlaggedOrders,
    getCheckoutPricing,
    streamMyOrderEvents,
    getLocalDeliveryQueue,
    assignLocalDelivery,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { downloadInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

/* ── REALTIME STREAM ── */
router.get("/stream", streamMyOrderEvents);

/* ── PRICING (before /:id) ── */
router.post("/pricing", protect, getCheckoutPricing);

/* ── USER ROUTES ── */
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

/* ── ADMIN QUEUE ROUTES (before /:id) ── */
router.get("/admin/refunds", protect, adminOnly, getRefundQueue);
router.get("/admin/returns", protect, adminOnly, getReturnQueue);
router.get("/admin/flagged", protect, adminOnly, getFlaggedOrders);
router.get("/admin/local-delivery", protect, adminOnly, getLocalDeliveryQueue);
router.put("/admin/local-delivery/:id/assign", protect, adminOnly, assignLocalDelivery);

/* ── ADMIN MANAGEMENT ── */
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id", protect, adminOnly, updateOrderStatus);

/* ── USER ACTIONS ── */
router.patch("/:id/cancel", protect, cancelOrder);

/* ── ADMIN REFUND ACTIONS ── */
router.put("/:id/refund/process", protect, adminOnly, processRefund);
router.put("/:id/refund/retry", protect, adminOnly, retryRefund);

/* ── ADMIN RETURN ACTIONS ── */
router.put("/:id/return/process", protect, adminOnly, processReturn);

/* ── INVOICE ── */
router.get("/:id/invoice", protect, downloadInvoice);

/* ── GET SINGLE ORDER – MUST be last ── */
router.get("/:id", protect, getOrderById);

export default router;