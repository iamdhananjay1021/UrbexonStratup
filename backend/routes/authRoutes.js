import express from "express";
import {
    register,
    login,
    adminLogin,
    verifyOtp,
    resendOtp,
    getProfile,
    updateProfile,
    changePassword,
    saveLocation,
    getAllUsers,
    forgotPassword,
    resetPassword,
    adminForgotPassword,
    adminResetPassword,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ── User Auth (Public) ──────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// ── User Password Reset ─────────────────────────────────────
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ── Admin Login ─────────────────────────────────────────────
router.post("/admin/login", adminLogin);

// ── Admin Password Reset ────────────────────────────────────
router.post("/admin/forgot-password", adminForgotPassword);
router.post("/admin/reset-password/:token", adminResetPassword);

// ── Protected User Routes ───────────────────────────────────
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);       // ✅ NEW — edit name/phone
router.put("/change-password", protect, changePassword);      // ✅ NEW — change password
router.post("/save-location", protect, saveLocation);

// ── Admin Only ──────────────────────────────────────────────
router.get("/users", protect, adminOnly, getAllUsers);

export default router;