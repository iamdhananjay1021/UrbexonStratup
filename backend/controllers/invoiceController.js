/**
 * invoiceController.js
 * ─────────────────────────────────────────────────────────
 * Download invoice PDF + public invoice verification
 */

import Order from "../models/Order.js";
import { generateInvoiceBuffer } from "../utils/invoiceEmailHelper.js";

/* ══════════════════════════════════════════════════════
   DOWNLOAD INVOICE PDF
   GET /api/invoice/:orderId/download
   Owner or Admin only
══════════════════════════════════════════════════════ */
export const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).lean();

        if (!order)
            return res.status(404).json({ message: "Order not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        const pdfBuffer = await generateInvoiceBuffer(order);
        const invoiceId = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
        const filename = `Urbexon_Invoice_${invoiceId}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("[Invoice] Download error:", err);
        res.status(500).json({ message: "Failed to generate invoice" });
    }
};

/* ══════════════════════════════════════════════════════
   DOWNLOAD BY INVOICE NUMBER
   GET /api/invoice/number/:invoiceNumber/download
   Owner or Admin only
══════════════════════════════════════════════════════ */
export const downloadInvoiceByNumber = async (req, res) => {
    try {
        const order = await Order.findOne({
            invoiceNumber: req.params.invoiceNumber,
        }).lean();

        if (!order)
            return res.status(404).json({ message: "Invoice not found" });

        const isOwner = order.user?.toString() === req.user._id.toString();
        const isAdmin = ["admin", "owner"].includes(req.user.role);
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Access denied" });

        const pdfBuffer = await generateInvoiceBuffer(order);
        const filename = `Urbexon_${order.invoiceNumber}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("[Invoice] Download by number error:", err);
        res.status(500).json({ message: "Invoice generation failed" });
    }
};

/* ══════════════════════════════════════════════════════
   PUBLIC VERIFY (QR scan → anyone can verify)
   GET /api/invoice/:invoiceNumber/verify
   No auth required — QR on printed invoice links here
══════════════════════════════════════════════════════ */
export const verifyInvoice = async (req, res) => {
    try {
        const order = await Order.findOne({
            invoiceNumber: req.params.invoiceNumber,
        })
            .select("invoiceNumber customerName orderStatus payment createdAt totalAmount _id")
            .lean();

        if (!order) {
            return res.json({
                valid: false,
                message: "Invoice not found. This may be fake or tampered.",
            });
        }

        res.json({
            valid: true,
            invoiceNumber: order.invoiceNumber,
            orderId: `#${order._id.toString().slice(-8).toUpperCase()}`,
            customerName: order.customerName,
            orderStatus: order.orderStatus,
            paymentStatus: order.payment?.status,
            totalAmount: order.totalAmount,
            date: order.createdAt,
            message: "This is an authentic Urbexon invoice.",
        });

    } catch (err) {
        console.error("[Invoice] Verify error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
};