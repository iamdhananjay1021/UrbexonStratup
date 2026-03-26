import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { FaStar, FaRegStar, FaShoppingCart, FaBolt, FaCheckCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { imgUrl } from "../utils/imageUrl";

const ProductCard = ({ product, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const { cartItems, addItem } = useCart();

    const inCart = cartItems.some((item) => item._id === product._id);
    const [addedFlash, setAddedFlash] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);

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

    const handleWishlist = (e) => {
        e.stopPropagation();
        setWishlisted(w => !w);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600;700;800&display=swap');

        :root {
          --pc-ink:       #1c1917;
          --pc-muted:     #78716c;
          --pc-faint:     #a8a29e;
          --pc-bg:        #ffffff;
          --pc-border:    #e7e5e1;
          --pc-surface:   #f7f4f0;
          --pc-gold:      #c8a96e;
          --pc-gold-d:    #a8894e;
        }

        /* ═══════════════════════════════
           BASE CARD
        ═══════════════════════════════ */
        .pc-wrap {
          font-family: 'Jost', sans-serif;
          background: var(--pc-bg);
          border: 1px solid var(--pc-border);
          overflow: hidden;
          display: flex; flex-direction: column;
          cursor: pointer; position: relative;
          transition: border-color .25s, box-shadow .25s, transform .25s;
          border-radius: 0;
        }
        .pc-wrap:hover {
          border-color: var(--pc-gold);
          box-shadow: 0 12px 40px rgba(28,25,23,.1);
          transform: translateY(-3px);
        }
        .pc-wrap:active { transform: scale(.99); }

        /* ═══════════════════════════════
           WISHLIST BUTTON
        ═══════════════════════════════ */
        .pc-wish {
          position: absolute; top: 8px; right: 8px; z-index: 5;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,.9);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; backdrop-filter: blur(4px);
        }
        .pc-wish:hover { background: #fff; transform: scale(1.1); }

        /* ═══════════════════════════════
           IMAGE
        ═══════════════════════════════ */
        .pc-img-area {
          position: relative; overflow: hidden; background: #f5f2ec;
          /* Desktop height */
          height: 280px;
        }
        .pc-img-skeleton {
          position: absolute; inset: 0; background: #ede9e4;
          animation: pcPulse 1.5s ease-in-out infinite;
        }
        @keyframes pcPulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .pc-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .5s cubic-bezier(.34,1.1,.64,1);
        }
        .pc-wrap:hover .pc-img { transform: scale(1.06); }

        /* Badges */
        .pc-badge-stack {
          position: absolute; top: 8px; left: 8px;
          display: flex; flex-direction: column; gap: 3px; z-index: 2;
        }
        .pc-badge {
          font-family: 'Jost', sans-serif;
          font-size: 8.5px; font-weight: 800;
          letter-spacing: .08em; padding: 3px 7px;
        }
        .pc-badge-custom { background: #155e4e; color: #fff; }
        .pc-badge-sold   { background: #1c1917; color: #fff; }
        .pc-badge-low    { background: #d97706; color: #fff; }
        .pc-disc-badge {
          position: absolute; top: 8px; right: 8px; z-index: 2;
          background: #b91c1c; color: #fff;
          font-size: 8.5px; font-weight: 800; letter-spacing: .06em; padding: 3px 7px;
        }

        /* Overlay CTA — desktop hover */
        .pc-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(255,255,255,.97);
          border-top: 1px solid var(--pc-border);
          padding: 8px 10px; display: flex; gap: 6px;
          transform: translateY(100%);
          transition: transform .28s cubic-bezier(.22,1,.36,1);
          z-index: 3;
        }
        .pc-wrap:hover .pc-overlay { transform: translateY(0); }

        .pc-btn-cart {
          flex: 1; padding: 8px 0;
          font-family: 'Jost', sans-serif;
          font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          transition: all .18s;
        }
        .pc-bc-default  { background: var(--pc-ink); color: #fff; }
        .pc-bc-default:hover { background: #2d2926; }
        .pc-bc-incart   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; cursor: default; }
        .pc-bc-flash    { background: #22c55e; color: #fff; }
        .pc-bc-disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }
        .pc-btn-buy {
          flex: 1; padding: 8px 0;
          font-family: 'Jost', sans-serif;
          font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          background: var(--pc-gold); color: #fff;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          transition: all .18s;
        }
        .pc-btn-buy:hover    { background: var(--pc-gold-d); }
        .pc-btn-buy:disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }

        /* ═══════════════════════════════
           BODY
        ═══════════════════════════════ */
        .pc-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; }
        .pc-cat {
          font-size: 8.5px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase;
          color: var(--pc-gold); margin-bottom: 4px;
        }
        .pc-name {
          font-size: 12.5px; font-weight: 500; color: var(--pc-ink); line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.6em; margin-bottom: 6px;
        }
        .pc-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 6px; }
        .pc-reviews { font-size: 9.5px; color: var(--pc-faint); margin-left: 3px; }
        .pc-stock {
          font-size: 9.5px; font-weight: 700;
          display: flex; align-items: center; gap: 4px; margin-bottom: 8px;
        }
        .pc-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .pc-price-row { display: flex; align-items: baseline; gap: 7px; margin-top: auto; }
        .pc-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem; font-weight: 600; color: var(--pc-ink);
        }
        .pc-price-oos { color: var(--pc-faint); }
        .pc-mrp  { font-size: 11px; color: var(--pc-faint); text-decoration: line-through; }
        .pc-save { font-size: 9.5px; color: #16a34a; font-weight: 700; margin-top: 2px; }

        @keyframes pcAddPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.05); }
          70%  { transform: scale(.98); }
          100% { transform: scale(1); }
        }
        .pc-add-pop { animation: pcAddPop .35s ease forwards; }

        /* ═══════════════════════════════
           MOBILE OVERRIDES
           — taller image, bigger text,
             always-visible action bar
        ═══════════════════════════════ */
        @media (max-width: 767px) {
          /* Taller image on mobile — fills nicely in 2-col grid */
          .pc-img-area { height: 220px; }
          .pc-img { object-fit: cover; padding: 0; }

          /* No hover overlay on mobile — show sticky bar instead */
          .pc-overlay { display: none !important; }
          .pc-disc-badge { top: 6px; right: 6px; }

          /* Bigger name and price for readability */
          .pc-name  { font-size: 12px; }
          .pc-price { font-size: 1.15rem; }
          .pc-mrp   { font-size: 10.5px; }

          /* Wishlist btn */
          .pc-wish { top: 6px; right: 6px; width: 26px; height: 26px; }

          /* ── Always-visible mobile CTA bar at bottom of card ── */
          .pc-mob-cta {
            display: flex; gap: 0; border-top: 1px solid var(--pc-border);
          }
          .pc-mob-btn-cart {
            flex: 1; padding: 9px 0;
            font-family: 'Jost', sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: .05em;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            transition: all .18s;
          }
          .pc-mob-bc-default  { background: var(--pc-ink); color: #fff; }
          .pc-mob-bc-incart   { background: #f0fdf4; color: #16a34a; border-right: 1px solid #bbf7d0; cursor: default; }
          .pc-mob-bc-flash    { background: #22c55e; color: #fff; }
          .pc-mob-bc-disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }
          .pc-mob-btn-buy {
            flex: 1; padding: 9px 0;
            font-family: 'Jost', sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: .05em;
            background: var(--pc-gold); color: #fff;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            transition: all .18s; border-left: 1px solid rgba(255,255,255,.2);
          }
          .pc-mob-btn-buy:disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }
        }

        /* Hide mobile CTA on desktop */
        @media (min-width: 768px) {
          .pc-mob-cta { display: none; }
        }
      `}</style>

            <div className="pc-wrap" onClick={() => navigate(productUrl)}>

                {/* WISHLIST BUTTON */}
                <button className="pc-wish" onClick={handleWishlist}>
                    {wishlisted
                        ? <FaHeart size={12} color="#ef4444" />
                        : <FaRegHeart size={12} color="#a8a29e" />}
                </button>

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
                        {isOutOfStock && <span className="pc-badge pc-badge-sold">SOLD OUT</span>}
                        {isLowStock && <span className="pc-badge pc-badge-low">⚡ {stockNum} LEFT</span>}
                    </div>

                    {hasDiscount && !isOutOfStock && (
                        <div className="pc-disc-badge">{discountPct}% OFF</div>
                    )}

                    {/* Desktop hover overlay */}
                    <div className="pc-overlay">
                        <button
                            onClick={handleAddToCart}
                            disabled={inCart || isOutOfStock}
                            className={`pc-btn-cart ${inCart ? "pc-bc-incart" : addedFlash ? "pc-bc-flash pc-add-pop" : isOutOfStock ? "pc-bc-disabled" : "pc-bc-default"}`}
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
                                    ? <FaStar key={s} size={9} style={{ color: "#f59e0b" }} />
                                    : <FaRegStar key={s} size={9} style={{ color: "#d6d3d1" }} />
                            )}
                            <span className="pc-reviews">({numReviews})</span>
                        </div>
                    ) : (
                        <div className="pc-stars">
                            <div style={{ background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, display: "flex", alignItems: "center", gap: 3 }}>
                                4.0 <FaStar size={8} />
                            </div>
                            <span className="pc-reviews">(0 reviews)</span>
                        </div>
                    )}

                    <div className="pc-stock">
                        {isOutOfStock ? (
                            <><span className="pc-dot" style={{ background: "#d1d5db" }} /><span style={{ color: "#9ca3af" }}>Out of Stock</span></>
                        ) : isLowStock ? (
                            <><span className="pc-dot" style={{ background: "#f59e0b" }} /><span style={{ color: "#b45309" }}>Only {stockNum} left</span></>
                        ) : (
                            <><span className="pc-dot" style={{ background: "#22c55e", animation: "pcPulse 2s ease-in-out infinite" }} /><span style={{ color: "#16a34a" }}>In Stock</span></>
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

                {/* ── MOBILE ALWAYS-VISIBLE CTA BAR ── */}
                <div className="pc-mob-cta">
                    <button
                        onClick={handleAddToCart}
                        disabled={inCart || isOutOfStock}
                        className={`pc-mob-btn-cart ${inCart ? "pc-mob-bc-incart" : addedFlash ? "pc-mob-bc-flash pc-add-pop" : isOutOfStock ? "pc-mob-bc-disabled" : "pc-mob-bc-default"}`}
                    >
                        {inCart ? <><FaCheckCircle size={9} /> Cart</> : addedFlash ? <>✓ Added</> : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button onClick={handleBuyNow} disabled={isOutOfStock} className="pc-mob-btn-buy">
                        <FaBolt size={9} /> Buy
                    </button>
                </div>

            </div>
        </>
    );
};

export default ProductCard;