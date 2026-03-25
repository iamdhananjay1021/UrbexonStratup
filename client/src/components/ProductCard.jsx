import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaCheckCircle } from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();

    const inCart = cartItems.some((item) => item._id === product._id);
    const [addedFlash, setAddedFlash] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const imageUrl = imgUrl.card(product?.images?.[0]?.url || product?.image || "");
    const rating = product.rating || 0;
    const numReviews = product.numReviews || 0;
    const stockNum = Number(product.stock ?? 0);
    const isOutOfStock = product.inStock === false || stockNum === 0;
    const isLowStock = !isOutOfStock && stockNum > 0 && stockNum <= 5;

    const hasDiscount = product.mrp && Number(product.mrp) > Number(product.price);
    const discountPct = hasDiscount
        ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
        : null;

    const productUrl = `/products/${product.slug || product._id}`;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        if (inCart || isOutOfStock) return;
        if (onAddToCart) onAddToCart(product);
        else addItem(product);
        setAddedFlash(true);
        setTimeout(() => setAddedFlash(false), 1500);
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        if (onBuyNow) onBuyNow(product);
        else navigate("/checkout", { state: { buyNowItem: { ...product, quantity: 1 } } });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700;800&display=swap');

                :root {
                    --pc-ink: #1c1917;
                    --pc-ink-muted: #78716c;
                    --pc-ink-faint: #a8a29e;
                    --pc-bg-card: #ffffff;
                    --pc-border: #e7e5e1;
                    --pc-accent: #c8a96e;
                    --pc-accent-dark: #a8894e;
                }

                .pc-wrap {
                    font-family: 'Jost', sans-serif;
                    background: var(--pc-bg-card);
                    border: 1px solid var(--pc-border);
                    overflow: hidden;
                    display: flex; flex-direction: column;
                    cursor: pointer; position: relative;
                    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
                }
                .pc-wrap:hover {
                    border-color: var(--pc-accent);
                    box-shadow: 0 12px 40px rgba(28,25,23,0.1);
                    transform: translateY(-3px);
                }
                .pc-wrap:active { transform: scale(0.99); }

                /* ── IMAGE ── */
                .pc-img-area {
                    position: relative; height: 280px;
                    overflow: hidden; background: #f5f2ec;
                }
                .pc-img-skeleton {
                    position: absolute; inset: 0; background: #ede9e4;
                    animation: pcPulse 1.5s ease-in-out infinite;
                }
                @keyframes pcPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
                .pc-img {
                    position: absolute; inset: 0; width: 100%; height: 100%;
                    object-fit: contain; padding: 16px;
                    transition: transform 0.5s cubic-bezier(0.34,1.1,0.64,1);
                }
                .pc-wrap:hover .pc-img { transform: scale(1.06); }

                /* Badges */
                .pc-badge-stack {
                    position: absolute; top: 10px; left: 10px;
                    display: flex; flex-direction: column; gap: 4px; z-index: 2;
                }
                .pc-badge {
                    font-family: 'Jost', sans-serif;
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 0.08em; padding: 3px 8px;
                }
                .pc-badge-custom { background: #155e4e; color: white; }
                .pc-badge-sold { background: #1c1917; color: white; }
                .pc-badge-low { background: #d97706; color: white; }

                .pc-discount-badge {
                    position: absolute; top: 10px; right: 10px;
                    background: #b91c1c; color: white; z-index: 2;
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 0.06em; padding: 3px 8px;
                }

                /* Overlay CTA */
                .pc-overlay {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    background: rgba(255,255,255,0.97);
                    border-top: 1px solid var(--pc-border);
                    padding: 10px 12px; display: flex; gap: 8px;
                    transform: translateY(100%);
                    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
                    z-index: 3;
                }
                .pc-wrap:hover .pc-overlay { transform: translateY(0); }

                .pc-btn-cart {
                    flex: 1; padding: 9px 0;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    transition: all 0.18s;
                }
                .pc-btn-cart-default { background: var(--pc-ink); color: white; }
                .pc-btn-cart-default:hover { background: #2d2926; }
                .pc-btn-cart-incart { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; cursor: default; }
                .pc-btn-cart-flash { background: #22c55e; color: white; }
                .pc-btn-cart-disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }

                .pc-btn-buy {
                    flex: 1; padding: 9px 0;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
                    background: var(--pc-accent); color: white;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    transition: all 0.18s;
                }
                .pc-btn-buy:hover { background: var(--pc-accent-dark); }
                .pc-btn-buy:disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }

                /* ── BODY ── */
                .pc-body { padding: 14px 16px 16px; flex: 1; display: flex; flex-direction: column; }
                .pc-cat {
                    font-size: 9px; font-weight: 700;
                    letter-spacing: 0.15em; text-transform: uppercase;
                    color: var(--pc-accent); margin-bottom: 5px;
                }
                .pc-name {
                    font-size: 13px; font-weight: 500; color: var(--pc-ink);
                    line-height: 1.4;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                    min-height: 2.6em; margin-bottom: 8px;
                }
                .pc-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 8px; }
                .pc-reviews { font-size: 10px; color: var(--pc-ink-faint); margin-left: 4px; }

                .pc-stock {
                    font-size: 10px; font-weight: 700;
                    display: flex; align-items: center; gap: 5px; margin-bottom: 10px;
                }
                .pc-stock-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    display: inline-block;
                }

                .pc-price-row { display: flex; align-items: baseline; gap: 8px; margin-top: auto; }
                .pc-price {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.4rem; font-weight: 600; color: var(--pc-ink);
                }
                .pc-price-oos { color: var(--pc-ink-faint); }
                .pc-mrp { font-size: 12px; color: var(--pc-ink-faint); text-decoration: line-through; }
                .pc-save { font-size: 10px; color: #16a34a; font-weight: 700; margin-top: 3px; }

                @keyframes pcAddPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.05); }
                    70%  { transform: scale(0.98); }
                    100% { transform: scale(1); }
                }
                .pc-add-pop { animation: pcAddPop 0.35s ease forwards; }
            `}</style>

            <div className="pc-wrap" onClick={() => navigate(productUrl)}>

                {/* IMAGE */}
                <div className="pc-img-area">
                    {!imgLoaded && <div className="pc-img-skeleton" />}
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width={400} height={400}
                        onLoad={() => setImgLoaded(true)}
                        onError={e => { e.target.src = "https://via.placeholder.com/400x400?text=No+Image"; setImgLoaded(true); }}
                        className={`pc-img transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"} ${isOutOfStock ? "grayscale opacity-50" : ""}`}
                    />

                    {/* Badges */}
                    <div className="pc-badge-stack">
                        {product.isCustomizable && !isOutOfStock && (
                            <span className="pc-badge pc-badge-custom">✏ CUSTOM</span>
                        )}
                        {isOutOfStock && (
                            <span className="pc-badge pc-badge-sold">SOLD OUT</span>
                        )}
                        {isLowStock && (
                            <span className="pc-badge pc-badge-low">⚡ {stockNum} LEFT</span>
                        )}
                    </div>

                    {hasDiscount && !isOutOfStock && (
                        <div className="pc-discount-badge">{discountPct}% OFF</div>
                    )}

                    {/* Overlay actions */}
                    <div className="pc-overlay">
                        <button
                            onClick={handleAddToCart}
                            disabled={inCart || isOutOfStock}
                            className={`pc-btn-cart ${inCart ? "pc-btn-cart-incart" : addedFlash ? "pc-btn-cart-flash pc-add-pop" : isOutOfStock ? "pc-btn-cart-disabled" : "pc-btn-cart-default"}`}
                        >
                            {inCart ? <><FaCheckCircle size={9} /> In Cart</> : addedFlash ? <>✓ Added!</> : <><FaShoppingCart size={9} /> Add to Cart</>}
                        </button>
                        <button onClick={handleBuyNow} disabled={isOutOfStock} className="pc-btn-buy">
                            <FaBolt size={9} /> Buy Now
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="pc-body">
                    <p className="pc-cat">{product.category || "General"}</p>
                    <h3 className="pc-name">{product.name}</h3>

                    {numReviews > 0 ? (
                        <div className="pc-stars">
                            {[1, 2, 3, 4, 5].map(s =>
                                s <= Math.round(rating)
                                    ? <FaStar key={s} size={9} className="text-amber-400" />
                                    : <FaRegStar key={s} size={9} className="text-stone-200" />
                            )}
                            <span className="pc-reviews">({numReviews})</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mt-1">
                            {/* Rating Badge */}
                            <div className="bg-green-700 text-white text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                4.0 <FaStar size={8} />
                            </div>
                            {/* Review Count */}
                            <span className="text-[12px] text-gray-400 font-medium">(0 reviews)</span>
                        </div>
                    )}

                    <div className="pc-stock">
                        {isOutOfStock ? (
                            <><span className="pc-stock-dot" style={{ background: "#d1d5db" }} /><span style={{ color: "#9ca3af" }}>Out of Stock</span></>
                        ) : isLowStock ? (
                            <><span className="pc-stock-dot" style={{ background: "#f59e0b" }} /><span style={{ color: "#b45309" }}>Only {stockNum} left</span></>
                        ) : (
                            <><span className="pc-stock-dot" style={{ background: "#22c55e", animation: "pcPulse 2s ease-in-out infinite" }} /><span style={{ color: "#16a34a" }}>In Stock</span></>
                        )}
                    </div>

                    <div className="pc-price-row">
                        <span className={`pc-price ${isOutOfStock ? "pc-price-oos" : ""}`}>
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </span>
                        {hasDiscount && !isOutOfStock && (
                            <span className="pc-mrp">₹{Number(product.mrp).toLocaleString("en-IN")}</span>
                        )}
                    </div>
                    {hasDiscount && !isOutOfStock && (
                        <p className="pc-save">Save ₹{(Number(product.mrp) - Number(product.price)).toLocaleString("en-IN")}</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductCard;