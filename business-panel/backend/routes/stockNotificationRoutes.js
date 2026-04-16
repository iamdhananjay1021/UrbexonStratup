import express from "express";
import rateLimit from "express-rate-limit";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import {
    subscribeStockNotification,
    checkStockSubscription,
    getStockSubscriberCount,
} from "../controllers/stockNotificationController.js";

const router = express.Router();

// Rate limit notify subscriptions (10 per 15min per IP)
const notifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many notification requests, try again later",
});

// Public
router.post("/subscribe", notifyLimiter, subscribeStockNotification);
router.get("/check/:productId", checkStockSubscription);

// Admin
router.get("/count/:productId", protect, adminOnly, getStockSubscriberCount);

export default router;
