/**
 * ErrorMessage.jsx — Reusable error display components
 */

export const ErrorAlert = ({ message, onRetry, onDismiss }) => {
    if (!message) return null;
    return (
        <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 10,
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}>
            <span style={{ color: "#dc2626", fontSize: 16, flexShrink: 0 }}>✕</span>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#b91c1c", fontWeight: 500 }}>{message}</p>
                {onRetry && (
                    <button onClick={onRetry} style={{
                        marginTop: 8, background: "none", border: "none",
                        color: "#dc2626", fontSize: 12, cursor: "pointer",
                        textDecoration: "underline", padding: 0,
                    }}>
                        Try again
                    </button>
                )}
            </div>
            {onDismiss && (
                <button onClick={onDismiss} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fca5a5", fontSize: 16, lineHeight: 1,
                }}>✕</button>
            )}
        </div>
    );
};

export const EmptyState = ({ icon = "📭", title = "Nothing here", message = "", action }) => (
    <div style={{
        textAlign: "center", padding: "60px 20px",
        background: "#fff", borderRadius: 14,
        border: "1px solid #e8e4d9",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1740", marginBottom: 8 }}>{title}</h3>
        {message && <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>{message}</p>}
        {action && (
            <button onClick={action.onClick} style={{
                padding: "10px 24px", background: "#1a1740", border: "none",
                color: "#c9a84c", fontWeight: 700, fontSize: 13, borderRadius: 8, cursor: "pointer",
            }}>
                {action.label}
            </button>
        )}
    </div>
);

export const NetworkError = ({ onRetry }) => (
    <div style={{
        background: "#fff7ed", border: "1px solid #fed7aa",
        borderRadius: 10, padding: "16px 20px", textAlign: "center",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
        <p style={{ fontSize: 14, color: "#c2410c", fontWeight: 600, marginBottom: 4 }}>Connection Error</p>
        <p style={{ fontSize: 12, color: "#9a3412", marginBottom: 12 }}>Check your internet and try again</p>
        {onRetry && (
            <button onClick={onRetry} style={{
                padding: "8px 20px", background: "#ea580c", border: "none",
                color: "#fff", fontWeight: 700, fontSize: 12, borderRadius: 8, cursor: "pointer",
            }}>
                Retry
            </button>
        )}
    </div>
);
