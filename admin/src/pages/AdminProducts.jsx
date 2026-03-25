import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/adminApi";
import { imgUrl } from "../utils/imageUrl";
import {
    FaPlus, FaSync, FaEdit, FaTrash, FaSearch,
    FaBoxOpen, FaBoxes, FaChevronLeft, FaChevronRight, FaLink,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const STYLES = `
    @keyframes adm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes adm-spin  { to{transform:rotate(360deg)} }
    @keyframes row-in    { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }

    .uk-prod-row {
        animation: row-in 0.15s ease both;
        transition: background 0.12s;
    }
    .uk-prod-row:hover { background: #f8faff !important; }

    .uk-action-btn {
        transition: all 0.15s ease;
    }
    .uk-action-btn:hover { opacity: 0.85; transform: scale(1.05); }

    .uk-search-input:focus {
        outline: none;
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
    }

    .uk-refresh-btn:hover {
        background: #eff6ff !important;
        border-color: #93c5fd !important;
        color: #2563eb !important;
    }

    .uk-page-btn:hover:not(:disabled) {
        background: #eff6ff !important;
        border-color: #93c5fd !important;
        color: #2563eb !important;
    }
`;

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [toast, setToast] = useState(null);
    const [editingStockId, setEditingStockId] = useState(null);
    const [stockInput, setStockInput] = useState("");
    const [savingStockId, setSavingStockId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);

    useEffect(() => { setCurrentPage(1); }, [search]);

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const { data } = await api.get("/products");
            const list = Array.isArray(data) ? data : [];
            setProducts(list); setFiltered(list);
        } catch { setError("Failed to load products"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        if (!search.trim()) return setFiltered(products);
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
        ));
    }, [search, products]);

    const deleteHandler = useCallback(async (id) => {
        try {
            setDeletingId(id);
            await api.delete(`/products/${id}`);
            setProducts(prev => prev.filter(x => x._id !== id));
            setFiltered(prev => prev.filter(x => x._id !== id));
            showToast("success", "Product deleted");
        } catch { showToast("error", "Failed to delete"); }
        finally { setDeletingId(null); setConfirmId(null); }
    }, [showToast]);

    const handleStockSave = useCallback(async (product) => {
        const newStock = parseInt(stockInput, 10);
        if (isNaN(newStock) || newStock < 0) { showToast("error", "Invalid stock"); return; }
        try {
            setSavingStockId(product._id);
            const fd = new FormData();
            fd.append("name", product.name);
            fd.append("price", product.price);
            fd.append("category", product.category);
            fd.append("stock", newStock);
            fd.append("isCustomizable", product.isCustomizable ? "true" : "false");
            fd.append("sizes", JSON.stringify(product.sizes || []));
            fd.append("highlights", JSON.stringify(
                product.highlights instanceof Map
                    ? Object.fromEntries(product.highlights)
                    : (product.highlights || {})
            ));
            await api.put(`/products/${product._id}`, fd);
            const updated = { ...product, stock: newStock, inStock: newStock > 0 };
            setProducts(prev => prev.map(x => x._id === product._id ? updated : x));
            setFiltered(prev => prev.map(x => x._id === product._id ? updated : x));
            setEditingStockId(null);
            showToast("success", `Stock updated to ${newStock}`);
        } catch { showToast("error", "Failed to update stock"); }
        finally { setSavingStockId(null); }
    }, [stockInput, showToast]);

    const refreshProducts = useCallback(async () => {
        setRefreshing(true);
        await fetchProducts();
        setCurrentPage(1);
        setTimeout(() => setRefreshing(false), 500);
    }, [fetchProducts]);

    const formatCat = (cat) =>
        cat?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "—";

    const stockInfo = (product) => {
        const n = Number(product.stock ?? 0);
        if (!product.inStock) return { label: "Out of Stock", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
        if (n <= 5) return { label: `${n} left`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
        return { label: `${n} left`, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" };
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, "…", totalPages];
        if (currentPage >= totalPages - 2) return [1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{`@keyframes adm-spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: 36, height: 36,
                    border: "3px solid #dbeafe",
                    borderTopColor: "#2563eb",
                    borderRadius: "50%",
                    animation: "adm-spin 0.8s linear infinite",
                    margin: "0 auto 12px",
                }} />
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading products...</p>
            </div>
        </div>
    );

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
                textAlign: "center",
                background: "#fff",
                border: "1px solid #fee2e2",
                borderRadius: 12,
                padding: "36px 48px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>⚠️</p>
                <p style={{ color: "#1e293b", fontWeight: 700, marginBottom: 16 }}>{error}</p>
                <button onClick={fetchProducts} style={{
                    padding: "8px 22px",
                    background: "#2563eb", color: "#fff",
                    border: "none", borderRadius: 7,
                    fontWeight: 600, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                }}>
                    Retry
                </button>
            </div>
        </div>
    );

    // ── Main ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", background: "#f0f4ff", padding: "28px 24px 56px" }}>
            <style>{STYLES}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                    zIndex: 9999, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 8,
                    background: toast.type === "success" ? "#059669" : "#ef4444",
                    color: "#fff", fontWeight: 600, fontSize: 13,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    whiteSpace: "nowrap",
                }}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                </div>
            )}

            <div style={{ maxWidth: 1060, margin: "0 auto" }}>

                {/* ── Header ── */}
                <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 24, flexWrap: "wrap", gap: 12,
                }}>
                    <div>
                        <h1 style={{
                            fontWeight: 800, fontSize: 22,
                            color: "#1e293b", margin: 0,
                            letterSpacing: "-0.02em",
                        }}>
                            Products
                        </h1>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                            {products.length} total · {filtered.length} showing
                            {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={refreshProducts}
                            disabled={refreshing}
                            className="uk-refresh-btn"
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 14px", borderRadius: 8,
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                color: "#64748b", fontSize: 12, fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.15s",
                            }}
                        >
                            <FaSync size={10} style={{ animation: refreshing ? "adm-spin 0.8s linear infinite" : "none" }} />
                            Refresh
                        </button>
                        <Link to="/admin/products/new" style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "8px 16px", borderRadius: 8,
                            background: "#2563eb", color: "#fff",
                            fontWeight: 700, fontSize: 13,
                            textDecoration: "none",
                            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                            transition: "all 0.15s",
                        }}>
                            <FaPlus size={10} /> Add Product
                        </Link>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12, marginBottom: 20,
                }}>
                    {[
                        { label: "Total", value: products.length, color: "#2563eb", bg: "#eff6ff", icon: "📦" },
                        { label: "In Stock", value: products.filter(p => p.inStock).length, color: "#059669", bg: "#f0fdf4", icon: "✅" },
                        { label: "Out of Stock", value: products.filter(p => !p.inStock).length, color: "#ef4444", bg: "#fef2f2", icon: "❌" },
                        {
                            label: "Avg Price",
                            value: `₹${products.length
                                ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length).toLocaleString("en-IN")
                                : 0}`,
                            color: "#7c3aed", bg: "#f5f3ff", icon: "💰",
                        },
                    ].map(({ label, value, color, bg, icon }) => (
                        <div key={label} style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "14px 16px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    {label}
                                </p>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    background: bg,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 13,
                                }}>
                                    {icon}
                                </div>
                            </div>
                            <p style={{ fontWeight: 800, fontSize: 20, color, margin: 0, letterSpacing: "-0.02em" }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Search ── */}
                <div style={{ position: "relative", marginBottom: 16 }}>
                    <FaSearch size={12} style={{
                        position: "absolute", left: 12, top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8", pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or category..."
                        className="uk-search-input"
                        style={{
                            width: "100%",
                            paddingLeft: 36, paddingRight: search ? 36 : 14,
                            paddingTop: 10, paddingBottom: 10,
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            color: "#1e293b", fontSize: 13,
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} style={{
                            position: "absolute", right: 11, top: "50%",
                            transform: "translateY(-50%)",
                            background: "none", border: "none",
                            color: "#94a3b8", cursor: "pointer", fontSize: 14,
                        }}>✕</button>
                    )}
                </div>

                {/* ── Empty ── */}
                {filtered.length === 0 ? (
                    <div style={{
                        background: "#fff",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 10,
                        padding: "56px 20px",
                        textAlign: "center",
                    }}>
                        <FaBoxOpen size={32} style={{ color: "#cbd5e1", display: "block", margin: "0 auto 12px" }} />
                        <p style={{ fontWeight: 700, color: "#94a3b8", fontSize: 14 }}>
                            {search ? `No results for "${search}"` : "No products yet"}
                        </p>
                        {!search && (
                            <Link to="/admin/products/new" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                marginTop: 16, padding: "8px 18px", borderRadius: 8,
                                background: "#2563eb", color: "#fff",
                                fontWeight: 600, fontSize: 13,
                                textDecoration: "none",
                            }}>
                                <FaPlus size={10} /> Add First Product
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "28px 40px 1fr 120px 80px 120px 80px",
                            gap: 10, padding: "10px 16px",
                            background: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                            fontSize: 10, fontWeight: 700,
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        }}>
                            <div>#</div>
                            <div>Img</div>
                            <div>Product</div>
                            <div>Category</div>
                            <div>Price</div>
                            <div>Stock</div>
                            <div style={{ textAlign: "right" }}>Actions</div>
                        </div>

                        {/* Rows */}
                        {paginated.map((product, idx) => {
                            const rawImg = product.images?.[0]?.url || product.image || null;
                            const img = rawImg ? imgUrl.thumbnail(rawImg) : null;
                            const si = stockInfo(product);
                            const isES = editingStockId === product._id;
                            const isIC = confirmId === product._id;

                            return (
                                <div
                                    key={product._id}
                                    className="uk-prod-row"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "28px 40px 1fr 120px 80px 120px 80px",
                                        gap: 10, padding: "11px 16px",
                                        alignItems: "center",
                                        borderBottom: "1px solid #f1f5f9",
                                        background: "#fff",
                                        opacity: deletingId === product._id ? 0.4 : 1,
                                        transition: "opacity 0.2s",
                                    }}
                                >
                                    {/* # */}
                                    <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>
                                        {pageStart + idx + 1}
                                    </div>

                                    {/* Image */}
                                    <div style={{
                                        width: 36, height: 36,
                                        background: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: 7,
                                        overflow: "hidden",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        {img
                                            ? <img src={img} alt={product.name} loading="lazy" decoding="async"
                                                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                                            : <FaBoxOpen size={13} style={{ color: "#cbd5e1" }} />
                                        }
                                    </div>

                                    {/* Name + Slug */}
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{
                                            fontWeight: 600, fontSize: 13,
                                            color: "#1e293b", margin: 0,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {product.name}
                                        </p>
                                        {product.slug ? (
                                            <div style={{
                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                marginTop: 3, fontSize: 10, color: "#6366f1",
                                                background: "#eef2ff",
                                                border: "1px solid #e0e7ff",
                                                padding: "1px 7px", borderRadius: 4,
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                maxWidth: "100%",
                                            }}>
                                                <FaLink size={7} /> {product.slug}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 10, color: "#f59e0b", marginTop: 3, display: "block" }}>
                                                ⚠ no slug
                                            </span>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <span style={{
                                            background: "#fefce8",
                                            border: "1px solid #fde68a",
                                            color: "#92400e",
                                            fontSize: 10, fontWeight: 600,
                                            padding: "3px 9px", borderRadius: 20,
                                            whiteSpace: "nowrap",
                                        }}>
                                            {formatCat(product.category)}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div style={{ fontWeight: 800, fontSize: 13, color: "#2563eb" }}>
                                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        {isES ? (
                                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                <input
                                                    type="number" min="0"
                                                    value={stockInput}
                                                    onChange={e => setStockInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") handleStockSave(product);
                                                        if (e.key === "Escape") setEditingStockId(null);
                                                    }}
                                                    autoFocus
                                                    style={{
                                                        width: 52, padding: "4px 7px",
                                                        background: "#fff",
                                                        border: "1px solid #2563eb",
                                                        borderRadius: 6,
                                                        color: "#1e293b", fontSize: 12, fontWeight: 700,
                                                        outline: "none", fontFamily: "inherit",
                                                        boxShadow: "0 0 0 3px rgba(37,99,235,0.1)",
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleStockSave(product)}
                                                    disabled={savingStockId === product._id}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: 5,
                                                        background: "#2563eb", color: "#fff",
                                                        border: "none", fontSize: 11, fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {savingStockId === product._id ? "…" : "✓"}
                                                </button>
                                                <button
                                                    onClick={() => setEditingStockId(null)}
                                                    style={{
                                                        padding: "4px 7px", borderRadius: 5,
                                                        background: "#f1f5f9",
                                                        border: "1px solid #e2e8f0",
                                                        color: "#64748b", fontSize: 11,
                                                        fontWeight: 700, cursor: "pointer",
                                                    }}
                                                >✕</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingStockId(product._id); setStockInput(String(product.stock ?? 0)); }}
                                                style={{
                                                    display: "inline-flex", alignItems: "center", gap: 5,
                                                    padding: "3px 10px", borderRadius: 20,
                                                    border: `1px solid ${si.border}`,
                                                    background: si.bg,
                                                    color: si.color,
                                                    fontSize: 11, fontWeight: 600,
                                                    cursor: "pointer", fontFamily: "inherit",
                                                    transition: "opacity 0.15s",
                                                }}
                                            >
                                                <FaBoxes size={8} /> {si.label}
                                                <span style={{ fontSize: 9, opacity: 0.5 }}>✎</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
                                        <Link
                                            to={`/admin/products/${product._id}/edit`}
                                            className="uk-action-btn"
                                            style={{
                                                width: 30, height: 30, borderRadius: 7,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                background: "#eef2ff",
                                                border: "1px solid #e0e7ff",
                                                color: "#6366f1",
                                                textDecoration: "none",
                                            }}
                                        >
                                            <FaEdit size={11} />
                                        </Link>
                                        {isIC ? (
                                            <div style={{ display: "flex", gap: 3 }}>
                                                <button
                                                    onClick={() => deleteHandler(product._id)}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: 6,
                                                        background: "#ef4444", color: "#fff",
                                                        border: "none", fontSize: 11, fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >Yes</button>
                                                <button
                                                    onClick={() => setConfirmId(null)}
                                                    style={{
                                                        padding: "4px 8px", borderRadius: 6,
                                                        background: "#f1f5f9",
                                                        border: "1px solid #e2e8f0",
                                                        color: "#64748b", fontSize: 11,
                                                        fontWeight: 700, cursor: "pointer",
                                                    }}
                                                >No</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmId(product._id)}
                                                className="uk-action-btn"
                                                style={{
                                                    width: 30, height: 30, borderRadius: 7,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: "#fef2f2",
                                                    border: "1px solid #fecaca",
                                                    color: "#ef4444",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <FaTrash size={11} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            borderTop: "1px solid #e2e8f0",
                            flexWrap: "wrap", gap: 10,
                        }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                                Showing{" "}
                                <b style={{ color: "#475569" }}>{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}</b>
                                {" "}of{" "}
                                <b style={{ color: "#475569" }}>{filtered.length}</b>
                            </p>
                            {totalPages > 1 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <button
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={currentPage === 1}
                                        className="uk-page-btn"
                                        style={{
                                            width: 30, height: 30, borderRadius: 7,
                                            background: "#fff", border: "1px solid #e2e8f0",
                                            color: "#64748b", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            opacity: currentPage === 1 ? 0.4 : 1,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <FaChevronLeft size={9} />
                                    </button>
                                    {getPageNumbers().map((pg, i) =>
                                        pg === "…" ? (
                                            <span key={`e-${i}`} style={{ padding: "0 4px", color: "#cbd5e1", fontSize: 12 }}>…</span>
                                        ) : (
                                            <button
                                                key={pg}
                                                onClick={() => setCurrentPage(pg)}
                                                style={{
                                                    width: 30, height: 30, borderRadius: 7,
                                                    background: currentPage === pg ? "#2563eb" : "#fff",
                                                    border: currentPage === pg ? "1px solid #2563eb" : "1px solid #e2e8f0",
                                                    color: currentPage === pg ? "#fff" : "#475569",
                                                    fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", fontFamily: "inherit",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {pg}
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage === totalPages}
                                        className="uk-page-btn"
                                        style={{
                                            width: 30, height: 30, borderRadius: 7,
                                            background: "#fff", border: "1px solid #e2e8f0",
                                            color: "#64748b", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            opacity: currentPage === totalPages ? 0.4 : 1,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <FaChevronRight size={9} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;