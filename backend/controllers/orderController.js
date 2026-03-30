/**
 * orderController.js
 * ✅ Uses pricing.js service — DB prices only, frontend prices IGNORED
 * ✅ COD validated server-side
 * ✅ WhatsApp completely removed
 * ✅ Clean architecture
 * ✅ Returns queue and processReturn added
 */

import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import Order, { generateInvoiceNumber } from "../models/Order.js";
import Product from "../models/Product.js";
import { sendEmail } from "../utils/emailService.js";
import { getOrderStatusEmailTemplate } from "../utils/orderStatusEmail.js";
import { adminOrderEmailHTML } from "../utils/adminOrderEmail.js";
import { generateInvoiceBuffer } from "../utils/invoiceEmailHelper.js";
import { checkCODEligibility } from "./addressController.js";
import { calculateOrderPricing, deductStock, restoreStock } from "../services/pricing.js";
import { DELIVERY_CONFIG } from "../config/deliveryConfig.js";
import { addUserStream, removeUserStream, publishToUser } from "../utils/realtimeHub.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getClientIp = (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress || "";

/* ──────────────────────────────────────────────
   FRAUD CHECKER
────────────────────────────────────────────── */
const checkFraud = async ({ userId, ip, amount, paymentId }) => {
    const reasons = [];
    const oneHour = new Date(Date.now() - 60 * 60 * 1000);

    if (paymentId) {
        const dup = await Order.findOne({ "payment.razorpayPaymentId": paymentId }).lean();
        if (dup) reasons.push("DUPLICATE_PAYMENT_ID");
    }

    const recentOrders = await Order.countDocuments({ user: userId, createdAt: { $gte: oneHour } });
    if (recentOrders >= 5) reasons.push("HIGH_ORDER_FREQUENCY");

    if (ip) {
        const ipOrders = await Order.countDocuments({ "payment.ip": ip, createdAt: { $gte: oneHour } });
        if (ipOrders >= 8) reasons.push("HIGH_IP_FREQUENCY");
    }

    const totalUserOrders = await Order.countDocuments({ user: userId });
    if (totalUserOrders >= 5) {
        const refundedCount = await Order.countDocuments({
            user: userId,
            "refund.status": { $in: ["APPROVED", "PROCESSED"] },
        });
        if (refundedCount / totalUserOrders > 0.3) reasons.push("HIGH_REFUND_RATE");
    }

    if (amount > 50000) reasons.push("HIGH_VALUE_ORDER");

    return { flagged: reasons.length > 0, reasons };
};



/* ══════════════════════════════════════════════
   REALTIME ORDER STREAM (SSE)
   GET /api/orders/stream?token=JWT
══════════════════════════════════════════════ */
export const streamMyOrderEvents = async (req, res) => {
    try {
        const token = req.query?.token;
        if (!token) return res.status(401).json({ message: "Token required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id;
        if (!userId) return res.status(401).json({ message: "Invalid token" });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        addUserStream(userId, res);
        res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`);

        const heartbeat = setInterval(() => {
            res.write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
        }, 25000);

        req.on("close", () => {
            clearInterval(heartbeat);
            removeUserStream(userId, res);
            res.end();
        });
    } catch {
        res.status(401).json({ message: "Unauthorized stream access" });
    }
};

/* ══════════════════════════════════════════════
   CREATE ORDER (COD)
   ✅ Prices recalculated from DB — frontend totalAmount IGNORED
   ✅ COD validated server-side
   ✅ No WhatsApp
══════════════════════════════════════════════ */
export const createOrder = async (req, res) => {
    try {
        const {
            items,
            customerName,
            phone,
            address,
            email,
            pincode,
            paymentMethod,
            deliveryType,
            distanceKm,
            latitude,
            longitude,
        } = req.body;

        if (!items?.length)
            return res.status(400).json({ message: "Cart is empty" });
        if (!customerName?.trim() || !phone?.trim() || !address?.trim())
            return res.status(400).json({ message: "Customer details missing" });
        if (!/^[6-9]\d{9}$/.test(phone.trim()))
            return res.status(400).json({ message: "Invalid phone number" });

        if (paymentMethod === "COD") {
            if (!pincode || !/^\d{6}$/.test(pincode.trim()))
                return res.status(400).json({ message: "Valid pincode required for COD orders" });

            const codCheck = await checkCODEligibility(pincode.trim());
            if (!codCheck.allowed) {
                return res.status(400).json({
                    message: codCheck.reason,
                    codUnavailable: true,
                    codStatus: codCheck.codStatus || "coming_soon",
                });
            }
        }

        const method = paymentMethod === "COD" ? "COD" : "RAZORPAY";
        let pricing;
        try {
            pricing = await calculateOrderPricing(items, method, { deliveryType, distanceKm, pincode });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        const { formattedItems, itemsTotal, deliveryCharge, platformFee, finalTotal, deliveryETA, deliveryProvider, deliveryType: finalDeliveryType, distanceKm: finalDistanceKm } = pricing;

        const ip = getClientIp(req);
        const fraudCheck = await checkFraud({ userId: req.user._id, ip, amount: finalTotal });
        const invoiceNum = await generateInvoiceNumber();

        const order = new Order({
            user: req.user._id,
            invoiceNumber: invoiceNum,
            items: formattedItems,
            customerName: customerName.trim().slice(0, 100),
            phone: phone.trim(),
            address: address.trim().slice(0, 500),
            email: email?.trim().toLowerCase().slice(0, 200) || "",
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
            totalAmount: finalTotal,
            platformFee,
            deliveryCharge,
            delivery: {
                type: finalDeliveryType,
                distanceKm: finalDistanceKm,
                provider: deliveryProvider,
                eta: deliveryETA,
            },
            payment: {
                method,
                status: "PENDING",
                ip,
                userAgent: req.headers["user-agent"]?.slice(0, 300) || "",
                flagged: fraudCheck.flagged,
                flagReasons: fraudCheck.reasons,
            },
            paymentLogs: [{
                event: "ORDER_PLACED",
                amount: finalTotal,
                method,
                ip,
                meta: { fraudCheck, itemsTotal, deliveryCharge },
                at: new Date(),
            }],
            orderStatus: "PLACED",
            statusTimeline: { placedAt: new Date() },
        });

        const savedOrder = await order.save();
        await deductStock(formattedItems);

        res.status(201).json({
            success: true,
            orderId: savedOrder._id,
            invoiceNumber: savedOrder.invoiceNumber,
            orderStatus: savedOrder.orderStatus,
            itemsTotal,
            deliveryCharge,
            finalTotal,
            deliveryType: finalDeliveryType,
            deliveryETA,
            deliveryProvider,
        });

        const userMail = getOrderStatusEmailTemplate({
            customerName: customerName.trim(),
            orderId: savedOrder._id,
            status: "PLACED",
        });
        if (email?.trim() && !email.includes("@placeholder.com"))
            sendEmail({ to: email.trim(), subject: userMail.subject, html: userMail.html, label: "User/NewOrder" });

        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `🛒 New COD Order #${savedOrder._id.toString().slice(-6).toUpperCase()} — ₹${finalTotal}${fraudCheck.flagged ? " ⚠️ FLAGGED" : ""}`,
            html: adminOrderEmailHTML({ order: savedOrder }),
            label: "Admin/NewOrder",
        });

        if (fraudCheck.flagged)
            console.warn(`[FRAUD] Order ${savedOrder._id} flagged:`, fraudCheck.reasons);

    } catch (err) {
        console.error("CREATE ORDER:", err);
        res.status(500).json({ message: "Order placement failed. Please try again." });
    }
};

