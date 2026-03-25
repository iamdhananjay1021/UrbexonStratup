import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/adminApi";
import {
    FiArrowLeft, FiUpload, FiX, FiPlus,
    FiTag, FiDollarSign, FiList, FiBox, FiCheckCircle,
} from "react-icons/fi";
import { CATEGORIES } from "../data/categories";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const HIGHLIGHT_KEYS = ["Fabric", "Sleeve", "Pattern", "Color", "Pack of", "Collar", "Fit", "Material", "Brand"];

/* ── Shared input style ── */
const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, color: "#1e293b", background: "#fff",
    fontFamily: "'Inter', system-ui, sans-serif",
    outline: "none", transition: "border-color 0.2s",
    boxSizing: "border-box",
};
const InputField = ({ label, hint, children }) => (
    <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            {label} {hint && <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
        </label>
        {children}
    </div>
);

const AdminEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", description: "", price: "", mrp: "",
        category: "", isCustomizable: false, tags: "", stock: "",
    });
    const [images, setImages] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [highlights, setHighlights] = useState([{ key: "", value: "" }]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/products/${id}`);
                setForm({
                    name: data.name || "", description: data.description || "",
                    price: data.price?.toString() || "", mrp: data.mrp?.toString() || "",
                    category: data.category || "", isCustomizable: Boolean(data.isCustomizable),
                    tags: data.tags?.join(", ") || "", stock: data.stock?.toString() ?? "0",
                });
                setCurrentImages(data.images || []);
                if (data.sizes?.length > 0) setSelectedSizes(data.sizes);
                if (data.highlights && Object.keys(data.highlights).length > 0) {
                    const entries = data.highlights instanceof Map
                        ? [...data.highlights.entries()]
                        : Object.entries(data.highlights);
                    setHighlights(entries.map(([key, value]) => ({ key, value })));
                }
            } catch {
                setError("Failed to load product");
            } finally { setLoading(false); }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setError("");
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const updateHighlight = (idx, field, value) => {
        setHighlights(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
    };

    const addHighlight = () => setHighlights(prev => [...prev, { key: "", value: "" }]);
    const removeHighlight = (idx) => setHighlights(prev => prev.filter((_, i) => i !== idx));

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length > 5) return setError("Maximum 5 images allowed");
        for (const file of files) {
            if (file.size / (1024 * 1024) > 5) return setError(`${file.name} exceeds 5MB limit`);
        }
        setImages(files);
        setPreviewImages(files.map(f => URL.createObjectURL(f)));
        setError("");
    };

    const removeNewImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviewImages(prev => prev.filter((_, i) => i !== idx));
    };

    const discountPct = form.mrp && form.price && Number(form.mrp) > Number(form.price)
        ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100)
        : null;

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError("Product name is required");
        if (!form.price || Number(form.price) <= 0) return setError("Enter a valid price");
        if (!form.category) return setError("Please select a category");
        if (form.mrp && Number(form.mrp) < Number(form.price)) return setError("MRP cannot be less than selling price");
        if (form.stock === "" || Number(form.stock) < 0) return setError("Enter a valid stock quantity (0 or more)");

        try {
            setSaving(true); setError("");
            const formData = new FormData();
            formData.append("name", form.name.trim());
            formData.append("description", form.description.trim());
            formData.append("price", Number(form.price));
            if (form.mrp && Number(form.mrp) > 0) formData.append("mrp", Number(form.mrp));
            else formData.append("mrp", "");
            formData.append("category", form.category);
            formData.append("isCustomizable", form.isCustomizable ? "true" : "false");
            formData.append("stock", Number(form.stock));
            if (form.tags.trim()) formData.append("tags", form.tags.trim());
            images.forEach(img => formData.append("images", img));
            if (selectedSizes.length > 0) formData.append("sizes", JSON.stringify(selectedSizes));
            const validHighlights = highlights.filter(h => h.key && h.value);
            if (validHighlights.length > 0) {
                const obj = {};
                validHighlights.forEach(h => { obj[h.key] = h.value; });
                formData.append("highlights", JSON.stringify(obj));
            }
            await api.put(`/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
            showToast("success", "Product updated successfully!");
            setTimeout(() => navigate("/admin/products"), 1400);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update product");
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "ux-spin 0.8s linear infinite" }} />
            <style>{`@keyframes ux-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`@keyframes ux-spin{to{transform:rotate(360deg)}} @keyframes ux-slide-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 20, right: 20, zIndex: 1000,
                    background: toast.type === "success" ? "#dcfce7" : "#fef2f2",
                    border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                    color: toast.type === "success" ? "#15803d" : "#ef4444",
                    padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8, animation: "ux-slide-up 0.25s ease",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}>
                    <FiCheckCircle size={15} /> {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => navigate("/admin/products")}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <FiArrowLeft size={14} /> Back
                </button>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>Edit Product</h1>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Update product details</p>
                </div>
            </div>

            <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <form onSubmit={submitHandler}>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* Name */}
                        <InputField label="Product Name">
                            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Premium Cotton T-Shirt"
                                style={inputStyle} onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                        </InputField>

                        {/* Description */}
                        <InputField label="Description" hint="(optional)">
                            <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                                placeholder="Describe the product..."
                                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                                onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                        </InputField>

                        {/* Price + MRP */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <InputField label="Selling Price (₹)">
                                <div style={{ position: "relative" }}>
                                    <FiDollarSign size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="0"
                                        style={{ ...inputStyle, paddingLeft: 32 }}
                                        onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                                </div>
                            </InputField>
                            <InputField label="MRP (₹)" hint="(optional)">
                                <div style={{ position: "relative" }}>
                                    <FiDollarSign size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input name="mrp" type="number" min="0" value={form.mrp} onChange={handleChange} placeholder="0"
                                        style={{ ...inputStyle, paddingLeft: 32 }}
                                        onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                                </div>
                                {discountPct && (
                                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                                        <FiTag size={11} /> {discountPct}% off
                                    </div>
                                )}
                            </InputField>
                        </div>

                        {/* Stock + Category */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <InputField label="Stock Quantity">
                                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0"
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                            </InputField>
                            <InputField label="Category">
                                <select name="category" value={form.category} onChange={handleChange}
                                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                                    onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
                                    <option value="">Select category</option>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </InputField>
                        </div>

                        {/* Tags */}
                        <InputField label="Tags" hint="(comma separated, optional)">
                            <div style={{ position: "relative" }}>
                                <FiTag size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input name="tags" value={form.tags} onChange={handleChange} placeholder="t-shirt, casual, cotton"
                                    style={{ ...inputStyle, paddingLeft: 32 }}
                                    onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                            </div>
                        </InputField>

                        {/* Sizes */}
                        <InputField label="Sizes" hint="(optional)">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {ALL_SIZES.map(size => (
                                    <button key={size} type="button" onClick={() => toggleSize(size)}
                                        style={{
                                            padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                                            border: selectedSizes.includes(size) ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                                            background: selectedSizes.includes(size) ? "#eff6ff" : "#fff",
                                            color: selectedSizes.includes(size) ? "#2563eb" : "#64748b",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}>
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {selectedSizes.length > 0 && (
                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Selected: <b style={{ color: "#1e293b" }}>{selectedSizes.join(", ")}</b></p>
                            )}
                        </InputField>

                        {/* Highlights */}
                        <InputField label="Product Highlights" hint="(optional)">
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {highlights.map((h, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <select value={h.key} onChange={e => updateHighlight(idx, "key", e.target.value)}
                                            style={{ flex: 1, ...inputStyle, cursor: "pointer" }}
                                            onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
                                            <option value="">Select key</option>
                                            {HIGHLIGHT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                        <input value={h.value} onChange={e => updateHighlight(idx, "value", e.target.value)}
                                            placeholder="Value" style={{ flex: 1, ...inputStyle }}
                                            onFocus={e => e.target.style.borderColor = "#93c5fd"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                                        {highlights.length > 1 && (
                                            <button type="button" onClick={() => removeHighlight(idx)}
                                                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>
                                                <FiX size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addHighlight}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}>
                                    <FiPlus size={13} /> Add highlight
                                </button>
                            </div>
                        </InputField>

                        {/* Current Images */}
                        {currentImages.length > 0 && previewImages.length === 0 && (
                            <InputField label="Current Images">
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                                    {currentImages.map((img, i) => (
                                        <div key={i} style={{ position: "relative" }}>
                                            <img src={img.url} alt={`product ${i + 1}`} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                            {i === 0 && <span style={{ position: "absolute", bottom: 5, left: 5, background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>Main</span>}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Upload new images below to replace</p>
                            </InputField>
                        )}

                        {/* Upload Images */}
                        <InputField label={previewImages.length > 0 ? "New Images (will replace current)" : "Replace Images"} hint="(optional, max 5)">
                            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 110, border: "2px dashed #e2e8f0", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "#eff6ff"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "transparent"; }}>
                                <FiUpload size={20} color="#94a3b8" style={{ marginBottom: 8 }} />
                                <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Click to upload images</p>
                                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>PNG, JPG, WEBP · Max 5MB each</p>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                            </label>
                            {previewImages.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
                                    {previewImages.map((img, i) => (
                                        <div key={i} style={{ position: "relative" }}>
                                            <img src={img} alt={`preview ${i + 1}`} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                            <button type="button" onClick={() => removeNewImage(i)}
                                                style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                <FiX size={10} />
                                            </button>
                                            {i === 0 && <span style={{ position: "absolute", bottom: 5, left: 5, background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>Main</span>}
                                        </div>
                                    ))}
                                    {previewImages.length < 5 && (
                                        <label style={{ width: "100%", height: 80, border: "2px dashed #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                            <FiPlus size={18} color="#94a3b8" />
                                            <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </InputField>

                        {/* Customizable Toggle */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                            <div>
                                <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>Customizable Product</p>
                                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Customers can request custom designs</p>
                            </div>
                            <button type="button"
                                onClick={() => setForm(prev => ({ ...prev, isCustomizable: !prev.isCustomizable }))}
                                style={{ position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", background: form.isCustomizable ? "#2563eb" : "#e2e8f0", cursor: "pointer", transition: "background 0.2s" }}>
                                <div style={{ position: "absolute", top: 2, width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s", left: form.isCustomizable ? 22 : 2 }} />
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                                ⚠ {error}
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                            <button type="button" onClick={() => navigate("/admin/products")}
                                style={{ flex: 1, padding: "11px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                style={{ flex: 1, padding: "11px", background: saving ? "#93c5fd" : "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}>
                                {saving ? (
                                    <>
                                        <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "ux-spin 0.8s linear infinite" }} />
                                        Updating...
                                    </>
                                ) : "Update Product"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminEditProduct;