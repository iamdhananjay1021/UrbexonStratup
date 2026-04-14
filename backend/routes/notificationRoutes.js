/**
 * notificationRoutes.js — Admin Notification endpoints
 */
import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    cleanOldNotifications,
} from "../controllers/admin/notificationController.js";

const router = express.Router();

router.get("/admin/notifications", protect, adminOnly, getNotifications);
router.get("/admin/notifications/unread", protect, adminOnly, getUnreadCount);
router.put("/admin/notifications/read-all", protect, adminOnly, markAllAsRead);
router.put("/admin/notifications/:id/read", protect, adminOnly, markAsRead);
router.delete("/admin/notifications/clean", protect, adminOnly, cleanOldNotifications);

export default router;
