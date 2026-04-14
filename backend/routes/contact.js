import express from "express";
import Contact from "../models/Contact.js";
import Newsletter from "../models/Newsletter.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { sendEmail } from "../utils/emailService.js"; // ✅ Nodemailer service

const router = express.Router();

/* ==============================================
   POST /api/contact
   User se contact form submit
============================================== */
router.post("/", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 1. Save in DB
        await Contact.create({ name, email, phone, subject, message });

        // 2. Send Email via Nodemailer
        await sendEmail({
            to: "dhananjay072007@gmail.com",
            subject: `📩 New Contact: ${subject || "No Subject"} — ${name}`,
            html: `
                <div style="font-family:sans-serif; max-width:500px; margin:auto; border:1px solid #22c55e; border-radius:10px; overflow:hidden;">
                    <div style="background:#22c55e; padding:16px 24px;">
                        <h2 style="color:white; margin:0;">New Contact Form Submission</h2>
                    </div>
                    <div style="padding:24px; background:#fff;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
                        <p><strong>Subject:</strong> ${subject || "Not provided"}</p>
                        <hr style="border:none; border-top:1px solid #eee; margin:16px 0;" />
                        <p><strong>Message:</strong></p>
                        <p style="background:#f0fdf4; padding:12px; border-radius:8px;">
                            ${message}
                        </p>
                    </div>
                    <div style="background:#f0fdf4; padding:12px 24px; text-align:center;">
                        <small style="color:#6b7280;">UrbeXon — Contact System</small>
                    </div>
                </div>
            `
        });

        res.status(200).json({ success: true });

    } catch (err) {
        console.error("❌ Contact route error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==============================================
   GET /api/contact
   Admin — sab queries fetch
============================================== */
router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const queries = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(queries);

    } catch (err) {
        console.error("❌ GET CONTACTS ERROR:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==============================================
   PATCH /api/contact/:id/read
   Admin — mark as read
============================================== */
router.patch("/:id/read", protect, adminOnly, async (req, res) => {
    try {
        await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });

    } catch (err) {
        console.error("❌ MARK READ ERROR:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

/* ==============================================
   POST /api/contact/newsletter
   Subscribe to newsletter
============================================== */
router.post("/newsletter", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Valid email required" });
        }
        await Newsletter.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { email: email.toLowerCase().trim() },
            { upsert: true }
        );
        res.json({ success: true, message: "Subscribed successfully!" });
    } catch (err) {
        console.error("[newsletter]", err.message);
        res.status(500).json({ success: false, message: "Failed to subscribe" });
    }
});

export default router;