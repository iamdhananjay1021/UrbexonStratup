/**
 * Urbexon Delivery — Design Tokens & Helpers
 */
export const G = {
    brand: "#1DB954",
    brandDark: "#16a34a",
    bg: "#f8fafb",
    white: "#ffffff",
    navy: "#0f172a",
    text: "#111827",
    textSub: "#6b7280",
    textMuted: "#9ca3af",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    green50: "#f0fdf4",
    green100: "#dcfce7",
    green600: "#16a34a",
    red50: "#fef2f2",
    red600: "#dc2626",
    amber50: "#fffbeb",
    amber600: "#d97706",
    blue50: "#eff6ff",
    blue600: "#2563eb",
};

export const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()} • ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};
