import { useState, useEffect } from "react";
import { FaBolt, FaTruck, FaShieldAlt, FaSmile } from "react-icons/fa";

/**
 * HomeTicker.jsx — Scrolling Announcement Ticker
 * Features: Automatic scrolling, multiple announcement sources, responsive design
 */

const HomeTicker = () => {
    const announcements = [
        { icon: <FaBolt color="#ff6b35" />, text: "⚡ Flash Sale: Up to 50% off on Electronics" },
        { icon: <FaTruck color="#2563eb" />, text: "🚚 Free Shipping on orders above ₹499" },
        { icon: <FaShieldAlt color="#10b981" />, text: "🛡️ 100% Secure Transactions & Buyer Protection" },
        { icon: <FaSmile color="#f59e0b" />, text: "😊 Join 2M+ happy customers shopping with Urbexon" },
        { icon: <FaBolt color="#ff6b35" />, text: "⚡ Weekend Mega Deal: Extra 20% on Fashion" },
    ];

    const [displayIndex, setDisplayIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayIndex((prev) => (prev + 1) % announcements.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            padding: "12px 0",
            overflow: "hidden",
            borderBottom: "2px solid rgba(255,255,255,0.1)",
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
            }}>
                {/* Icon indicator */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                }}>
                    <span style={{ animation: "pulse 1.5s infinite", display: "flex", alignItems: "center" }}>
                        📢
                    </span>
                    <span>News</span>
                </div>

                {/* Scrolling text container */}
                <div style={{
                    flex: 1,
                    overflow: "hidden",
                    position: "relative",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        width: "100%",
                    }}>
                        {/* Animated scrolling items */}
                        {[displayIndex, (displayIndex + 1) % announcements.length].map((idx, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    color: "#fff",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                    animation: i === 0 ? "slideIn 0.6s ease-out" : "none",
                                    minWidth: "max-content",
                                }}
                            >
                                {announcements[idx].icon}
                                <span>{announcements[idx].text}</span>
                            </div>
                        ))}

                        {/* Separator */}
                        <span style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 20,
                            fontWeight: 300,
                        }}>
                            |
                        </span>
                    </div>
                </div>

                {/* Dot indicators */}
                <div style={{
                    display: "flex",
                    gap: 6,
                    flexShrink: 0,
                }}>
                    {announcements.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setDisplayIndex(i)}
                            style={{
                                width: i === displayIndex ? 18 : 8,
                                height: 8,
                                background: i === displayIndex ? "#fff" : "rgba(255,255,255,0.4)",
                                borderRadius: 10,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.15);
                    }
                }
            `}</style>
        </div>
    );
};

export default HomeTicker;
