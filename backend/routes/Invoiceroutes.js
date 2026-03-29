/**
 * Invoiceroutes.js
 */

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    downloadInvoice,
    downloadInvoiceByNumber,
    verifyInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

// ── Download by Order ID (user/admin)
// GET /api/invoice/:orderId/download
router.get("/:orderId/download", protect, downloadInvoice);

// ── Download by Invoice Number (user/admin)
// GET /api/invoice/number/:invoiceNumber/download
router.get("/number/:invoiceNumber/download", protect, downloadInvoiceByNumber);

// ── Public verify (QR code scan)
// GET /api/invoice/:invoiceNumber/verify
router.get("/:invoiceNumber/verify", verifyInvoice);

export default router;