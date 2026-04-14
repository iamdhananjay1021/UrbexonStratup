import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { protectVendor, requireApprovedVendor } from "../middlewares/vendorMiddleware.js";

import {
    getProducts,
    getHomepageProducts,
    getDeals,
    getUrbexonHourProducts,
    getUrbexonHourDeals,
    getProductBySlug,
    getRelatedProducts,
    getSuggestions,
    adminGetAllProducts,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    vendorGetMyProducts,
    vendorCreateProduct,
    vendorUpdateProduct,
    vendorDeleteProduct,
} from "../controllers/productController.js";

import { validate } from "../middlewares/zodValidate.js";
import { createProductSchema, updateProductSchema } from "../validations/product.schema.js";

/* ───────────────────────────────────────────────
   📦 MULTER CONFIG (SECURE)
─────────────────────────────────────────────── */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 6,
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files allowed"), false);
        }
        cb(null, true);
    },
});

/* ───────────────────────────────────────────────
   🚫 RATE LIMITING (WRITE APIs)
─────────────────────────────────────────────── */
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Too many requests, try again later",
});

/* ───────────────────────────────────────────────
   🧠 ROUTER
─────────────────────────────────────────────── */
const router = express.Router();

/* ── Public Routes ───────────────────────────── */
router.get("/", getProducts);
router.get("/homepage", getHomepageProducts);
router.get("/deals", getDeals);
router.get("/suggestions", getSuggestions);
router.get("/urbexon-hour", getUrbexonHourProducts);
router.get("/urbexon-hour/deals", getUrbexonHourDeals);

/* ── Admin Routes ────────────────────────────── */
router.get(
    "/admin/all",
    protect,
    adminOnly,
    adminGetAllProducts
);

router.post(
    "/admin",
    protect,
    adminOnly,
    writeLimiter,
    upload.array("images", 6),
    validate(createProductSchema),
    adminCreateProduct
);

router.put(
    "/admin/:id",
    protect,
    adminOnly,
    writeLimiter,
    upload.array("images", 6),
    validate(updateProductSchema),
    adminUpdateProduct
);

router.delete(
    "/admin/:id",
    protect,
    adminOnly,
    writeLimiter,
    adminDeleteProduct
);

/* ── Vendor Routes ───────────────────────────── */
router.get(
    "/vendor/mine",
    protectVendor,
    requireApprovedVendor,
    vendorGetMyProducts
);

router.post(
    "/vendor",
    protectVendor,
    requireApprovedVendor,
    writeLimiter,
    upload.array("images", 4),
    vendorCreateProduct
);

router.put(
    "/vendor/:id",
    protectVendor,
    requireApprovedVendor,
    writeLimiter,
    upload.array("images", 4),
    vendorUpdateProduct
);

router.delete(
    "/vendor/:id",
    protectVendor,
    requireApprovedVendor,
    writeLimiter,
    vendorDeleteProduct
);

/* ── Dynamic Routes (ALWAYS LAST) ───────────── */
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProductBySlug);

export default router;