/* ══════════════════════════════════════════════
   GET CHECKOUT PRICING
══════════════════════════════════════════════ */
export const getCheckoutPricing = async (req, res) => {
    try {
        const { items, paymentMethod, deliveryType, distanceKm, pincode } = req.body;

        if (!items?.length)
            return res.status(400).json({ message: "Cart is empty" });

        const method = paymentMethod === "COD" ? "COD" : "RAZORPAY";

        try {
            const pricing = await calculateOrderPricing(items, method, { deliveryType, distanceKm, pincode });
            res.json({
                itemsTotal: pricing.itemsTotal,
                deliveryCharge: pricing.deliveryCharge,
                platformFee: pricing.platformFee,
                finalTotal: pricing.finalTotal,
                deliveryType: pricing.deliveryType,
                distanceKm: pricing.distanceKm,
                deliveryETA: pricing.deliveryETA,
                deliveryProvider: pricing.deliveryProvider,
                freeDeliveryThreshold: DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD,
                amountForFreeDelivery: Math.max(0, DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD - pricing.itemsTotal),
            });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    } catch (err) {
        console.error("GET PRICING:", err);
        res.status(500).json({ message: "Failed to calculate pricing" });
    }
};

/* ══════════════════════════════════════════════
   CANCEL ORDER (USER)
══════════════════════════════════════════════ */
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "Not authorized" });
        if (order.orderStatus === "CANCELLED")
            return res.status(400).json({ message: "Already cancelled" });
        if (!["PLACED", "CONFIRMED"].includes(order.orderStatus))
            return res.status(400).json({
                message: `Cannot cancel — order is ${order.orderStatus.toLowerCase().replace(/_/g, " ")}. Cancellation only allowed before packing.`,
            });

        order.orderStatus = "CANCELLED";
        order.cancellationReason = String(req.body?.reason || "Cancelled by customer").trim().slice(0, 500);
        const existing = order.statusTimeline?.toObject ? order.statusTimeline.toObject() : { ...order.statusTimeline };
        order.statusTimeline = { ...existing, cancelledAt: new Date() };
        order.markModified("statusTimeline");

        if (order.payment.method === "RAZORPAY" && order.payment.status === "PAID") {
            order.refund = {
                requested: true,
                requestedAt: new Date(),
                reason: req.body?.reason || "Order cancelled by customer",
                status: "REQUESTED",
                amount: order.totalAmount,
            };
            order.paymentLogs.push({
                event: "REFUND_REQUESTED", amount: order.totalAmount,
                method: "RAZORPAY", ip: getClientIp(req), at: new Date(),
            });
        }

        await order.save();
        await restoreStock(order.items);

        res.json({
            success: true,
            message: "Order cancelled",
            order: order.toObject(),
            refundRequested: !!order.refund?.requested,
        });

        const mail = getOrderStatusEmailTemplate({ customerName: order.customerName, orderId: order._id, status: "CANCELLED" });
        if (order.email && !order.email.includes("@placeholder.com"))
            sendEmail({ to: order.email, subject: mail.subject, html: mail.html, label: "User/Cancel" });
        sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `❌ Cancelled #${order._id.toString().slice(-6).toUpperCase()} — ${order.customerName}`,
            html: adminOrderEmailHTML({ order }),
            label: "Admin/Cancel",
        });

    } catch (err) {
        console.error("CANCEL ORDER:", err);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};

/* ══════════════════════════════════════════════
   GET MY ORDERS
══════════════════════════════════════════════ */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

/* ══════════════════════════════════════════════
   GET ORDER BY ID
══════════════════════════════════════════════ */
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin) return res.status(403).json({ message: "Access denied" });

        res.json(order);
    } catch {
        res.status(500).json({ message: "Error fetching order" });
    }
};

/* ══════════════════════════════════════════════
   UPDATE ORDER STATUS (ADMIN)
══════════════════════════════════════════════ */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const valid = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
        if (!valid.includes(status))
            return res.status(400).json({ message: "Invalid status" });

        const update = { orderStatus: status };
        const tMap = { CONFIRMED: "confirmedAt", PACKED: "packedAt", SHIPPED: "shippedAt", DELIVERED: "deliveredAt", CANCELLED: "cancelledAt" };
        if (tMap[status]) update[`statusTimeline.${tMap[status]}`] = new Date();

        if (status === "DELIVERED") { update["payment.status"] = "PAID"; update["payment.paidAt"] = new Date(); }
        if (status === "SHIPPED") update["shipping.status"] = "SHIPPED";

        const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (status === "CANCELLED") await restoreStock(order.items);

        publishToUser(order.user, "order_status_updated", {
            orderId: order._id,
            status,
            at: new Date().toISOString(),
        });

        res.json(order);

        if (order.email && !order.email.includes("@placeholder.com")) {
            const sMail = getOrderStatusEmailTemplate({ customerName: order.customerName, orderId: order._id, status });
            if (status === "DELIVERED") {
                try {
                    const pdf = await generateInvoiceBuffer(order.toObject ? order.toObject() : order);
                    sendEmail({ to: order.email, subject: sMail.subject, html: sMail.html, label: `User/${status}`, attachments: [{ filename: `Invoice_${order.invoiceNumber || order._id.toString().slice(-8).toUpperCase()}.pdf`, content: pdf }] });
                } catch {
                    sendEmail({ to: order.email, subject: sMail.subject, html: sMail.html, label: `User/${status}` });
                }
            } else if (status !== "PACKED") {
                sendEmail({ to: order.email, subject: sMail.subject, html: sMail.html, label: `User/${status}` });
            }
        }
    } catch (err) {
        console.error("UPDATE STATUS:", err);
        res.status(500).json({ message: "Failed to update status" });
    }
};

