/**
 * sendWhatsApp.js
 * ─────────────────────────────────────────────────────────
 * Re-exports from whatsapp.js for backwards compatibility.
 * All WhatsApp logic lives in whatsapp.js
 * ─────────────────────────────────────────────────────────
 */

export {
    generateAdminWhatsAppLink,
    generateUserWhatsAppLink,
    sendWhatsAppMessage,
} from "./whatsapp.js";