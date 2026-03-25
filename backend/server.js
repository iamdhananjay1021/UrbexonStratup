import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

import connectDB from "./config/db.js";

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

dotenv.config();

/* ─────────────────────────────
   INIT
───────────────────────────── */
const app = express();
connectDB();

app.set("trust proxy", 1);

/* ─────────────────────────────
   SECURITY (ENTERPRISE LEVEL)
───────────────────────────── */
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

/* ─────────────────────────────
   CORS (FIXED FOR urbexon.in)
───────────────────────────── */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",

    "https://urbexon.in",
    "https://www.urbexon.in",
    "https://admin.urbexon.in"
];

if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",").forEach((o) => {
        const origin = o.trim();
        if (origin && !allowedOrigins.includes(origin)) {
            allowedOrigins.push(origin);
        }
    });
}

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);

            console.warn("❌ CORS BLOCKED:", origin);
            return callback(new Error("CORS not allowed"));
        },
        credentials: true,
    })
);

/* ─────────────────────────────
   RATE LIMIT (ANTI ABUSE)
───────────────────────────── */
app.use(
    "/api",
    rateLimit({
        windowMs: 60 * 1000,
        max: 120,
        message: { message: "Too many requests. Slow down." },
    })
);

app.use(
    "/api/auth/login",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { message: "Too many login attempts. Try later." },
    })
);

app.use(
    "/api/auth/register",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { message: "Too many register attempts. Try later." },
    })
);

/* ─────────────────────────────
   BODY PARSER
───────────────────────────── */
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────
   PERFORMANCE
───────────────────────────── */
app.use(compression());

/* ─────────────────────────────
   LOGGER
───────────────────────────── */
if (process.env.NODE_ENV === "production") {
    app.use(morgan("combined"));
} else {
    app.use(morgan("dev"));
}

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Urbexon API 🚀",
        env: process.env.NODE_ENV,
        uptime: process.uptime(),
        time: new Date().toISOString(),
    });
});

/* ─────────────────────────────
   ROUTES
───────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoute);
app.use("/api/invoice", invoiceRoutes);

/* ─────────────────────────────
   404 HANDLER
───────────────────────────── */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

/* ─────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────── */
app.use((err, _req, res, _next) => {
    console.error("🔥 ERROR:", err);

    if (err.message === "CORS not allowed") {
        return res.status(403).json({
            success: false,
            message: err.message,
        });
    }

    if (err instanceof SyntaxError) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON payload",
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message,
    });
});

/* ─────────────────────────────
   SERVER START
───────────────────────────── */
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
});

/* ─────────────────────────────
   GRACEFUL SHUTDOWN
───────────────────────────── */
process.on("SIGINT", () => {
    console.log("🛑 Graceful shutdown...");
    server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received...");
    server.close(() => process.exit(0));
});

export default app;