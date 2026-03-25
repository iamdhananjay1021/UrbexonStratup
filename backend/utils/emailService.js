import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY missing in .env");
}

const resend = new Resend(process.env.RESEND_API_KEY);

// localhost  → onboarding@resend.dev  (no domain verification needed)
// production → your actual domain email from .env
const isDev = process.env.NODE_ENV !== "production";
const FROM_EMAIL = isDev ? "onboarding@resend.dev" : process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME || "Urbexon Team";

// ══════════════════════════════════════════════
// CORE SEND — used internally, always returns
// ══════════════════════════════════════════════
export const sendEmail = async ({
    to,
    subject,
    html,
    fromName = FROM_NAME,
    label = "General",
}) => {
    if (!to || !to.includes("@")) {
        console.error(`❌ [${label}] Invalid email address: ${to}`);
        return { success: false, error: "Invalid email address" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `${fromName} <${FROM_EMAIL}>`,
            to,
            subject: subject.trim(),
            html,
        });

        if (error) {
            console.error(`❌ [${label}] Resend API error → ${to}:`, error.message);
            return { success: false, error: error.message };
        }

        console.log(`✅ [${label}] Email sent → ${to} | ID: ${data.id}`);
        return { success: true, messageId: data.id };

    } catch (err) {
        console.error(`❌ [${label}] Unexpected error → ${to}:`, err.message);
        return { success: false, error: err.message };
    }
};

// ══════════════════════════════════════════════
// FIRE-AND-FORGET — non-blocking wrapper
// Use this everywhere in controllers so the API
// responds instantly without waiting for email.
// ══════════════════════════════════════════════
export const sendEmailBackground = (options) => {
    // Intentionally NOT awaited — runs in background
    sendEmail(options).then((result) => {
        if (!result.success) {
            // Safe to log here; this runs after response is already sent
            console.error(`🔁 [Background] Email failed for ${options.to}:`, result.error);
            // Optional: push to a retry queue here if needed later
        }
    });
    // Returns immediately — does not block caller
};