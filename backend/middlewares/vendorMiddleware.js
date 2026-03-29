import jwt from "jsonwebtoken";
import Vendor from "../models/vendorModels/Vendor.js";

// ══════════════════════════════════════════════════════════════
// Protect vendor routes — sets req.vendor
// ══════════════════════════════════════════════════════════════
export const protectVendor = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) return res.status(401).json({ message: "Not authorized. Please login." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id;

        const vendor = await Vendor.findOne({ userId, isDeleted: false }).select("-documents -bankDetails");
        if (!vendor) return res.status(404).json({ message: "Vendor profile not found. Please apply first." });

        req.vendor = vendor;
        req.user = { _id: userId };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
};

// ══════════════════════════════════════════════════════════════
// Require vendor to be approved
// ══════════════════════════════════════════════════════════════
export const requireApprovedVendor = (req, res, next) => {
    if (req.vendor?.status !== "approved") {
        return res.status(403).json({
            message: "Access denied. Your vendor account is not approved yet.",
            status: req.vendor?.status || "unknown",
        });
    }
    next();
};

// ══════════════════════════════════════════════════════════════
// Require active subscription
// ══════════════════════════════════════════════════════════════
export const requireActiveSubscription = (req, res, next) => {
    const sub = req.vendor?.subscription;
    if (!sub?.isActive) {
        return res.status(403).json({ message: "Your subscription is not active." });
    }
    if (sub.expiryDate && new Date() > new Date(sub.expiryDate)) {
        return res.status(403).json({ message: "Subscription expired. Please renew." });
    }
    next();
};