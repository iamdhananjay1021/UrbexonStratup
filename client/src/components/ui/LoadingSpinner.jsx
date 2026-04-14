/**
 * LoadingSpinner.jsx — Reusable loading states
 */

export const Spinner = ({ size = 36, color = "#c9a84c" }) => (
    <div style={{
        width: size, height: size,
        border: `3px solid ${color}22`,
        borderTop: `3px solid ${color}`,
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
        flexShrink: 0,
    }}>
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
);

export const PageLoader = ({ message = "Loading..." }) => (
    <div style={{
        minHeight: "60vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: "#f7f4ee",
    }}>
        <Spinner />
        <p style={{ fontSize: 14, color: "#94a3b8", fontFamily: "sans-serif" }}>{message}</p>
    </div>
);

export const InlineLoader = ({ message = "Loading..." }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0" }}>
        <Spinner size={20} />
        <span style={{ fontSize: 13, color: "#94a3b8" }}>{message}</span>
    </div>
);

export const ButtonLoader = () => (
    <div style={{
        width: 16, height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #fff",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        display: "inline-block",
    }}>
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
);
