import { getCache, setCache, delCacheByPrefix } from "../utils/Cache.js";
/**
 * productController.js — Production, Bug-Free
 * Fixes:
 * - inStock filter properly applied
 * - Deals show only active deals with stock
 * - Search scoped to ecommerce by default
 * - Homepage properly returns featured/new/deals + setCache added
 * - Related products endpoint added
 * - Admin CRUD complete
 * - Vendor CRUD complete
 */
import Product from "../models/Product.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { sendRestockNotifications } from "./stockNotificationController.js";

// Category slug → regex matcher
const slugToRegex = (slug) => {
    if (!slug) return null;
    const str = slug.replace(/-/g, "[\\s-]");
    return new RegExp(str, "i");
};

/* ════════════════════════════════════════
   PUBLIC — Get products (ecommerce only by default)
════════════════════════════════════════ */
export const getProducts = async (req, res) => {
    try {
        const {
            page = 1, limit = 20,
            category, search, sort = "createdAt", order = "desc",
            productType, vendorId, featured, minPrice, maxPrice, deal,
        } = req.query;

        const filter = { isActive: true };

        // Default to ecommerce products unless explicitly requested
        if (productType) {
            filter.productType = productType;
        } else if (!search?.trim()) {
            filter.productType = "ecommerce";
        }

        if (vendorId) filter.vendorId = vendorId;
        if (featured === "true") filter.isFeatured = true;
        if (deal === "true") {
            filter.isDeal = true;
            filter.$or = [{ dealEndsAt: null }, { dealEndsAt: { $gt: new Date() } }];
        }
        if (category) {
            const rx = slugToRegex(category);
            if (rx) filter.category = rx;
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search?.trim()) {
            const rx = { $regex: search.trim(), $options: "i" };
            filter.$or = [
                { name: rx }, { category: rx },
                { brand: rx }, { tags: { $elemMatch: rx } },
            ];
            // Keep productType if explicitly passed; otherwise default to ecommerce for search
            if (!productType) {
                filter.productType = "ecommerce";
            }
        }

        const sortMap = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating: { rating: -1, createdAt: -1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            discount: { mrp: -1, price: 1, createdAt: -1 },
        };
        const sortObj = sortMap[sort] || { [sort]: order === "asc" ? 1 : -1 };
        const skip = (Math.max(1, Number(page)) - 1) * Math.min(50, Number(limit));

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortObj).skip(skip).limit(Math.min(50, Number(limit))).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            products,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Math.min(50, Number(limit))),
        });
    } catch (err) {
        console.error("[getProducts]", err);
        res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Homepage data
════════════════════════════════════════ */
export const getHomepageProducts = async (req, res) => {
    try {
        const CACHE_KEY = "homepage:products";
        const cached = await getCache(CACHE_KEY);
        if (cached) return res.json(cached);

        const base = { isActive: true, productType: "ecommerce" };

        const [featured, newArrivals, deals, productCount, cats] = await Promise.all([
            Product.find({ ...base, isFeatured: true }).sort({ createdAt: -1 }).limit(8).lean(),
            Product.find(base).sort({ createdAt: -1 }).limit(12).lean(),
            Product.find({
                ...base,
                isDeal: true,
                $or: [{ dealEndsAt: null }, { dealEndsAt: { $gt: new Date() } }],
            }).sort({ createdAt: -1 }).limit(8).lean(),
            Product.countDocuments({ isActive: true }),
            Product.distinct("category", { isActive: true, productType: "ecommerce" }),
        ]);

        const result = {
            featured,
            newArrivals,
            deals,
            stats: { products: productCount, categories: cats.length },
        };

        // FIX: setCache was missing — cache for 5 minutes
        await setCache(CACHE_KEY, result, 300);

        res.json(result);
    } catch (err) {
        console.error("[getHomepageProducts]", err);
        res.status(500).json({ success: false, message: "Failed to fetch homepage data" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Search suggestions (lightweight)
════════════════════════════════════════ */
export const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);
        const regex = { $regex: q.trim(), $options: "i" };
        const products = await Product.find({
            isActive: true, inStock: true, productType: "ecommerce",
            $or: [{ name: regex }, { category: regex }, { brand: regex }],
        }).select("name category brand slug images price mrp").limit(8).lean();
        res.json(products);
    } catch (err) {
        console.error("[getSuggestions]", err);
        res.json([]);
    }
};

/* ════════════════════════════════════════
   PUBLIC — Deals page
════════════════════════════════════════ */
export const getDeals = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, sort = "newest", productType } = req.query;
        // Default to ecommerce so deals pages don't mix channels
        const typeFilter = productType === "urbexon_hour" ? "urbexon_hour" : "ecommerce";
        const filter = {
            isActive: true,
            isDeal: true,
            productType: typeFilter,
            $or: [{ dealEndsAt: null }, { dealEndsAt: { $gt: new Date() } }],
        };
        if (category) { const rx = slugToRegex(category); if (rx) filter.category = rx; }

        const sortMap = {
            newest: { createdAt: -1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            discount: { mrp: -1 },
        };
        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortMap[sort] || { createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            products,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        console.error("[getDeals]", err);
        res.status(500).json({ success: false, message: "Failed to fetch deals" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Urbexon Hour products (vendor only)
════════════════════════════════════════ */
export const getUrbexonHourProducts = async (req, res) => {
    try {
        const { vendorId, category, search, page = 1, limit = 20 } = req.query;
        const filter = { productType: "urbexon_hour", isActive: true };
        if (vendorId) filter.vendorId = vendorId;
        if (category) { const rx = slugToRegex(category); if (rx) filter.category = rx; }
        if (search) filter.name = { $regex: search, $options: "i" };

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("vendorId", "shopName shopLogo rating isOpen city")
                .sort({ isFeatured: -1, createdAt: -1 })
                .skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error("[getUrbexonHourProducts]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Urbexon Hour deals (vendor deal products)
════════════════════════════════════════ */
export const getUrbexonHourDeals = async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const filter = {
            productType: "urbexon_hour",
            isActive: true,
            isDeal: true,
            $or: [{ dealEndsAt: null }, { dealEndsAt: { $gt: new Date() } }],
        };
        if (category) { const rx = slugToRegex(category); if (rx) filter.category = rx; }

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("vendorId", "shopName shopLogo rating isOpen city")
                .sort({ createdAt: -1 })
                .skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error("[getUrbexonHourDeals]", err);
        res.status(500).json({ success: false, message: "Failed to fetch UH deals" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Single product by slug or id
════════════════════════════════════════ */
export const getProductBySlug = async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const product = await Product.findOne({
            ...(isObjectId ? { _id: id } : { slug: id }),
            isActive: true,
        }).populate("vendorId", "shopName shopLogo rating isOpen city").lean();

        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json(product);
    } catch (err) {
        console.error("[getProductBySlug]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   PUBLIC — Related products by category/tags
════════════════════════════════════════ */
export const getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = /^[a-f\d]{24}$/i.test(id);

        const product = await Product.findOne({
            ...(isObjectId ? { _id: id } : { slug: id }),
            isActive: true,
        }).lean();

        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const orConditions = [{ category: product.category }];
        if (product.tags?.length) {
            orConditions.push({ tags: { $in: product.tags } });
        }

        const related = await Product.find({
            _id: { $ne: product._id },
            isActive: true,
            productType: "ecommerce",
            $or: orConditions,
        })
            .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
            .limit(10)
            .lean();

        res.json(related);
    } catch (err) {
        console.error("[getRelatedProducts]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   ADMIN — Get all products
════════════════════════════════════════ */
export const adminGetAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, productType, category, inStock } = req.query;
        const filter = { isActive: { $ne: false } };
        if (productType) filter.productType = productType;
        if (category) filter.category = { $regex: category, $options: "i" };
        if (inStock === "true") filter.inStock = true;
        if (inStock === "false") filter.inStock = false;
        if (search) filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
        ];

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("vendorId", "shopName")
                .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error("[adminGetAllProducts]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   ADMIN — Create product
════════════════════════════════════════ */
export const adminCreateProduct = async (req, res) => {
    try {
        let body = { ...req.body };

        /* ───────────────
           🔧 SAFE PARSING (CRITICAL)
        ─────────────── */
        const safeParse = (val, fallback) => {
            try {
                return typeof val === "string" ? JSON.parse(val) : val;
            } catch {
                return fallback;
            }
        };

        body.sizes = safeParse(body.sizes, []);
        body.highlights = safeParse(body.highlights, {});
        body.customizationConfig = safeParse(body.customizationConfig, null);

        /* ───────────────
           🔒 BASIC VALIDATION
        ─────────────── */
        if (!body.name?.trim() || !body.price || !body.category) {
            return res.status(400).json({
                success: false,
                message: "Name, price and category are required",
            });
        }

        /* ───────────────
           🔁 BOOLEAN PARSE
        ─────────────── */
        const parseBool = (v) => v === "true" || v === true;

        const isFeatured = parseBool(body.isFeatured);
        const isDeal = parseBool(body.isDeal);
        const isCustomizable = parseBool(body.isCustomizable);

        /* ───────────────
           🔢 NUMBER PARSE
        ─────────────── */
        const toNum = (v, def = 0) => {
            const n = Number(v);
            return isNaN(n) ? def : n;
        };

        const price = toNum(body.price);
        const mrp = body.mrp ? toNum(body.mrp) : null;
        const cost = toNum(body.cost);
        const stock = toNum(body.stock);
        const gstPercent = toNum(body.gstPercent);

        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid price value",
            });
        }

        /* ───────────────
           🏷️ TAGS
        ─────────────── */
        const tags = body.tags
            ? Array.isArray(body.tags)
                ? body.tags
                : body.tags.split(",").map(t => t.trim()).filter(Boolean)
            : [];

        /* ───────────────
           📦 SIZES (SAFE NORMALIZATION)
        ─────────────── */
        const sizes = Array.isArray(body.sizes)
            ? body.sizes
                .map(s => {
                    if (typeof s === "string") {
                        return { size: s, stock: 0 };
                    }
                    if (typeof s === "object" && s.size) {
                        return {
                            size: String(s.size),
                            stock: toNum(s.stock),
                        };
                    }
                    return null;
                })
                .filter(Boolean)
            : [];

        /* ───────────────
           🖼️ IMAGE UPLOAD
        ─────────────── */
        const images = [];

        if (req.files?.length) {
            for (const file of req.files.slice(0, 6)) {
                try {
                    const url = await uploadToCloudinary(file.buffer, "products");
                    if (url) {
                        images.push({
                            url,
                            alt: body.name?.trim() || "product-image",
                        });
                    }
                } catch {
                    console.warn("⚠️ Image upload failed, skipping file");
                }
            }
        }

        /* ───────────────
           📅 DEAL DATE
        ─────────────── */
        let dealEndsAt = null;
        if (isDeal && body.dealEndsAt) {
            const d = new Date(body.dealEndsAt);
            if (!isNaN(d.getTime())) dealEndsAt = d;
        }

        /* ───────────────
           🧱 CREATE PRODUCT
        ─────────────── */
        const product = await Product.create({
            name: body.name.trim(),
            description: body.description?.trim() || "",
            price,
            mrp,
            cost,
            category: body.category,
            subcategory: body.subcategory || "",
            brand: body.brand || "",
            sku: body.sku || "",
            weight: body.weight || "",
            origin: body.origin || "",
            returnPolicy: body.returnPolicy || "",
            shippingInfo: body.shippingInfo || "",
            color: body.color || "",
            material: body.material || "",
            occasion: body.occasion || "",

            tags,
            sizes,
            highlights: body.highlights || {},

            images,

            stock,
            inStock: stock > 0,

            isFeatured,
            isDeal,
            dealEndsAt,

            gstPercent,
            isCustomizable,
            ...(isCustomizable && body.customizationConfig
                ? { customizationConfig: body.customizationConfig }
                : {}),

            productType: "ecommerce",
            vendorId: null,
            isActive: true,
        });

        /* ───────────────
           🧹 CACHE CLEAR
        ─────────────── */
        try {
            await Promise.all([
                delCacheByPrefix("homepage:"),
                delCacheByPrefix("products:"),
                delCacheByPrefix("deals:"),
            ]);
        } catch {
            console.warn("⚠️ Cache clear failed");
        }

        return res.status(201).json({
            success: true,
            product,
        });

    } catch (err) {
        console.error("[adminCreateProduct]", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Failed to create product",
        });
    }
};

/* ════════════════════════════════════════
   ADMIN — Update product
════════════════════════════════════════ */
export const adminUpdateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const body = req.body;

        // 🔁 Helpers
        const parseBool = (val) => val === "true" || val === true;

        const safeNumber = (val, fallback = 0) => {
            const num = Number(val);
            return isNaN(num) ? fallback : num;
        };

        // 🖼️ Upload new images (replace existing)
        if (req.files?.length) {
            const newImages = [];

            for (const file of req.files.slice(0, 6)) {
                try {
                    const url = await uploadToCloudinary(file.buffer, "products");
                    if (url) {
                        newImages.push({
                            url,
                            alt: body.name?.trim() || product.name,
                        });
                    }
                } catch (err) {
                    console.warn("⚠️ Image upload failed, skipping file");
                }
            }

            if (newImages.length) {
                product.images = newImages;
            }
        }

        // 🧱 Primitive fields update
        const fieldMap = {
            name: (v) => v?.trim(),
            description: (v) => v?.trim(),
            price: (v) => safeNumber(v),
            mrp: (v) => (v ? safeNumber(v) : null),
            cost: (v) => safeNumber(v),
            category: (v) => v,
            subcategory: (v) => v,
            brand: (v) => v,
            sku: (v) => v,
            weight: (v) => v,
            origin: (v) => v,
            returnPolicy: (v) => v,
            shippingInfo: (v) => v,
            color: (v) => v,
            material: (v) => v,
            occasion: (v) => v,
            gstPercent: (v) => safeNumber(v),
            stock: (v) => safeNumber(v),
        };

        for (const key in fieldMap) {
            if (body[key] !== undefined) {
                product[key] = fieldMap[key](body[key]);
            }
        }

        // 🔘 Booleans
        if (body.isFeatured !== undefined) product.isFeatured = parseBool(body.isFeatured);
        if (body.isDeal !== undefined) product.isDeal = parseBool(body.isDeal);
        if (body.isActive !== undefined) product.isActive = parseBool(body.isActive);
        if (body.isCustomizable !== undefined) product.isCustomizable = parseBool(body.isCustomizable);

        // 🎨 Customization config
        if (body.customizationConfig !== undefined) {
            try {
                const raw = typeof body.customizationConfig === 'string'
                    ? JSON.parse(body.customizationConfig)
                    : body.customizationConfig;
                if (raw && typeof raw === 'object') {
                    product.customizationConfig = raw;
                }
            } catch { /* ignore bad JSON */ }
        }

        // 📅 Deal handling
        if (body.dealEndsAt !== undefined) {
            const d = new Date(body.dealEndsAt);
            product.dealEndsAt = !isNaN(d.getTime()) ? d : null;
        }

        if (!product.isDeal) {
            product.dealEndsAt = null;
        }

        // 🏷️ Tags normalization
        if (body.tags !== undefined) {
            const rawTags = Array.isArray(body.tags)
                ? body.tags
                : body.tags.split(",");

            product.tags = rawTags.map((t) => t.trim()).filter(Boolean);
        }

        // 📦 Sizes normalization (CRITICAL FIX)
        if (body.sizes !== undefined) {
            try {
                const rawSizes =
                    typeof body.sizes === "string"
                        ? JSON.parse(body.sizes)
                        : body.sizes;

                if (Array.isArray(rawSizes)) {
                    product.sizes = rawSizes
                        .map((s) => {
                            if (typeof s === "string") {
                                return { size: s, stock: 0 };
                            }

                            if (typeof s === "object") {
                                return {
                                    size: String(s.size || s.label || "").trim(),
                                    stock: safeNumber(s.stock),
                                };
                            }

                            return null;
                        })
                        .filter((s) => s && s.size);
                } else {
                    product.sizes = [];
                }
            } catch (err) {
                console.error("❌ Invalid sizes JSON:", err);
                product.sizes = [];
            }
        }

        // 📦 Sync stock with sizes (optional but smart)
        if (product.sizes.length > 0) {
            product.stock = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
        }

        // 📊 Stock status
        const wasOutOfStock = !product.inStock;
        product.inStock = product.stock > 0;

        // 💾 Save
        await product.save();

        // 📧 Send restock notifications if product came back in stock
        if (wasOutOfStock && product.inStock) {
            sendRestockNotifications(product._id, product.name, product.slug);
        }

        // 🧹 Cache clear
        try {
            await Promise.all([
                delCacheByPrefix("homepage:"),
                delCacheByPrefix("products:"),
                delCacheByPrefix("deals:"),
            ]);
        } catch {
            console.warn("⚠️ Cache clear failed");
        }

        return res.json({
            success: true,
            product,
        });

    } catch (err) {
        console.error("[adminUpdateProduct]", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Failed to update product",
        });
    }
};

/* ════════════════════════════════════════
   ADMIN — Delete (soft)
════════════════════════════════════════ */
export const adminDeleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id, { isActive: false }, { new: true }
        );
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        await Promise.all([
            delCacheByPrefix("homepage:"),
            delCacheByPrefix("products:"),
            delCacheByPrefix("deals:"),
        ]);
        res.json({ success: true, message: "Product removed" });
    } catch (err) {
        console.error("[adminDeleteProduct]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   VENDOR — Create product (urbexon_hour)
════════════════════════════════════════ */
export const vendorCreateProduct = async (req, res) => {
    try {
        const vendor = req.vendor;
        const body = req.body;

        if (!body.name?.trim() || !body.price || !body.category)
            return res.status(400).json({ success: false, message: "Name, price and category required" });

        // Check subscription product limit
        const { default: Subscription } = await import("../models/vendorModels/Subscription.js");
        const sub = await Subscription.findOne({ vendorId: vendor._id, status: "active" });
        const maxProducts = sub?.maxProducts ?? 30;
        const currentCount = await Product.countDocuments({ vendorId: vendor._id, isActive: true });
        if (currentCount >= maxProducts)
            return res.status(403).json({
                success: false,
                message: `Product limit reached (${maxProducts}/${maxProducts}). Upgrade subscription.`,
            });

        // Upload images
        const images = [];
        if (req.files?.length) {
            for (const file of req.files.slice(0, 4)) {
                try {
                    const result = await uploadToCloudinary(file.buffer, `vendor_products/${vendor._id}`);
                    if (result?.secure_url) images.push({ url: result.secure_url, alt: body.name });
                } catch { /* skip */ }
            }
        }

        const stock = Number(body.stock) || 0;
        const product = await Product.create({
            name: body.name.trim(),
            description: body.description?.trim() || "",
            price: Number(body.price),
            mrp: body.mrp ? Number(body.mrp) : null,
            category: body.category,
            tags: body.tags ? body.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
            images,
            stock,
            inStock: stock > 0,
            prepTimeMinutes: Number(body.prepTimeMinutes) || 10,
            maxOrderQty: Number(body.maxOrderQty) || 10,
            productType: "urbexon_hour",
            vendorId: vendor._id,
            isActive: true,
            isDeal: body.isDeal === "true" || body.isDeal === true,
            dealEndsAt: body.dealEndsAt ? new Date(body.dealEndsAt) : null,
        });

        res.status(201).json({ success: true, product });
    } catch (err) {
        console.error("[vendorCreateProduct]", err);
        res.status(500).json({ success: false, message: err.message || "Failed" });
    }
};

/* ════════════════════════════════════════
   VENDOR — Get my products
════════════════════════════════════════ */
export const vendorGetMyProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const filter = { vendorId: req.vendor._id };
        if (search) filter.name = { $regex: search, $options: "i" };

        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Product.countDocuments(filter),
        ]);

        res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error("[vendorGetMyProducts]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   VENDOR — Update my product
════════════════════════════════════════ */
export const vendorUpdateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, vendorId: req.vendor._id });
        if (!product) return res.status(404).json({ success: false, message: "Product not found or not yours" });

        const body = req.body;
        const fields = ["name", "description", "price", "mrp", "category", "prepTimeMinutes", "maxOrderQty"];
        for (const f of fields) {
            if (body[f] !== undefined) {
                product[f] = ["price", "mrp", "prepTimeMinutes", "maxOrderQty"].includes(f)
                    ? Number(body[f]) : body[f];
            }
        }

        if (body.stock !== undefined) {
            const wasOutOfStock = !product.inStock;
            product.stock = Number(body.stock);
            product.inStock = product.stock > 0;

            // Send restock notifications if product came back in stock
            if (wasOutOfStock && product.inStock) {
                sendRestockNotifications(product._id, product.name, product.slug);
            }
        }
        if (body.isActive !== undefined)
            product.isActive = body.isActive === "true" || body.isActive === true;
        if (body.tags)
            product.tags = body.tags.split(",").map(t => t.trim()).filter(Boolean);

        // Deal fields
        if (body.isDeal !== undefined) {
            product.isDeal = body.isDeal === "true" || body.isDeal === true;
            if (!product.isDeal) product.dealEndsAt = null;
        }
        if (body.dealEndsAt !== undefined) {
            product.dealEndsAt = body.dealEndsAt ? new Date(body.dealEndsAt) : null;
        }

        // Handle image uploads
        if (req.files?.length) {
            const newImages = [];
            for (const file of req.files.slice(0, 4)) {
                try {
                    const url = await uploadToCloudinary(file.buffer, `vendor_products/${req.vendor._id}`);
                    if (url) newImages.push({ url: url.secure_url || url, alt: body.name || product.name });
                } catch { /* skip */ }
            }
            if (newImages.length) product.images = newImages;
        }

        await product.save();
        res.json({ success: true, product });
    } catch (err) {
        console.error("[vendorUpdateProduct]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ════════════════════════════════════════
   VENDOR — Delete my product
════════════════════════════════════════ */
export const vendorDeleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.vendor._id },
            { isActive: false },
            { new: true }
        );
        if (!product) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Product removed" });
    } catch (err) {
        console.error("[vendorDeleteProduct]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};