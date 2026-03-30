/**
 * server.js
 * ✅ All existing security preserved (helmet, xss, cors, rateLimit)
 * ✅ Separate admin limiter for /auth/users (relaxed)
 * ✅ Auth login/register still strict (brute force protection)
 * ✅ Added /health endpoint with cache stats
 * ✅ Graceful shutdown on SIGTERM (Railway/Render compatible)
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import xss from "xss-clean";

import connectDB from "./config/db.js";
import { getCacheStats } from "./utils/Cache.js";
import { getStreamStats } from "./utils/realtimeHub.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoute from "./routes/contact.js";
import invoiceRoutes from "./routes/Invoiceroutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import shiprocketRoutes from "./routes/shiprocketRoutes.js";
import vendorRoutes from "./routes/VendorRoutes/vendorRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
const app = express();
connectDB();

app.set("trust proxy", 1);

/* ══════════════════════════════════════════════
   SECURITY
══════════════════════════════════════════════ */
app.use(helmet());
app.use(xss());

/* ══════════════════════════════════════════════
   CORS
══════════════════════════════════════════════ */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://urbexon.in",
    "https://www.urbexon.in",
    "https://admin.urbexon.in",
    "https://urban-dev.vercel.app", // ✅ ADD THIS
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn("❌ CORS BLOCKED:", origin);
        return callback(new Error("CORS not allowed"));
    },
    credentials: true,
}));

/* ══════════════════════════════════════════════
   RATE LIMITS
══════════════════════════════════════════════ */

// ✅ Auth login/register — strict (brute force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min window
    max: 30,                    // 30 attempts per 15 min (was 20)
    message: { success: false, message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ✅ Admin panel API calls — relaxed (dashboard, users list, etc.)
const adminLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 min window
    max: 200,                   // 200 req/min — enough for admin dashboard
    message: { success: false, message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Only apply to GET requests on admin-use routes
        return req.method !== "GET";
    },
});

// Public product/listing routes — generous
const publicLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 min
    max: 200,                   // 200 req/min per IP
    standardHeaders: true,
    legacyHeaders: false,
});

// General API fallback
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});

/* ══════════════════════════════════════════════
   BODY PARSER
   ⚠️ Webhook must get raw body BEFORE json parser
══════════════════════════════════════════════ */
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ══════════════════════════════════════════════
   PERFORMANCE
══════════════════════════════════════════════ */
app.use(compression());

/* ══════════════════════════════════════════════
   LOGGER
══════════════════════════════════════════════ */
app.use(
    process.env.NODE_ENV === "production"
        ? morgan("combined")
        : morgan("dev")
);

/* ══════════════════════════════════════════════
   HEALTH CHECK
══════════════════════════════════════════════ */
app.get("/", (_req, res) => {
    res.json({ success: true, message: "Urbexon API 🚀" });
});

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage().heapUsed,
        cache: getCacheStats(),
        realtime: getStreamStats(),
        timestamp: new Date().toISOString(),
    });
});

/* ══════════════════════════════════════════════
   ROUTES
   ✅ /api/auth uses adminLimiter for GET (admin panel)
      and authLimiter for POST (login/register)
══════════════════════════════════════════════ */

// ✅ Auth: GET requests (admin fetching users) use relaxed adminLimiter
//          POST requests (login/register) use strict authLimiter
app.use("/api/auth", (req, res, next) => {
    if (req.method === "GET") return adminLimiter(req, res, next);
    return authLimiter(req, res, next);
});
app.use("/api/auth", authRoutes);

app.use("/api/products", publicLimiter, productRoutes);
app.use("/api/banners", publicLimiter, bannerRoutes);
app.use("/api/categories", publicLimiter, categoryRoutes);
app.use("/api/reviews", publicLimiter, reviewRoutes);

app.use("/api/orders", generalLimiter, orderRoutes);
app.use("/api/addresses", generalLimiter, addressRoutes);
app.use("/api/payment", generalLimiter, paymentRoutes);
app.use("/api/contact", generalLimiter, contactRoute);
app.use("/api/invoice", generalLimiter, invoiceRoutes);
app.use("/api/uploads", generalLimiter, uploadRoutes);
app.use("/api/shiprocket", generalLimiter, shiprocketRoutes);
app.use("/api", vendorRoutes);

app.use(notFound);
app.use(errorHandler);

/* ══════════════════════════════════════════════
   404
══════════════════════════════════════════════ */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});

/* ══════════════════════════════════════════════
   GLOBAL ERROR HANDLER
══════════════════════════════════════════════ */
app.use((err, _req, res, _next) => {
    console.error("🔥 ERROR:", err.message);

    if (err.message === "CORS not allowed")
        return res.status(403).json({ success: false, message: err.message });

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message,
    });
});

/* ══════════════════════════════════════════════
   SERVER START + GRACEFUL SHUTDOWN
══════════════════════════════════════════════ */
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Urbexon API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received — shutting down gracefully");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});

process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
    process.exit(1);
});
