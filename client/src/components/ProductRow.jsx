import { useRef, useCallback, useEffect } from "react";
import ProductCard from "./ProductCard";

const ProductRow = ({ title, products = [] }) => {
    const rowRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    // 🔥 FIXED: Safe scroll functions with null checks
    const startScroll = useCallback(() => {
        if (!rowRef.current || scrollIntervalRef.current) return;

        scrollIntervalRef.current = setInterval(() => {
            if (rowRef.current) { // 🔥 NULL CHECK
                rowRef.current.scrollLeft += 1;
            } else {
                stopScroll(); // 🔥 CLEANUP
            }
        }, 16);
    }, []);

    const stopScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    // 🔥 CLEANUP INTERVAL ON UNMOUNT
    useEffect(() => {
        return () => stopScroll();
    }, [stopScroll]);

    if (!products.length) return null;

    return (
        <section className="relative">
            <h2 className="text-lg font-semibold mb-6 text-slate-800 px-4 sm:px-0">
                {title}
            </h2>

            <div className="relative">
                {/* Navigation Dots - Optional */}
                <div className="absolute -top-12 right-0 flex gap-2 z-10 hidden md:flex">
                    <button
                        onClick={() => rowRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all"
                        aria-label="Scroll left"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => rowRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all"
                        aria-label="Scroll right"
                    >
                        →
                    </button>
                </div>

                <div
                    ref={rowRef}
                    onMouseEnter={startScroll}
                    onMouseLeave={stopScroll}
                    className="
                        flex gap-6 overflow-x-auto pb-8 px-4 sm:px-0
                        scrollbar-hide
                        scroll-smooth
                        snap-x snap-mandatory
                        [&::-webkit-scrollbar]:hidden
                        [-ms-overflow-style:none]
                        [scrollbar-width:none]
                    "
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="min-w-[260px] md:min-w-[280px] flex-shrink-0 snap-center"
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductRow;
