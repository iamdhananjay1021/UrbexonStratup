/**
 * notificationController.js — Admin Notifications CRUD
 */
import Notification from "../../models/Notification.js";

/* ── GET notifications (paginated) ── */
export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const filter = {};
        if (unreadOnly === "true") filter.isRead = false;

        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Math.min(50, Number(limit)))
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ isRead: false }),
        ]);

        res.json({ notifications, total, unreadCount, page: Number(page) });
    } catch (err) {
        console.error("[getNotifications]", err);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

/* ── GET unread count only (lightweight) ── */
export const getUnreadCount = async (_req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        res.json({ unreadCount: count });
    } catch (err) {
        console.error("[getUnreadCount]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ── MARK single as read ── */
export const markAsRead = async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ success: false, message: "Not found" });
        res.json(notif);
    } catch (err) {
        console.error("[markAsRead]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ── MARK ALL as read ── */
export const markAllAsRead = async (_req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true, message: "All marked as read" });
    } catch (err) {
        console.error("[markAllAsRead]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ── DELETE old notifications (30+ days) ── */
export const cleanOldNotifications = async (_req, res) => {
    try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Notification.deleteMany({ createdAt: { $lt: cutoff }, isRead: true });
        res.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        console.error("[cleanOldNotifications]", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};

/* ── CREATE notification (internal helper — used by other controllers) ── */
export const createNotification = async ({ type, title, message, icon, link, meta }) => {
    try {
        return await Notification.create({ type, title, message, icon, link, meta });
    } catch (err) {
        console.error("[createNotification]", err);
        return null;
    }
};
