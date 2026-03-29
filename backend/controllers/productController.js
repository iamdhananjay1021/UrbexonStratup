/**
 * productController.js
 * ─────────────────────────────────────────────────────────
 * ✅ In-memory cache (node-cache) — 5 min TTL, auto-invalidated
 * ✅ getHomepageData — no more full Product.find({}) scan
 * ✅ getAllProducts   — paginated, cache per query combo
 * ✅ getSuggestedProducts — DB-level aggregation, not JS filter
 * ✅ Cache invalidated on create / update / delete
 * ✅ All existing admin functions preserved
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { normalizeCategory } from "../utils/normalizeCategory.js";
import {
    getCache, setCache, invalidateProductCache,
    KEYS, TTL,
} from "../utils/Cache.js";

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const optimizeUrl = (url, width = 800) => {
    if (!url || !url.includes("cloudinary.com")) return url ?? "";
    return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width}/`);
};

const safeDestroy = async (publicId) => {
    if (!publicId) return;
    try { await cloudinary.uploader.destroy(publicId); }
    catch (e) { console.warn("[Cloudinary] Delete failed:", publicId, e.message); }
};

const parseMrp = (mrpRaw, price) => {
    if (mrpRaw === undefined || mrpRaw === null || mrpRaw === "") return null;
    const n = Number(mrpRaw);
    if (isNaN(n) || n <= 0) return null;
    if (price && n < Number(price)) return null;
    return n;
};

const findProduct = (identifier) => {
    const isId = mongoose.Types.ObjectId.isValid(identifier);
    return Product.findOne(isId ? { _id: identifier } : { slug: identifier });
};

const PRODUCT_SELECT =
    "name description price mrp slug category images tags rating numReviews " +
    "isCustomizable stock inStock isDeal dealEndsAt dealTag createdAt weight dimensions";

/* ══════════════════════════════════════════════════════
   GET ALL PRODUCTS — paginated + cached
   GET /api/products?search=&category=&sort=&page=&limit=
══════════════════════════════════════════════════════ */
export const getAllProducts = async (req, res) => {
    try {
        const {
            search, category, deals, sort,
            page = 1,
            limit = 24,
        } = req.query;

        // Sanitize pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 24);
        const skip = (pageNum - 1) * limitNum;

        // Cache key includes all query params
        const cacheKey = KEYS.productsList({ search, category, deals, sort, pageNum, limitNum });
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        /* ── Build query ── */
        const query = {};

        if (deals === "true") {
            query.isDeal = true;
            query.dealEndsAt = { $gt: new Date() };
        } else if (category) {
            query.category = normalizeCategory(category);
        }

        if (search?.trim().length >= 2) {
            const safe = escapeRegex(search.trim());
            // Use text index if available, fallback to regex
            query.$or = [
                { name: { $regex: safe, $options: "i" } },
                { description: { $regex: safe, $options: "i" } },
                { tags: { $regex: safe, $options: "i" } },
            ];
        }

        /* ── Sort ── */
        const sortMap = {
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
            "rating": { rating: -1 },
            "discount": { mrp: -1 },
            "newest": { createdAt: -1 },
        };
        const sortObj = sortMap[sort] || { createdAt: -1 };

        /* ── Query ── */
        const [products, total] = await Promise.all([
            Product.find(query)
                .select(PRODUCT_SELECT)
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(query),
        ]);

        const result = {
            products,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            limit: limitNum,
        };

        setCache(cacheKey, result, TTL.PRODUCTS_LIST);
        res.json(result);

    } catch (err) {
        console.error("[Product] getAllProducts:", err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

/* ══════════════════════════════════════════════════════
   GET HOMEPAGE DATA — optimized, no full scan
   GET /api/products/homepage
══════════════════════════════════════════════════════ */
export const getHomepageData = async (req, res) => {
    try {
        const cacheKey = KEYS.homepage();
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const now = new Date();

        // ✅ Parallel, targeted queries — no full collection scan
        const [newArrivals, dealProducts, categoryAgg, statsAgg] = await Promise.all([

            // New arrivals — latest 8 in-stock
            Product.find({ inStock: true })
                .select(PRODUCT_SELECT)
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),

            // Active deals
            Product.find({ isDeal: true, dealEndsAt: { $gt: now }, inStock: true })
                .select(PRODUCT_SELECT)
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),

            // ✅ Categories via aggregation — no JS loop over all products
            Product.aggregate([
                { $match: { inStock: true } },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                        image: { $first: { $arrayElemAt: ["$images.url", 0] } },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id",
                        slug: { $toLower: { $replaceAll: { input: "$_id", find: " ", replacement: "-" } } },
                        count: 1,
                        image: 1,
                    }
                },
                { $sort: { count: -1 } },
            ]),

            // ✅ Stats via aggregation — single pass
            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        inStock: { $sum: { $cond: ["$inStock", 1, 0] } },
                        categories: { $addToSet: "$category" },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalProducts: "$total",
                        inStockProducts: "$inStock",
                        totalCategories: { $size: "$categories" },
                    }
                },
            ]),
        ]);

        // Featured — one product per category from newArrivals
        const featuredMap = {};
        [...newArrivals, ...dealProducts].forEach(p => {
            if (p.category && !featuredMap[p.category]) featuredMap[p.category] = p;
        });

        const result = {
            newArrivals,
            deals: dealProducts,
            categories: categoryAgg,
            featured: Object.values(featuredMap),
            stats: statsAgg[0] || { totalProducts: 0, inStockProducts: 0, totalCategories: 0 },
        };

        setCache(cacheKey, result, TTL.HOMEPAGE);
        res.json(result);

    } catch (err) {
        console.error("[Product] getHomepageData:", err);
        res.status(500).json({ message: "Failed to fetch homepage data" });
    }
};

