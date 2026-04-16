import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";

const ShopByCategory = () => {
    const navigate = useNavigate();

    return (
        <section style={{ fontFamily: "'Jost', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Jost:wght@400;500;600;700;800&display=swap');

                .sbc-root { padding: 48px 0; }

                .sbc-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 28px; }
                .sbc-eyebrow {
                    font-size: 10px; font-weight: 700;
                    letter-spacing: 0.22em; text-transform: uppercase;
                    color: #c8a96e; margin-bottom: 6px;
                }
                .sbc-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.8rem; font-weight: 600;
                    color: #1c1917; letter-spacing: -0.01em;
                }
                .sbc-see-all {
                    font-size: 11px; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    color: #1c1917; background: none; border: none;
                    border-bottom: 1px solid #1c1917;
                    padding: 0 0 1px; cursor: pointer;
                    transition: color 0.2s, border-color 0.2s;
                    white-space: nowrap; flex-shrink: 0;
                }
                .sbc-see-all:hover { color: #c8a96e; border-color: #c8a96e; }

                .sbc-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 12px;
                }
                @media (max-width: 1100px) { .sbc-grid { grid-template-columns: repeat(5, 1fr); } }
                @media (max-width: 800px) { .sbc-grid { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 600px) { .sbc-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } }
                @media (max-width: 420px) { .sbc-grid { grid-template-columns: repeat(2, 1fr); } }

                .sbc-tile {
                    cursor: pointer;
                    border: 1px solid #e7e5e1;
                    background: white;
                    padding: 16px 10px 14px;
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                    text-align: center;
                    transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
                    position: relative; overflow: hidden;
                }
                .sbc-tile::before {
                    content: '';
                    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
                    background: #c8a96e;
                    transform: scaleX(0); transform-origin: left;
                    transition: transform 0.25s ease;
                }
                .sbc-tile:hover {
                    border-color: #c8a96e;
                    box-shadow: 0 6px 24px rgba(28,25,23,0.09);
                    transform: translateY(-2px);
                }
                .sbc-tile:hover::before { transform: scaleX(1); }
                .sbc-tile:active { transform: scale(0.98); }

                .sbc-icon-wrap {
                    width: 52px; height: 52px;
                    display: flex; align-items: center; justify-content: center;
                    background: #f5f2ec; border-radius: 50%;
                    font-size: 1.6rem;
                    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
                }
                .sbc-tile:hover .sbc-icon-wrap {
                    transform: scale(1.12);
                    background: #fdf6ea;
                }

                .sbc-name {
                    font-size: 11px; font-weight: 600;
                    letter-spacing: 0.04em; text-transform: uppercase;
                    color: #1c1917; line-height: 1.3;
                    transition: color 0.2s;
                }
                .sbc-tile:hover .sbc-name { color: #c8a96e; }
            `}</style>

            <div className="sbc-root">
                <div className="sbc-head">
                    <div>
                        <p className="sbc-eyebrow">Browse</p>
                        <h2 className="sbc-title">Shop by Category</h2>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="sbc-see-all"
                    >
                        View All →
                    </button>
                </div>

                <div className="sbc-grid">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => navigate(`/?category=${encodeURIComponent(cat.value)}`)}
                            className="sbc-tile"
                        >
                            <div className="sbc-icon-wrap">
                                <span>{cat.icon}</span>
                            </div>
                            <span className="sbc-name">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShopByCategory;