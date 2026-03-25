import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import xss from "xss-clean";

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
   SECURITY (STABLE)
───────────────────────────── */
app.use(helmet());
app.use(xss()); // basic XSS protection

/* ─────────────────────────────
   CORS (urbexon.in READY)
───────────────────────────── */
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://urbexon.in",
    "https://www.urbexon.in",
    "https://admin.urbexon.in",
];

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
   RATE LIMIT
───────────────────────────── */
app.use(
    "/api",
    rateLimit({
        windowMs: 60 * 1000,
        max: 120,
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
app.use(
    process.env.NODE_ENV === "production"
        ? morgan("combined")
        : morgan("dev")
);

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Urbexon API 🚀",
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
        message: `Route not found: ${req.originalUrl}`,
    });
});

/* ─────────────────────────────
   ERROR HANDLER
───────────────────────────── */
app.use((err, _req, res, _next) => {
    console.error("🔥 ERROR:", err.message);

    if (err.message === "CORS not allowed") {
        return res.status(403).json({ success: false, message: err.message });
    }

    res.status(500).json({
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});