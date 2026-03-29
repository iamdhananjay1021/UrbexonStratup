import express from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getHomepageData,
  getSuggestedProducts,   // ✅ NEW
  getDeals,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middleware.js";
import Product from "../models/Product.js";

const router = express.Router();

/* ─────────────────────────────────────────────
   SITEMAP  —  GET /api/products/sitemap
───────────────────────────────────────────── */
router.get("/sitemap", async (req, res) => {
  try {
    const products = await Product.find({ inStock: true })
      .select("slug updatedAt")
      .lean();

    const BASE_URL = process.env.SITE_URL || "https://www.urbexon.com";

    const productUrls = products
      .filter((p) => p.slug)
      .map((p) => `
  <url>
    <loc>${BASE_URL}/products/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
      .join("");

    const staticUrls = [
      { path: "/", freq: "daily", priority: "1.0" },
      { path: "/deals", freq: "daily", priority: "0.9" },
      { path: "/contact", freq: "monthly", priority: "0.7" },
      { path: "/privacy-policy", freq: "yearly", priority: "0.3" },
      { path: "/terms-conditions", freq: "yearly", priority: "0.3" },
      { path: "/refund-policy", freq: "yearly", priority: "0.3" },
    ].map(({ path, freq, priority }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${productUrls}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("SITEMAP ERROR:", err);
    res.status(500).send("Sitemap generation failed");
  }
});

/* ─────────────────────────────────────────────
   SPECIFIC ROUTES PEHLE (/:id se pehle)
───────────────────────────────────────────── */
router.get("/homepage", getHomepageData);       // GET /api/products/homepage
router.get("/suggested", getSuggestedProducts);   // ✅ GET /api/products/suggested
router.get("/deals", getDeals);               // GET /api/products/deals

/* ─────────────────────────────────────────────
   PUBLIC ROUTES
───────────────────────────────────────────── */
router.get("/", getAllProducts);
router.get("/:id/related", getRelatedProducts);    // specific pehle
router.get("/:id", getSingleProduct);

/* ─────────────────────────────────────────────
   ADMIN ROUTES
───────────────────────────────────────────── */
router.post("/", protect, adminOnly, upload.array("images", 5), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;