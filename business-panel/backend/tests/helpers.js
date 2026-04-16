/**
 * tests/helpers.js — Shared test utilities
 */
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

dotenv.config({ path: ".env.test" });

import authRoutes     from "../routes/authRoutes.js";
import productRoutes  from "../routes/productRoutes.js";
import orderRoutes    from "../routes/orderRoutes.js";
import { notFound, errorHandler } from "../middlewares/errorMiddleware.js";

export const buildApp = () => {
    const app = express();
    app.set("trust proxy", 1);
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(xss());
    app.use(mongoSanitize());
    app.use(cors({ origin: "*" }));
    app.use(express.json());
    app.use("/api/auth",     authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/orders",   orderRoutes);
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

export const connectTestDB = async () => {
    if (mongoose.connection.readyState !== 0) return;
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/urbexon_test");
};

export const disconnectTestDB = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
};

export const createTestUser = async (overrides = {}) => {
    const User = (await import("../models/User.js")).default;
    const bcrypt = (await import("bcryptjs")).default;
    const hashed = await bcrypt.hash("Password123!", 10);
    return User.create({
        name:            overrides.name     || "Test User",
        email:           overrides.email    || `test_${Date.now()}@urbexon.com`,
        phone:           overrides.phone    || "9876543210",
        password:        hashed,
        role:            overrides.role     || "user",
        isEmailVerified: true,
    });
};
