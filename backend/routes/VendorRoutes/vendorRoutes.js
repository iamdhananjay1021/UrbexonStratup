import express from "express";
import multer from "multer";

// ── Controllers ───────────────────────────────────────────────
import { registerVendor, getVendorStatus } from "../../controllers/vendor/vendorAuth.js";
import { getMyProfile, updateMyProfile, toggleShopOpen } from "../../controllers/vendor/venderProfile.js";
import { getEarnings, getWeeklyEarnings } from "../../controllers/vendor/vendorEarnings.js";

import {
    getAllVendors,
    getVendorDetail,
    approveVendor,
    rejectVendor,
    suspendVendor,
    updateCommission,
    deleteVendor,
} from "../../controllers/admin/vendorApproval.js";

import {
    getAllPincodes,
    createPincode,
    updatePincode,
    deletePincode,
    checkPincode,
    joinWaitlist,
} from "../../controllers/admin/pincodeManager.js";

import {
    getAllSettlements,
    processWeeklySettlements,
    markSettlementPaid,
    markBatchPaid,
} from "../../controllers/admin/settlementManager.js";

// ── Middleware ────────────────────────────────────────────────
import { protect, adminOnly } from "../../middlewares/authMiddleware.js";
import { protectVendor, requireApprovedVendor } from "../../middlewares/vendorMiddleware.js";

// ── Multer setup ──────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error("Only images (JPEG, PNG, WEBP) and PDFs are allowed"), false);
    },
});

const docUpload = upload.fields([
    { name: "shopLogo", maxCount: 1 },
    { name: "shopBanner", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "cancelledCheque", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
]);

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// 🌐 PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════
router.get("/pincode/check/:code", checkPincode);
router.post("/pincode/waitlist", joinWaitlist);

// ════════════════════════════════════════════════════════════════
// 🧑 VENDOR AUTH ROUTES
// ════════════════════════════════════════════════════════════════
router.post("/vendor/register", protect, docUpload, registerVendor);
router.get("/vendor/status", protect, getVendorStatus);

// ════════════════════════════════════════════════════════════════
// 🏪 VENDOR PROFILE ROUTES
// ════════════════════════════════════════════════════════════════
router.get("/vendor/me", protectVendor, getMyProfile);
router.put("/vendor/me", protectVendor, requireApprovedVendor, docUpload, updateMyProfile);
router.patch("/vendor/toggle-shop", protectVendor, requireApprovedVendor, toggleShopOpen);

// ════════════════════════════════════════════════════════════════
// 💰 VENDOR EARNINGS ROUTES
// ════════════════════════════════════════════════════════════════
router.get("/vendor/earnings", protectVendor, requireApprovedVendor, getEarnings);
router.get("/vendor/earnings/weekly", protectVendor, requireApprovedVendor, getWeeklyEarnings);

// ════════════════════════════════════════════════════════════════
// 🛡️ ADMIN — VENDOR MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get("/admin/vendors", protect, adminOnly, getAllVendors);
router.get("/admin/vendors/:id", protect, adminOnly, getVendorDetail);
router.patch("/admin/vendors/:id/approve", protect, adminOnly, approveVendor);
router.patch("/admin/vendors/:id/reject", protect, adminOnly, rejectVendor);
router.patch("/admin/vendors/:id/suspend", protect, adminOnly, suspendVendor);
router.patch("/admin/vendors/:id/commission", protect, adminOnly, updateCommission);
router.delete("/admin/vendors/:id", protect, adminOnly, deleteVendor);

// ════════════════════════════════════════════════════════════════
// 🗺️ ADMIN — PINCODE MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get("/admin/pincodes", protect, adminOnly, getAllPincodes);
router.post("/admin/pincodes", protect, adminOnly, createPincode);
router.put("/admin/pincodes/:id", protect, adminOnly, updatePincode);
router.delete("/admin/pincodes/:id", protect, adminOnly, deletePincode);

// ════════════════════════════════════════════════════════════════
// 💳 ADMIN — SETTLEMENT MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get("/admin/settlements", protect, adminOnly, getAllSettlements);
router.post("/admin/settlements/process", protect, adminOnly, processWeeklySettlements);
router.patch("/admin/settlements/:id/paid", protect, adminOnly, markSettlementPaid);
router.patch("/admin/settlements/batch/:batchId/paid", protect, adminOnly, markBatchPaid);

export default router;