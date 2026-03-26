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

    // Fallback image — via.placeholder.com is deprecated, use inline SVG data URI
    const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f0ede8' width='400' height='400'/%3E%3Ctext fill='%23b0a89e' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

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
        /* BUG FIX: disable transform on mobile to avoid tap glitch */
        @media (max-width: 767px) {
          .pc-wrap:hover { transform: none; box-shadow: none; border-color: var(--pc-border); }
          .pc-wrap:active { transform: scale(.98); }
        }
        .pc-wrap:active { transform: scale(.99); }

        /* ═══════════════════════════════
           WISHLIST BUTTON
        ═══════════════════════════════ */
        .pc-wish {
          position: absolute; top: 8px; right: 8px; z-index: 5;
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,.92);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; backdrop-filter: blur(4px);
          /* BUG FIX: ensure touch target is large enough on mobile */
          -webkit-tap-highlight-color: transparent;
        }
        .pc-wish:hover { background: #fff; transform: scale(1.1); }

        /* ═══════════════════════════════
           IMAGE
        ═══════════════════════════════ */
        .pc-img-area {
          position: relative; overflow: hidden; background: #f5f2ec;
          /* BUG FIX: use aspect-ratio instead of fixed height so mobile grids look correct */
          aspect-ratio: 1 / 1;
        }
        /* Desktop: slightly wider aspect */
        @media (min-width: 768px) {
          .pc-img-area { aspect-ratio: 4 / 5; }
        }

        .pc-img-skeleton {
          position: absolute; inset: 0; background: #ede9e4;
          animation: pcPulse 1.5s ease-in-out infinite;
        }
        @keyframes pcPulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .pc-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
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
          position: absolute; top: 8px; right: 40px; z-index: 2;
          background: #b91c1c; color: #fff;
          font-size: 8.5px; font-weight: 800; letter-spacing: .06em; padding: 3px 7px;
        }

        /* Overlay CTA — desktop hover only */
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
        .pc-body { padding: 10px 12px 12px; flex: 1; display: flex; flex-direction: column; }
        .pc-cat {
          font-size: 8px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase;
          color: var(--pc-gold); margin-bottom: 3px;
        }
        .pc-name {
          /* BUG FIX: was 12.5px — on small 2-col mobile this was cramped */
          font-size: 12px; font-weight: 500; color: var(--pc-ink); line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.5em; margin-bottom: 5px;
        }
        .pc-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 5px; flex-wrap: wrap; }
        .pc-reviews { font-size: 9px; color: var(--pc-faint); margin-left: 2px; }
        .pc-stock {
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; gap: 4px; margin-bottom: 6px;
        }
        .pc-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .pc-price-row { display: flex; align-items: baseline; gap: 6px; margin-top: auto; flex-wrap: wrap; }
        .pc-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; font-weight: 600; color: var(--pc-ink);
        }
        .pc-price-oos { color: var(--pc-faint); }
        .pc-mrp  { font-size: 10px; color: var(--pc-faint); text-decoration: line-through; }
        .pc-save { font-size: 9px; color: #16a34a; font-weight: 700; margin-top: 2px; }

        @keyframes pcAddPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.05); }
          70%  { transform: scale(.98); }
          100% { transform: scale(1); }
        }
        .pc-add-pop { animation: pcAddPop .35s ease forwards; }

        /* ═══════════════════════════════
           MOBILE — always-visible CTA bar
           (replaces hover overlay which
            doesn't work on touch devices)
        ═══════════════════════════════ */
        @media (max-width: 767px) {
          /* Hide desktop hover overlay on mobile */
          .pc-overlay { display: none !important; }

          /* Discount badge shift — no overlap with wishlist */
          .pc-disc-badge { top: 6px; right: 6px; }

          /* Wishlist: smaller, top-left on mobile to avoid overlap */
          .pc-wish { top: 6px; right: 6px; width: 28px; height: 28px; }

          /* BUG FIX: text adjustments for 2-col grid on small screens */
          .pc-name  { font-size: 11.5px; min-height: unset; -webkit-line-clamp: 2; }
          .pc-price { font-size: 1.05rem; }
          .pc-mrp   { font-size: 9.5px; }
          .pc-body  { padding: 8px 10px 10px; }
          .pc-cat   { font-size: 7.5px; }
          .pc-stock { font-size: 8.5px; margin-bottom: 4px; }
          .pc-save  { font-size: 8.5px; }

          /* ── Always-visible mobile CTA bar ── */
          .pc-mob-cta {
            display: flex;
            border-top: 1px solid var(--pc-border);
          }
          .pc-mob-btn-cart {
            flex: 1; padding: 10px 0;
            font-family: 'Jost', sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: .04em;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            transition: all .18s;
            -webkit-tap-highlight-color: transparent;
          }
          .pc-mob-bc-default  { background: var(--pc-ink); color: #fff; }
          .pc-mob-bc-default:active { background: #2d2926; }
          .pc-mob-bc-incart   {
            background: #f0fdf4; color: #16a34a;
            border-right: 1px solid #bbf7d0; cursor: default;
          }
          .pc-mob-bc-flash    { background: #22c55e; color: #fff; }
          .pc-mob-bc-disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }
          .pc-mob-btn-buy {
            flex: 1; padding: 10px 0;
            font-family: 'Jost', sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: .04em;
            background: var(--pc-gold); color: #fff;
            border: none; border-left: 1px solid rgba(255,255,255,.2);
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            transition: all .18s;
            -webkit-tap-highlight-color: transparent;
          }
          .pc-mob-btn-buy:disabled { background: #f4f4f5; color: #a1a1aa; cursor: not-allowed; }
          .pc-mob-btn-buy:active:not(:disabled) { background: var(--pc-gold-d); }
        }

        /* ═══════════════════════════════
           VERY SMALL PHONES (< 360px)
           e.g. iPhone SE, Galaxy A01
        ═══════════════════════════════ */
        @media (max-width: 359px) {
          .pc-name  { font-size: 10.5px; }
          .pc-price { font-size: .95rem; }
          .pc-mob-btn-cart,
          .pc-mob-btn-buy { font-size: 9px; padding: 9px 0; }
        }

        /* Hide mobile CTA on desktop */
        @media (min-width: 768px) {
          .pc-mob-cta { display: none; }
        }
      `}</style>

            <div className="pc-wrap" onClick={() => navigate(productUrl)}>

                {/* WISHLIST BUTTON */}
                <button className="pc-wish" onClick={handleWishlist} aria-label="Wishlist">
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
                        onError={e => { e.target.src = FALLBACK_IMG; setImgLoaded(true); }}
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

                    {/* BUG FIX: discount badge was overlapping wishlist button on mobile.
                        On desktop, wishlist is top-right and discount was also top-right.
                        Fixed by moving discount badge to right:40px (desktop) so it doesn't clash,
                        and on mobile CSS above sets it back to right:6px since wishlist moves too. */}
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
                            <div style={{ background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, display: "flex", alignItems: "center", gap: 2 }}>
                                4.0 <FaStar size={7} />
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
                        aria-label="Add to cart"
                    >
                        {inCart ? <><FaCheckCircle size={9} /> Cart</> : addedFlash ? <>✓ Added</> : <><FaShoppingCart size={9} /> Add</>}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="pc-mob-btn-buy"
                        aria-label="Buy now"
                    >
                        <FaBolt size={9} /> Buy
                    </button>
                </div>

            </div>
        </>
    );
};

export default ProductCard;