/* ══════════════════════════════════════════════
   GET ALL ORDERS (ADMIN) — Paginated
══════════════════════════════════════════════ */
export const getAllOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status && req.query.status !== "ALL") filter.orderStatus = req.query.status;
        if (req.query.search?.trim()) {
            filter.$or = [
                { customerName: { $regex: req.query.search.trim(), $options: "i" } },
                { phone: { $regex: req.query.search.trim(), $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        res.json({ orders, total, page, totalPages: Math.ceil(total / limit), limit });
    } catch {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};



/* ══════════════════════════════════════════════
   ADMIN — LOCAL DELIVERY QUEUE (URBEXON HOUR)
══════════════════════════════════════════════ */
export const getLocalDeliveryQueue = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const filter = {
            "delivery.type": "URBEXON_HOUR",
            orderStatus: { $nin: ["DELIVERED", "CANCELLED"] },
        };

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        res.json({ orders, total, page, totalPages: Math.ceil(total / limit), limit });
    } catch (err) {
        console.error("LOCAL DELIVERY QUEUE:", err);
        res.status(500).json({ message: "Failed to fetch local delivery queue" });
    }
};

/* ══════════════════════════════════════════════
   ADMIN — ASSIGN LOCAL DELIVERY
══════════════════════════════════════════════ */
export const assignLocalDelivery = async (req, res) => {
    try {
        const { provider, riderName, riderPhone, note } = req.body;
        const allowed = ["LOCAL_RIDER", "VENDOR_SELF", "SHIPROCKET"];
        if (!allowed.includes(provider)) {
            return res.status(400).json({ message: "Invalid provider" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.delivery?.type !== "URBEXON_HOUR") {
            return res.status(400).json({ message: "Only Urbexon Hour orders can be assigned here" });
        }

        order.delivery.provider = provider;
        order.delivery.riderName = String(riderName || "").trim().slice(0, 100);
        order.delivery.riderPhone = String(riderPhone || "").trim().slice(0, 20);
        order.delivery.note = String(note || "").trim().slice(0, 500);
        order.delivery.assignedAt = new Date();
        order.markModified("delivery");

        if (order.orderStatus === "PLACED") {
            order.orderStatus = "CONFIRMED";
            const existing = order.statusTimeline?.toObject ? order.statusTimeline.toObject() : { ...order.statusTimeline };
            order.statusTimeline = { ...existing, confirmedAt: new Date() };
            order.markModified("statusTimeline");
        }

        await order.save();

        publishToUser(order.user, "order_status_updated", {
            orderId: order._id,
            status: order.orderStatus,
            provider,
            assignedAt: order.delivery.assignedAt,
            at: new Date().toISOString(),
        });

        res.json({ success: true, order });
    } catch (err) {
        console.error("ASSIGN LOCAL DELIVERY:", err);
        res.status(500).json({ message: "Failed to assign local delivery" });
    }
};

/* ══════════════════════════════════════════════
   REFUND — REQUEST (USER)
══════════════════════════════════════════════ */
export const requestRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
        if (order.payment.method !== "RAZORPAY") return res.status(400).json({ message: "Refund only for online payments" });
        if (order.payment.status !== "PAID") return res.status(400).json({ message: "Payment not completed" });
        if (order.refund?.status && order.refund.status !== "NONE") return res.status(400).json({ message: `Refund already ${order.refund.status.toLowerCase()}` });

        order.refund = { requested: true, requestedAt: new Date(), reason: (req.body.reason || "Requested by customer").trim().slice(0, 500), status: "REQUESTED", amount: order.totalAmount };
        order.paymentLogs.push({ event: "REFUND_REQUESTED", amount: order.totalAmount, method: "RAZORPAY", ip: getClientIp(req), at: new Date() });
        order.markModified("refund");
        await order.save();

        res.json({ success: true, message: "Refund request submitted", refund: order.refund });
        sendEmail({ to: process.env.ADMIN_EMAIL, subject: `💰 Refund Request #${order._id.toString().slice(-6).toUpperCase()} — ₹${order.totalAmount}`, html: `<p>Refund requested by ${order.customerName}. Amount: ₹${order.totalAmount}</p>`, label: "Admin/RefundRequest" });
    } catch (err) {
        console.error("REQUEST REFUND:", err);
        res.status(500).json({ message: "Failed to submit refund request" });
    }
};

/* ══════════════════════════════════════════════
   REFUND — PROCESS (ADMIN)
══════════════════════════════════════════════ */
export const processRefund = async (req, res) => {
    try {
        const { action, adminNote } = req.body;
        if (!["approve", "reject"].includes(action)) return res.status(400).json({ message: "Action must be approve or reject" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.refund?.requested || order.refund?.status !== "REQUESTED") return res.status(400).json({ message: "No pending refund request" });

        if (action === "reject") {
            order.refund.status = "REJECTED";
            order.refund.adminNote = adminNote?.trim() || "";
            order.paymentLogs.push({ event: "REFUND_REJECTED", amount: order.refund.amount, method: "RAZORPAY", ip: getClientIp(req), at: new Date() });
            order.markModified("refund");
            await order.save();
            return res.json({ success: true, message: "Refund rejected" });
        }

        const refundAmount = order.refund.amount || order.totalAmount;
        const paymentId = order.payment.razorpayPaymentId;
        if (!paymentId) return res.status(400).json({ message: "No Razorpay payment ID found" });

        order.refund.status = "PROCESSING";
        order.markModified("refund");
        await order.save();

        try {
            const rzRef = await razorpay.payments.refund(paymentId, { amount: refundAmount * 100, notes: { orderId: order._id.toString() } });
            order.refund.status = "PROCESSED";
            order.refund.razorpayRefundId = rzRef.id;
            order.refund.processedAt = new Date();
            order.refund.processedBy = req.user._id;
            order.payment.status = "REFUNDED";
            order.paymentLogs.push({ event: "REFUND_PROCESSED", amount: refundAmount, method: "RAZORPAY", paymentId, meta: { refundId: rzRef.id }, at: new Date() });
            order.markModified("refund");
            await order.save();
            res.json({ success: true, message: `₹${refundAmount} refunded`, refundId: rzRef.id });
        } catch (rzErr) {
            order.refund.status = "FAILED";
            order.markModified("refund");
            await order.save();
            return res.status(500).json({ message: "Razorpay refund failed: " + (rzErr.error?.description || rzErr.message) });
        }
    } catch (err) {
        console.error("PROCESS REFUND:", err);
        res.status(500).json({ message: "Refund processing failed" });
    }
};

/* ══════════════════════════════════════════════
   REFUND — RETRY (ADMIN)
══════════════════════════════════════════════ */
export const retryRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.refund?.status !== "FAILED") return res.status(400).json({ message: "Only failed refunds can be retried" });
        order.refund.status = "REQUESTED";
        order.markModified("refund");
        await order.save();
        req.body.action = "approve";
        return processRefund(req, res);
    } catch {
        res.status(500).json({ message: "Retry failed" });
    }
};

/* ══════════════════════════════════════════════
   FLAGGED ORDERS QUEUE (ADMIN)
══════════════════════════════════════════════ */
export const getFlaggedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ "payment.flagged": true }).sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch {
        res.status(500).json({ message: "Failed" });
    }
};

/* ══════════════════════════════════════════════
   REFUND QUEUE (ADMIN)
══════════════════════════════════════════════ */
export const getRefundQueue = async (req, res) => {
    try {
        const orders = await Order.find({ "refund.status": "REQUESTED" }).sort({ "refund.requestedAt": -1 }).lean();
        res.json(orders);
    } catch {
        res.status(500).json({ message: "Failed" });
    }
};

/* ══════════════════════════════════════════════
   RETURN QUEUE (ADMIN)
   GET /api/orders/admin/returns
══════════════════════════════════════════════ */
export const getReturnQueue = async (req, res) => {
    try {
        const orders = await Order.find({
            "return.status": { $in: ["REQUESTED", "APPROVED", "PICKED_UP"] },
        }).sort({ "return.requestedAt": -1 }).lean();
        res.json(orders);
    } catch (err) {
        console.error("GET RETURN QUEUE:", err);
        res.status(500).json({ message: "Failed to fetch return queue" });
    }
};

/* ══════════════════════════════════════════════
   PROCESS RETURN (ADMIN)
   PUT /api/orders/:id/return/process
   body: { action: "approve"|"reject"|"pickup"|"refund", adminNote, refundAmount }
══════════════════════════════════════════════ */
export const processReturn = async (req, res) => {
    try {
        const { action, adminNote, refundAmount } = req.body;

        if (!["approve", "reject", "pickup", "refund"].includes(action))
            return res.status(400).json({ message: "Invalid action. Use: approve | reject | pickup | refund" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (!order.return?.status || order.return.status === "NONE")
            return res.status(400).json({ message: "No return request found on this order" });

        const statusMap = {
            approve: "APPROVED",
            reject: "REJECTED",
            pickup: "PICKED_UP",
            refund: "REFUNDED",
        };

        order.return.status = statusMap[action];
        order.return.adminNote = adminNote?.trim() || "";
        order.return.processedAt = new Date();
        order.return.processedBy = req.user._id;

        // If refunding after return pickup — try Razorpay first, fallback for COD
        if (action === "refund") {
            const amount = refundAmount ? Number(refundAmount) : order.totalAmount;
            const paymentId = order.payment?.razorpayPaymentId;

            if (paymentId) {
                try {
                    const rzRef = await razorpay.payments.refund(paymentId, {
                        amount: amount * 100,
                        notes: { orderId: order._id.toString(), type: "RETURN_REFUND" },
                    });
                    order.refund = {
                        requested: true,
                        requestedAt: new Date(),
                        reason: "Return refund",
                        status: "PROCESSED",
                        amount,
                        razorpayRefundId: rzRef.id,
                        processedAt: new Date(),
                        processedBy: req.user._id,
                    };
                    order.payment.status = "REFUNDED";
                    order.paymentLogs.push({
                        event: "RETURN_REFUND_PROCESSED",
                        amount,
                        method: "RAZORPAY",
                        meta: { refundId: rzRef.id },
                        at: new Date(),
                    });
                    order.markModified("refund");
                } catch (rzErr) {
                    return res.status(500).json({
                        message: "Razorpay refund failed: " + (rzErr.error?.description || rzErr.message),
                    });
                }
            }
            // COD orders — manual cash refund, just mark as refunded
        }

        order.markModified("return");
        await order.save();

        res.json({
            success: true,
            message: `Return ${action}d successfully`,
            return: order.return,
        });

    } catch (err) {
        console.error("PROCESS RETURN:", err);
        res.status(500).json({ message: "Failed to process return" });
    }
};