/* ══════════════════════════════════════════════════════
   GET SUGGESTED PRODUCTS — DB aggregation, not JS filter
   GET /api/products/suggested
══════════════════════════════════════════════════════ */
export const getSuggestedProducts = async (req, res) => {
    try {
        const cacheKey = KEYS.suggested();
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const now = new Date();

        // ✅ DB-level scoring + category limiting via aggregation
        const results = await Product.aggregate([
            { $match: { inStock: true } },

            // Compute score fields
            {
                $addFields: {
                    discountPct: {
                        $cond: {
                            if: { $and: [{ $gt: ["$mrp", 0] }, { $gt: ["$mrp", "$price"] }] },
                            then: {
                                $multiply: [
                                    { $divide: [{ $subtract: ["$mrp", "$price"] }, "$mrp"] },
                                    100,
                                ]
                            },
                            else: 0,
                        }
                    },
                    isDealActive: {
                        $and: [
                            { $eq: ["$isDeal", true] },
                            { $gt: ["$dealEndsAt", now] },
                        ]
                    },
                }
            },

            // Score = discount*0.6 + rating*5 + deal bonus 15
            {
                $addFields: {
                    _score: {
                        $add: [
                            { $multiply: ["$discountPct", 0.6] },
                            { $multiply: ["$rating", 5] },
                            { $cond: ["$isDealActive", 15, 0] },
                        ]
                    }
                }
            },

            { $sort: { _score: -1 } },

            // Pick top 3 per category using $group trick
            {
                $group: {
                    _id: "$category",
                    products: { $push: "$$ROOT" },
                }
            },
            {
                $project: {
                    products: { $slice: ["$products", 3] }
                }
            },
            { $unwind: "$products" },
            { $replaceRoot: { newRoot: "$products" } },

            { $limit: 16 },

            // Clean up internal fields
            {
                $project: {
                    _score: 0,
                    discountPct: 0,
                    isDealActive: 0,
                }
            },

            // Select only needed fields
            {
                $project: {
                    name: 1, price: 1, mrp: 1,
                    slug: 1, category: 1, images: 1,
                    rating: 1, numReviews: 1,
                    isCustomizable: 1, stock: 1, inStock: 1,
                    isDeal: 1, dealEndsAt: 1, dealTag: 1,
                    createdAt: 1,
                }
            },
        ]);

        setCache(cacheKey, results, TTL.SUGGESTED);
        res.json(results);

    } catch (err) {
        console.error("[Product] getSuggestedProducts:", err);
        res.status(500).json({ message: "Failed to fetch suggested products" });
    }
};

/* ══════════════════════════════════════════════════════
   GET DEALS — cached
   GET /api/products/deals
══════════════════════════════════════════════════════ */
export const getDeals = async (req, res) => {
    try {
        const cacheKey = KEYS.deals();
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const deals = await Product.find({
            isDeal: true,
            dealEndsAt: { $gt: new Date() },
            inStock: true,
        })
            .select(PRODUCT_SELECT)
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        setCache(cacheKey, deals, TTL.DEALS);
        res.json(deals);

    } catch (err) {
        console.error("[Product] getDeals:", err);
        res.status(500).json({ message: "Failed to fetch deals" });
    }
};

/* ══════════════════════════════════════════════════════
   GET SINGLE PRODUCT — cached by slug or id
   GET /api/products/:id
══════════════════════════════════════════════════════ */
export const getSingleProduct = async (req, res) => {
    try {
        const cacheKey = KEYS.singleProduct(req.params.id);
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const product = await findProduct(req.params.id).lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        setCache(cacheKey, product, TTL.SINGLE_PRODUCT);
        res.json(product);

    } catch (err) {
        console.error("[Product] getSingleProduct:", err);
        res.status(500).json({ message: "Failed to fetch product" });
    }
};

/* ══════════════════════════════════════════════════════
   GET RELATED PRODUCTS — cached
   GET /api/products/:id/related
══════════════════════════════════════════════════════ */
export const getRelatedProducts = async (req, res) => {
    try {
        const cacheKey = `products:related:${req.params.id}`;
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const product = await findProduct(req.params.id).select("category _id").lean();
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const related = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            inStock: true,
        })
            .select("name price mrp slug category images rating numReviews isCustomizable stock inStock isDeal dealEndsAt")
            .limit(10)
            .lean();

        setCache(cacheKey, related, TTL.PRODUCTS_LIST);
        res.json(related);

    } catch (err) {
        console.error("[Product] getRelatedProducts:", err);
        res.status(500).json({ message: "Failed to fetch related products" });
    }
};

/* ══════════════════════════════════════════════════════
   CREATE PRODUCT (ADMIN)
   ✅ Invalidates cache on success
══════════════════════════════════════════════════════ */
export const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, mrp, category,
            isCustomizable, tags, sizes, highlights, stock,
            isDeal, dealEndsAt, dealTag,
        } = req.body;

        if (!name?.trim() || !price || !category)
            return res.status(400).json({ message: "Name, price and category are required" });

        if (Number(price) <= 0)
            return res.status(400).json({ message: "Price must be greater than 0" });

        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: "At least one image is required" });

        const images = req.files.map(file => ({
            url: optimizeUrl(file.path, 800),
            public_id: file.filename,
        }));

        let parsedSizes = [];
        let parsedHighlights = {};
        try { if (sizes) parsedSizes = JSON.parse(sizes); } catch { }
        try { if (highlights) parsedHighlights = JSON.parse(highlights); } catch { }

        const stockQty = Math.max(0, Number(stock) || 0);
        const mrpValue = parseMrp(mrp, price);
        const isDealBool = isDeal === true || isDeal === "true";

        const product = await Product.create({
            name: name.trim(),
            description: description?.trim() || "",
            price: Number(price),
            mrp: mrpValue,
            category: normalizeCategory(category),
            images,
            isCustomizable: isCustomizable === true || isCustomizable === "true",
            tags: tags ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [],
            sizes: parsedSizes,
            highlights: parsedHighlights,
            stock: stockQty,
            inStock: stockQty > 0,
            isDeal: isDealBool,
            dealEndsAt: isDealBool && dealEndsAt ? new Date(dealEndsAt) : null,
            dealTag: dealTag?.trim() || "",
        });

        // ✅ Invalidate all list/homepage caches
        invalidateProductCache();

        res.status(201).json(product);

    } catch (err) {
        console.error("[Product] createProduct:", err);
        res.status(500).json({ message: err.message || "Failed to create product" });
    }
};

/* ══════════════════════════════════════════════════════
   UPDATE PRODUCT (ADMIN)
   ✅ Invalidates cache on success
══════════════════════════════════════════════════════ */
export const updateProduct = async (req, res) => {
    try {
        const product = await findProduct(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        const updateData = { ...req.body };

        if (updateData.category) updateData.category = normalizeCategory(updateData.category);
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.mrp !== undefined) updateData.mrp = parseMrp(updateData.mrp, updateData.price ?? product.price);
        if (updateData.tags) updateData.tags = updateData.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        if (updateData.isCustomizable !== undefined) updateData.isCustomizable = updateData.isCustomizable === true || updateData.isCustomizable === "true";
        if (updateData.stock !== undefined) {
            updateData.stock = Math.max(0, Number(updateData.stock) || 0);
            updateData.inStock = updateData.stock > 0;
        }
        if (updateData.isDeal !== undefined) updateData.isDeal = updateData.isDeal === true || updateData.isDeal === "true";
        if (updateData.dealEndsAt !== undefined) updateData.dealEndsAt = updateData.dealEndsAt ? new Date(updateData.dealEndsAt) : null;
        if (updateData.isDeal === false) updateData.dealEndsAt = null;

        try { if (updateData.sizes) updateData.sizes = JSON.parse(updateData.sizes); } catch { updateData.sizes = []; }
        try { if (updateData.highlights) updateData.highlights = JSON.parse(updateData.highlights); } catch { updateData.highlights = {}; }

        if (req.files?.length > 0) {
            for (const img of product.images) await safeDestroy(img.public_id);
            updateData.images = req.files.map(file => ({
                url: optimizeUrl(file.path, 800),
                public_id: file.filename,
            }));
        }

        // Handle name change separately (triggers slug regeneration)
        if (updateData.name && updateData.name !== product.name) {
            product.name = updateData.name;
            await product.save();
            delete updateData.name;
        }

        const updated = await Product.findByIdAndUpdate(
            product._id, updateData,
            { new: true, runValidators: true }
        );

        // ✅ Invalidate this product + all lists
        invalidateProductCache(product._id.toString());

        res.json(updated);

    } catch (err) {
        console.error("[Product] updateProduct:", err);
        res.status(500).json({ message: "Failed to update product" });
    }
};

/* ══════════════════════════════════════════════════════
   DELETE PRODUCT (ADMIN)
   ✅ Invalidates cache on success
══════════════════════════════════════════════════════ */
export const deleteProduct = async (req, res) => {
    try {
        const product = await findProduct(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });

        for (const img of product.images) await safeDestroy(img.public_id);
        await product.deleteOne();

        // ✅ Invalidate all caches
        invalidateProductCache(product._id.toString());

        res.json({ message: "Product removed successfully" });

    } catch (err) {
        console.error("[Product] deleteProduct:", err);
        res.status(500).json({ message: "Failed to delete product" });
    }
};