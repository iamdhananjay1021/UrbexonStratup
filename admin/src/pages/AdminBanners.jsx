import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllBanners, deleteBanner, updateBanner } from "../api/bannerApi";
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiToggleLeft, FiToggleRight, FiArrowLeft } from "react-icons/fi";

const AdminBanners = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        (async () => {
            try {
                const { data } = await fetchAllBanners();
                setBanners(Array.isArray(data) ? data : []);
            } catch {
                showToast("error", "Failed to load banners");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this banner?")) return;
        setDeletingId(id);
        try {
            await deleteBanner(id);
            setBanners(prev => prev.filter(b => b._id !== id));
            showToast("success", "Banner deleted");
        } catch {
            showToast("error", "Delete failed");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggle = async (banner) => {
        try {
            const fd = new FormData();
            fd.append("isActive", !banner.isActive);
            const { data } = await updateBanner(banner._id, fd);
            setBanners(prev => prev.map(b => b._id === banner._id ? data : b));
            showToast("success", `Banner ${data.isActive ? "activated" : "deactivated"}`);
        } catch {
            showToast("error", "Toggle failed");
        }
    };

    const Sk = () => (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
            {[120, 200, 120, 80].map((w, i) => (
                <div key={i} style={{ height: 20, width: w, background: "#f1f5f9", borderRadius: 6, animation: "ux-pulse 1.6s ease-in-out infinite" }} />
            ))}
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`@keyframes ux-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, background: toast.type === "success" ? "#dcfce7" : "#fef2f2", border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: toast.type === "success" ? "#15803d" : "#dc2626", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => navigate("/admin")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        <FiArrowLeft size={14} /> Back
                    </button>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Banners</h1>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{banners.length} banner{banners.length !== 1 ? "s" : ""} total</p>
                    </div>
                </div>

                {/* ✅ Link instead of button+navigate */}
                <Link to="/admin/banners/new" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                    <FiPlus size={15} /> Add Banner
                </Link>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1, 2, 3].map(i => <Sk key={i} />)}
                </div>
            )}

            {/* Empty */}
            {!loading && banners.length === 0 && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "64px 24px", textAlign: "center" }}>
                    <FiImage size={36} style={{ color: "#cbd5e1", marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>No banners yet</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Add your first homepage banner</p>

                    {/* ✅ Link instead of button+navigate */}
                    <Link to="/admin/banners/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                        <FiPlus size={13} /> Add Banner
                    </Link>
                </div>
            )}

            {/* Banner List */}
            {!loading && banners.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {banners.map((banner, idx) => (
                        <div key={banner._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                            {/* Order badge */}
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                                {idx + 1}
                            </div>

                            {/* Thumbnail */}
                            <div style={{ width: 80, height: 48, borderRadius: 8, overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                                {banner.image?.url
                                    ? <img src={banner.image.url} alt={banner.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FiImage size={16} color="#cbd5e1" /></div>
                                }
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {banner.title || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No title</span>}
                                </p>
                                {banner.subtitle && (
                                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{banner.subtitle}</p>
                                )}
                                {banner.link && (
                                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>🔗 {banner.link}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div style={{ flexShrink: 0 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: banner.isActive ? "#dcfce7" : "#f1f5f9", color: banner.isActive ? "#15803d" : "#94a3b8", border: `1px solid ${banner.isActive ? "#bbf7d0" : "#e2e8f0"}` }}>
                                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: banner.isActive ? "#22c55e" : "#cbd5e1" }} />
                                    {banner.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                <button onClick={() => handleToggle(banner)} title={banner.isActive ? "Deactivate" : "Activate"}
                                    style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: banner.isActive ? "#f59e0b" : "#22c55e", cursor: "pointer" }}>
                                    {banner.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                                </button>
                                <Link to={`/admin/banners/${banner._id}/edit`} title="Edit"
                                    style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#2563eb", textDecoration: "none" }}>
                                    <FiEdit2 size={14} />
                                </Link>
                                <button onClick={() => handleDelete(banner._id)} disabled={deletingId === banner._id} title="Delete"
                                    style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #fecaca", borderRadius: 8, background: "#fef2f2", color: "#ef4444", cursor: "pointer", opacity: deletingId === banner._id ? 0.5 : 1 }}>
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminBanners;