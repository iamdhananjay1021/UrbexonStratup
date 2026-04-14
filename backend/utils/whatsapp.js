/**
 * whatsapp.js
 * ─────────────────────────────────────────────────────────
 * WhatsApp link generators — FREE, no API needed
 * Opens WhatsApp with pre-filled message (wa.me links)
 *
 * For real WhatsApp Business API (Meta Cloud API — free tier):
 *   Set WHATSAPP_PHONE_ID + WHATSAPP_TOKEN in .env
 *   and use sendWhatsAppMessage() below
 * ─────────────────────────────────────────────────────────
 */

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER || "918808485840"; // 91 + number

/* ══════════════════════════════════════════════════════
   1. ADMIN NOTIFICATION LINK
   Opens WhatsApp on admin's phone with order summary
══════════════════════════════════════════════════════ */
export const generateAdminWhatsAppLink = (order) => {
    if (!order?.items?.length) return "";

    const itemsText = order.items
        .map((item, i) => {
            const qty = Number(item.qty || 1);
            const price = Number(item.price || 0);
            return `${i + 1}. ${item.name} × ${qty} = ₹${(price * qty).toLocaleString("en-IN")}`;
        })
        .join("\n");

    const isCOD = order.payment?.method === "COD";

    const message = [
        `🛍️ *NEW ORDER — Urbexon*`,
        ``,
        `Order ID: #${order._id.toString().slice(-8).toUpperCase()}`,
        `Invoice: ${order.invoiceNumber || "—"}`,
        ``,
        `*Items:*`,
        itemsText,
        ``,
        `*Total: ₹${Number(order.totalAmount).toLocaleString("en-IN")}*`,
        `Payment: ${isCOD ? "Cash on Delivery" : "Online Paid ✅"}`,
        ``,
        `Customer: ${order.customerName}`,
        `Phone: ${order.phone}`,
        `Address: ${order.address}`,
        ``,
        `Status: ${order.orderStatus}`,
    ].join("\n");

    return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
};

/* ══════════════════════════════════════════════════════
   2. USER CONFIRMATION LINK
   Send user their order confirmation via WhatsApp
══════════════════════════════════════════════════════ */
export const generateUserWhatsAppLink = (order, status = "PLACED") => {
    if (!order?.phone) return "";

    const clean = order.phone.replace(/\D/g, "");
    const number = clean.startsWith("91") ? clean : `91${clean}`;

    const statusMessages = {
        PLACED: "has been placed successfully! 🎉",
        CONFIRMED: "has been confirmed. ✅",
        PACKED: "is packed and ready to ship. 📦",
        SHIPPED: "has been shipped! 🚚",
        OUT_FOR_DELIVERY: "is out for delivery today! 🏠",
        DELIVERED: "has been delivered. Thank you! 🙏",
        CANCELLED: "has been cancelled.",
    };

    const statusText = statusMessages[status] || "has been updated.";
    const trackLine = order.shipping?.trackingUrl
        ? `\nTrack: ${order.shipping.trackingUrl}`
        : "";

    const message = [
        `Hi ${order.customerName}! 👋`,
        ``,
        `Your Urbexon order *#${order._id.toString().slice(-8).toUpperCase()}* ${statusText}`,
        ``,
        `Amount: ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
        `Payment: ${order.payment?.method === "COD" ? "Cash on Delivery" : "Online Paid"}`,
        trackLine,
        ``,
        `For support: wa.me/${ADMIN_WHATSAPP}`,
        `— Team Urbexon 🛍️`,
    ].filter(l => l !== undefined).join("\n");

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

/* ══════════════════════════════════════════════════════
   3. META CLOUD API — Real WhatsApp message (FREE tier)
   Optional: only if WHATSAPP_PHONE_ID + WHATSAPP_TOKEN set
   Uses template messages (must be approved in Meta Business)
══════════════════════════════════════════════════════ */
export const sendWhatsAppMessage = async ({ to, templateName = "order_confirmation", components = [] }) => {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneId || !token) {
        console.warn("[WhatsApp] WHATSAPP_PHONE_ID or WHATSAPP_TOKEN not set — skipping");
        return { success: false, reason: "not_configured" };
    }

    const clean = String(to).replace(/\D/g, "");
    const number = clean.startsWith("91") ? clean : `91${clean}`;

    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: number,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en" },
                    components,
                },
            }),
            signal: AbortSignal.timeout(8_000),
        });

        const data = await res.json();
        if (data.error) {
            console.error("[WhatsApp] API error:", data.error);
            return { success: false, error: data.error };
        }

        console.log(`[WhatsApp] Sent template "${templateName}" to ${number}`);
        return { success: true, message_id: data.messages?.[0]?.id };
    } catch (err) {
        console.error("[WhatsApp] sendMessage error:", err.message);
        return { success: false, error: err.message };
    }
};