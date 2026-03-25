import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/adminApi";
import {
    FaArrowLeft, FaUpload, FaTimes, FaPlus, FaTag,
    FaRupeeSign, FaList, FaBoxes, FaCheck, FaStar,
    FaGlobe, FaWeight, FaPalette, FaShippingFast,
} from "react-icons/fa";

const CATEGORIES = [
    {
        group: "Fashion", items: [
            { value: "mens-fashion", label: "Men's Fashion" },
            { value: "womens-fashion", label: "Women's Fashion" },
            { value: "kids-fashion", label: "Kids Fashion" },
            { value: "ethnic-wear", label: "Ethnic Wear" },
            { value: "western-wear", label: "Western Wear" },
            { value: "activewear", label: "Activewear & Sportswear" },
            { value: "innerwear", label: "Innerwear & Sleepwear" },
            { value: "winterwear", label: "Winter Wear" },
            { value: "swimwear", label: "Swimwear & Beachwear" },
        ]
    },
    {
        group: "Footwear", items: [
            { value: "mens-footwear", label: "Men's Footwear" },
            { value: "womens-footwear", label: "Women's Footwear" },
            { value: "kids-footwear", label: "Kids Footwear" },
            { value: "sports-footwear", label: "Sports Footwear" },
        ]
    },
    {
        group: "Accessories", items: [
            { value: "watches", label: "Watches" },
            { value: "sunglasses", label: "Sunglasses" },
            { value: "bags-wallets", label: "Bags & Wallets" },
            { value: "jewellery", label: "Jewellery" },
            { value: "belts-caps", label: "Belts & Caps" },
            { value: "scarves-stoles", label: "Scarves & Stoles" },
        ]
    },
    {
        group: "Electronics", items: [
            { value: "mobiles", label: "Mobiles & Tablets" },
            { value: "laptops", label: "Laptops & Computers" },
            { value: "audio", label: "Audio & Headphones" },
            { value: "cameras", label: "Cameras" },
            { value: "smart-devices", label: "Smart Devices & IoT" },
            { value: "accessories-electronics", label: "Electronic Accessories" },
        ]
    },
    {
        group: "Home & Living", items: [
            { value: "home-decor", label: "Home Décor" },
            { value: "bedding", label: "Bedding & Cushions" },
            { value: "kitchen", label: "Kitchen & Dining" },
            { value: "lighting", label: "Lighting" },
            { value: "furniture", label: "Furniture" },
            { value: "bath", label: "Bath & Spa" },
        ]
    },
    {
        group: "Beauty & Personal Care", items: [
            { value: "skincare", label: "Skincare" },
            { value: "haircare", label: "Haircare" },
            { value: "makeup", label: "Makeup & Cosmetics" },
            { value: "fragrances", label: "Fragrances & Perfumes" },
            { value: "grooming", label: "Men's Grooming" },
        ]
    },
    {
        group: "Gifts & Customized", items: [
            { value: "gifts", label: "Gifts & Hampers" },
            { value: "personalized", label: "Personalized Products" },
            { value: "photo-gifts", label: "Photo Gifts" },
            { value: "corporate-gifts", label: "Corporate Gifts" },
        ]
    },
    {
        group: "Sports & Outdoors", items: [
            { value: "fitness", label: "Fitness & Gym" },
            { value: "outdoor-sports", label: "Outdoor & Adventure" },
            { value: "yoga", label: "Yoga & Meditation" },
            { value: "cycling", label: "Cycling" },
        ]
    },
    {
        group: "Books & Stationery", items: [
            { value: "books", label: "Books" },
            { value: "stationery", label: "Stationery & Art" },
            { value: "office-supplies", label: "Office Supplies" },
        ]
    },
    {
        group: "Toys & Baby", items: [
            { value: "toys", label: "Toys & Games" },
            { value: "baby-care", label: "Baby Care" },
            { value: "baby-clothing", label: "Baby Clothing" },
        ]
    },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free Size"];
const HIGHLIGHT_KEYS = [
    "Fabric", "Sleeve", "Pattern", "Color", "Pack of", "Collar",
    "Fit", "Material", "Brand", "Origin", "Occasion", "Wash Care",
    "Warranty", "Model No", "Dimensions", "Weight",
];

const STYLES = `
    @keyframes ap-toast { from{opacity:0;transform:translateY(-12px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes ap-spin  { to{transform:rotate(360deg)} }
    @keyframes ap-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

    .ap-input {
        width: 100%;
        padding: 10px 13px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        color: #1e293b;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        box-sizing: border-box;
    }
    .ap-input::placeholder { color: #94a3b8; }
    .ap-input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    .ap-select {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 13px center;
        background-color: #fff;
    }
    .ap-size-btn {
        min-width: 52px;
        height: 34px;
        padding: 0 10px;
        border: 1px solid #e2e8f0;
        border-radius: 7px;
        background: #fff;
        color: #64748b;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
    }
    .ap-size-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .ap-size-btn.active { background: #eff6ff; border-color: #2563eb; color: #2563eb; }

    .ap-nav-btn {
        padding: 7px 16px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        background: #fff;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
    }
    .ap-nav-btn.active {
        border-color: #2563eb;
        background: #eff6ff;
        color: #2563eb;
    }
    .ap-nav-btn:hover:not(.active) {
        border-color: #cbd5e1;
        color: #1e293b;
        background: #f8fafc;
    }

    .ap-img-slot {
        aspect-ratio: 1;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        transition: border-color 0.15s;
    }
    .ap-img-slot:hover { border-color: #2563eb; }

    .ap-upload-zone {
        border: 1.5px dashed #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        transition: all 0.2s;
        aspect-ratio: 1;
    }
    .ap-upload-zone:hover { border-color: #2563eb; background: #eff6ff; }

    .ap-section { animation: ap-fade 0.2s ease forwards; }
    .ap-hl-remove { opacity: 0; transition: opacity 0.15s; }
    .ap-highlight-row:hover .ap-hl-remove { opacity: 1; }
`;

const Field = memo(({ label, hint, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#475569" }}>
                {label}
            </label>
            {hint && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>}
        </div>
        {children}
    </div>
));
Field.displayName = "Field";

const AdminAddProduct = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "", description: "", price: "", mrp: "", category: "",
        isCustomizable: false, tags: "", stock: "",
        brand: "", sku: "", weight: "", origin: "",
        returnPolicy: "7", shippingInfo: "", metaTitle: "", metaDesc: "",
        minOrderQty: "1", material: "", color: "", occasion: "",
    });
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [highlights, setHighlights] = useState([{ key: "", value: "" }]);
    const [activeSection, setActiveSection] = useState("basic");

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setError("");
    }, []);

    const toggleSize = useCallback((size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    }, []);

    const updateHighlight = useCallback((idx, field, value) => {
        setHighlights(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
    }, []);

    const addHighlight = useCallback(() => setHighlights(prev => [...prev, { key: "", value: "" }]), []);
    const removeHighlight = useCallback((idx) => setHighlights(prev => prev.filter((_, i) => i !== idx)), []);

    const handleImageChange = useCallback((e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (files.length > 6) return setError("Maximum 6 images allowed");
        for (const file of files) {
            if (file.size / (1024 * 1024) > 5) return setError(`${file.name} exceeds 5MB limit`);
        }
        const newImages = [...images, ...files].slice(0, 6);
        setImages(newImages);
        setPreviewImages(newImages.map(f => URL.createObjectURL(f)));
        setError("");
    }, [images]);

    const removeImage = useCallback((idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviewImages(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const discountPct = form.mrp && form.price && Number(form.mrp) > Number(form.price)
        ? Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100) : null;

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError("Product name is required");
        if (!form.price || Number(form.price) <= 0) return setError("Enter a valid selling price");
        if (form.mrp && Number(form.mrp) < Number(form.price)) return setError("MRP cannot be less than selling price");
        if (!form.category) return setError("Please select a category");
        if (images.length === 0) return setError("At least one product image is required");
        if (form.stock === "" || Number(form.stock) < 0) return setError("Enter valid stock quantity");

        try {
            setLoading(true); setError("");
            const fd = new FormData();
            const fields = ["name", "description", "price", "mrp", "category", "stock", "tags", "brand", "sku", "weight", "origin", "returnPolicy", "shippingInfo", "metaTitle", "metaDesc", "minOrderQty", "material", "color", "occasion"];
            fields.forEach(k => { if (form[k]?.toString().trim()) fd.append(k, form[k].toString().trim()); });
            fd.append("isCustomizable", form.isCustomizable ? "true" : "false");
            images.forEach(img => fd.append("images", img));
            if (selectedSizes.length > 0) fd.append("sizes", JSON.stringify(selectedSizes));
            const validH = highlights.filter(h => h.key.trim() && h.value.trim());
            if (validH.length > 0) {
                const obj = {};
                validH.forEach(h => { obj[h.key.trim()] = h.value.trim(); });
                fd.append("highlights", JSON.stringify(obj));
            }
            await api.post("/products", fd);
            showToast("success", "Product added successfully!");
            setTimeout(() => navigate("/admin/products"), 1400);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add product. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const SECTIONS = [
        { id: "basic", label: "Basic Info" },
        { id: "pricing", label: "Pricing & Stock" },
        { id: "details", label: "Details" },
        { id: "images", label: "Images" },
        { id: "seo", label: "SEO & Shipping" },
    ];

    const sectionIdx = SECTIONS.findIndex(s => s.id === activeSection);

    return (
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh", padding: "28px 20px 64px" }}>
            <style>{STYLES}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                    zIndex: 99999, display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 20px", borderRadius: 9,
                    background: toast.type === "success" ? "#059669" : "#ef4444",
                    color: "#fff", fontWeight: 600, fontSize: 13,
                    animation: "ap-toast 0.25s ease",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    whiteSpace: "nowrap",
                }}>
                    {toast.type === "success" ? <FaCheck size={11} /> : <FaTimes size={11} />}
                    {toast.msg}
                </div>
            )}

            <div style={{ maxWidth: 800, margin: "0 auto" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/products")}
                        style={{
                            width: 38, height: 38, borderRadius: 9,
                            background: "#fff", border: "1px solid #e2e8f0",
                            color: "#64748b", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s", flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#fff"; }}
                    >
                        <FaArrowLeft size={12} />
                    </button>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: 3 }}>
                            Products
                        </p>
                        <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>
                            Add New Product
                        </h1>
                    </div>
                </div>

                {/* ── Section Nav ── */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveSection(s.id)}
                            className={`ap-nav-btn${activeSection === s.id ? " active" : ""}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={submitHandler}>
                    {/* ── Card ── */}
                    <div style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}>
                        {/* Blue top accent */}
                        <div style={{ height: 3, background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)" }} />

                        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>

                            {/* ═══ BASIC INFO ═══ */}
                            {activeSection === "basic" && (
                                <div className="ap-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                    <Field label="Product Name" hint="*required">
                                        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Silk Embroidered Kurta" className="ap-input" />
                                    </Field>

                                    <Field label="Description" hint="detailed product description">
                                        <textarea name="description" value={form.description} onChange={handleChange}
                                            placeholder="Describe fabric, fit, occasion, care instructions..." rows={4}
                                            className="ap-input" style={{ resize: "vertical" }} />
                                    </Field>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <Field label="Brand" hint="optional">
                                            <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. UrbeXon" className="ap-input" />
                                        </Field>
                                        <Field label="SKU / Product Code" hint="optional">
                                            <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. UX-KRT-001" className="ap-input" />
                                        </Field>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                                        <Field label="Color" hint="optional">
                                            <input name="color" value={form.color} onChange={handleChange} placeholder="e.g. Navy Blue" className="ap-input" />
                                        </Field>
                                        <Field label="Material" hint="optional">
                                            <input name="material" value={form.material} onChange={handleChange} placeholder="e.g. Cotton" className="ap-input" />
                                        </Field>
                                        <Field label="Occasion" hint="optional">
                                            <input name="occasion" value={form.occasion} onChange={handleChange} placeholder="e.g. Casual" className="ap-input" />
                                        </Field>
                                    </div>

                                    <Field label="Category" hint="*required">
                                        <select name="category" value={form.category} onChange={handleChange} className="ap-input ap-select">
                                            <option value="">— Select Category —</option>
                                            {CATEGORIES.map(group => (
                                                <optgroup key={group.group} label={group.group}>
                                                    {group.items.map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Tags" hint="comma separated — helps search">
                                        <div style={{ position: "relative" }}>
                                            <FaTag size={10} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                            <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. kurta, ethnic, festive" className="ap-input" style={{ paddingLeft: 30 }} />
                                        </div>
                                    </Field>

                                    {/* Customizable Toggle */}
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "14px 16px",
                                        background: form.isCustomizable ? "#eff6ff" : "#f8fafc",
                                        border: `1px solid ${form.isCustomizable ? "#2563eb" : "#e2e8f0"}`,
                                        borderRadius: 9,
                                        transition: "all 0.2s",
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 2 }}>Customizable Product</p>
                                            <p style={{ fontSize: 11, color: "#94a3b8" }}>Customers can request personalised designs or text</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, isCustomizable: !prev.isCustomizable }))}
                                            style={{
                                                position: "relative", width: 44, height: 24,
                                                background: form.isCustomizable ? "#2563eb" : "#e2e8f0",
                                                border: "none", borderRadius: 12,
                                                cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                                            }}
                                        >
                                            <div style={{
                                                position: "absolute", top: 2,
                                                width: 20, height: 20, borderRadius: "50%",
                                                background: "#fff",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                                transition: "left 0.2s",
                                                left: form.isCustomizable ? 22 : 2,
                                            }} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ═══ PRICING & STOCK ═══ */}
                            {activeSection === "pricing" && (
                                <div className="ap-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <Field label="Selling Price (₹)" hint="*required">
                                            <div style={{ position: "relative" }}>
                                                <FaRupeeSign size={10} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0" min="1" className="ap-input" style={{ paddingLeft: 28 }} />
                                            </div>
                                        </Field>
                                        <Field label="MRP (₹)" hint="original / compare price">
                                            <div style={{ position: "relative" }}>
                                                <FaRupeeSign size={10} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input type="number" name="mrp" value={form.mrp} onChange={handleChange} placeholder="0" min="1" className="ap-input" style={{ paddingLeft: 28 }} />
                                            </div>
                                        </Field>
                                    </div>

                                    {discountPct && (
                                        <div style={{
                                            padding: "12px 16px", borderRadius: 9,
                                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                                            display: "flex", alignItems: "center", gap: 12,
                                        }}>
                                            <span style={{ color: "#059669", fontWeight: 800, fontSize: 22 }}>{discountPct}%</span>
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>Discount Applied</p>
                                                <p style={{ fontSize: 11, color: "#64748b" }}>Customer saves ₹{(Number(form.mrp) - Number(form.price)).toLocaleString("en-IN")}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <Field label="Stock Quantity" hint="*required">
                                            <div style={{ position: "relative" }}>
                                                <FaBoxes size={10} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="e.g. 50" min="0" className="ap-input" style={{ paddingLeft: 28 }} />
                                            </div>
                                            {form.stock !== "" && (
                                                <p style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: Number(form.stock) > 0 ? "#059669" : "#ef4444" }}>
                                                    {Number(form.stock) > 0 ? `✓ In Stock — ${form.stock} units` : "✕ Out of Stock"}
                                                </p>
                                            )}
                                        </Field>
                                        <Field label="Min. Order Quantity" hint="per customer">
                                            <input type="number" name="minOrderQty" value={form.minOrderQty} onChange={handleChange} placeholder="1" min="1" className="ap-input" />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* ═══ DETAILS ═══ */}
                            {activeSection === "details" && (
                                <div className="ap-section" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    <Field label="Available Sizes" hint="click to select multiple">
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {ALL_SIZES.map(size => (
                                                <button key={size} type="button" onClick={() => toggleSize(size)}
                                                    className={`ap-size-btn${selectedSizes.includes(size) ? " active" : ""}`}>
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedSizes.length > 0 && (
                                            <p style={{ fontSize: 11, color: "#2563eb", marginTop: 6, fontWeight: 600 }}>
                                                Selected: {selectedSizes.join(" · ")}
                                            </p>
                                        )}
                                    </Field>

                                    <Field label="Product Highlights" hint="key specs shown on product page">
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {highlights.map((h, idx) => (
                                                <div key={idx} className="ap-highlight-row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <select value={h.key} onChange={e => updateHighlight(idx, "key", e.target.value)}
                                                        className="ap-input ap-select" style={{ flex: "0 0 150px", padding: "9px 32px 9px 11px" }}>
                                                        <option value="">Select key</option>
                                                        {HIGHLIGHT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                                    </select>
                                                    <input value={h.value} onChange={e => updateHighlight(idx, "value", e.target.value)}
                                                        placeholder="Value..." className="ap-input" style={{ flex: 1, padding: "9px 12px" }} />
                                                    {highlights.length > 1 && (
                                                        <button type="button" onClick={() => removeHighlight(idx)}
                                                            className="ap-hl-remove"
                                                            style={{
                                                                width: 30, height: 30, borderRadius: 7,
                                                                background: "#fef2f2", border: "1px solid #fecaca",
                                                                color: "#ef4444", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}>
                                                            <FaTimes size={9} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={addHighlight}
                                                style={{
                                                    display: "inline-flex", alignItems: "center", gap: 5,
                                                    fontSize: 12, fontWeight: 600, color: "#2563eb",
                                                    background: "none", border: "none", cursor: "pointer",
                                                    padding: "4px 0", fontFamily: "inherit",
                                                }}>
                                                <FaPlus size={9} /> Add highlight
                                            </button>
                                        </div>
                                    </Field>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <Field label="Weight" hint="grams — for shipping calc">
                                            <div style={{ position: "relative" }}>
                                                <FaWeight size={9} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input name="weight" value={form.weight} onChange={handleChange} placeholder="e.g. 250g" className="ap-input" style={{ paddingLeft: 28 }} />
                                            </div>
                                        </Field>
                                        <Field label="Country of Origin">
                                            <div style={{ position: "relative" }}>
                                                <FaGlobe size={9} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input name="origin" value={form.origin} onChange={handleChange} placeholder="e.g. India" className="ap-input" style={{ paddingLeft: 28 }} />
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* ═══ IMAGES ═══ */}
                            {activeSection === "images" && (
                                <div className="ap-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                        <div>
                                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#475569", marginBottom: 3 }}>
                                                Product Images
                                            </p>
                                            <p style={{ fontSize: 11, color: "#94a3b8" }}>
                                                First image = main display. Max 6 · 5MB each. Square images work best.
                                            </p>
                                        </div>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            color: previewImages.length >= 6 ? "#059669" : "#2563eb",
                                            background: previewImages.length >= 6 ? "#f0fdf4" : "#eff6ff",
                                            border: `1px solid ${previewImages.length >= 6 ? "#bbf7d0" : "#bfdbfe"}`,
                                            padding: "3px 10px", borderRadius: 20,
                                        }}>
                                            {previewImages.length}/6
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                        {previewImages.map((img, i) => (
                                            <div key={i} className="ap-img-slot">
                                                <img src={img} alt={`Product ${i + 1}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                                {i === 0 && (
                                                    <div style={{
                                                        position: "absolute", bottom: 7, left: 7,
                                                        background: "#2563eb", color: "#fff",
                                                        fontSize: 8, fontWeight: 800,
                                                        padding: "2px 7px", borderRadius: 4,
                                                        letterSpacing: "0.1em",
                                                    }}>MAIN</div>
                                                )}
                                                <button type="button" onClick={() => removeImage(i)}
                                                    style={{
                                                        position: "absolute", top: 6, right: 6,
                                                        width: 22, height: 22, borderRadius: 6,
                                                        background: "rgba(0,0,0,0.6)", border: "none",
                                                        color: "#fff", cursor: "pointer",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#ef4444"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
                                                >
                                                    <FaTimes size={8} />
                                                </button>
                                            </div>
                                        ))}
                                        {previewImages.length < 6 && (
                                            <label className="ap-upload-zone">
                                                <FaUpload size={18} style={{ color: "#2563eb", marginBottom: 8, opacity: 0.7 }} />
                                                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textAlign: "center" }}>Click to upload</p>
                                                <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>PNG · JPG · WEBP</p>
                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                                            </label>
                                        )}
                                    </div>

                                    {previewImages.length === 0 && (
                                        <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>⚠ At least 1 image required</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ SEO & SHIPPING ═══ */}
                            {activeSection === "seo" && (
                                <div className="ap-section" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                    <div style={{
                                        padding: "11px 14px", borderRadius: 8,
                                        background: "#eff6ff", border: "1px solid #bfdbfe",
                                    }}>
                                        <p style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>
                                            💡 SEO helps your product rank on Google & search engines
                                        </p>
                                    </div>

                                    <Field label="Meta Title" hint="optional — ~60 chars">
                                        <input name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="e.g. Buy Premium Silk Kurta Online | UrbeXon" className="ap-input" />
                                    </Field>

                                    <Field label="Meta Description" hint="optional — ~160 chars">
                                        <textarea name="metaDesc" value={form.metaDesc} onChange={handleChange}
                                            placeholder="Brief description for search engines..." rows={3}
                                            className="ap-input" style={{ resize: "none" }} />
                                    </Field>

                                    <div style={{ height: 1, background: "#f1f5f9" }} />

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <Field label="Return Policy" hint="days">
                                            <select name="returnPolicy" value={form.returnPolicy} onChange={handleChange} className="ap-input ap-select">
                                                <option value="0">No Returns</option>
                                                <option value="7">7 Days</option>
                                                <option value="15">15 Days</option>
                                                <option value="30">30 Days</option>
                                            </select>
                                        </Field>
                                        <Field label="Shipping Info" hint="optional">
                                            <div style={{ position: "relative" }}>
                                                <FaShippingFast size={10} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                                <input name="shippingInfo" value={form.shippingInfo} onChange={handleChange} placeholder="e.g. Ships in 2–3 days" className="ap-input" style={{ paddingLeft: 30 }} />
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Error ── */}
                        {error && (
                            <div style={{
                                margin: "0 28px 20px",
                                padding: "10px 14px", borderRadius: 8,
                                background: "#fef2f2", border: "1px solid #fecaca",
                                color: "#dc2626", fontSize: 12, fontWeight: 600,
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                ⚠ {error}
                            </div>
                        )}

                        {/* ── Actions ── */}
                        <div style={{ padding: "0 28px 28px", display: "flex", gap: 8, alignItems: "center" }}>
                            {/* Prev / Next */}
                            <button type="button"
                                onClick={() => { if (sectionIdx > 0) setActiveSection(SECTIONS[sectionIdx - 1].id); }}
                                disabled={sectionIdx === 0}
                                style={{
                                    width: 36, height: 40, borderRadius: 8,
                                    background: "#f8fafc", border: "1px solid #e2e8f0",
                                    color: "#64748b", cursor: sectionIdx === 0 ? "not-allowed" : "pointer",
                                    fontSize: 14, fontWeight: 700, opacity: sectionIdx === 0 ? 0.4 : 1,
                                    transition: "all 0.15s",
                                }}>←</button>
                            <button type="button"
                                onClick={() => { if (sectionIdx < SECTIONS.length - 1) setActiveSection(SECTIONS[sectionIdx + 1].id); }}
                                disabled={sectionIdx === SECTIONS.length - 1}
                                style={{
                                    width: 36, height: 40, borderRadius: 8,
                                    background: "#f8fafc", border: "1px solid #e2e8f0",
                                    color: "#64748b", cursor: sectionIdx === SECTIONS.length - 1 ? "not-allowed" : "pointer",
                                    fontSize: 14, fontWeight: 700, opacity: sectionIdx === SECTIONS.length - 1 ? 0.4 : 1,
                                    transition: "all 0.15s",
                                }}>→</button>

                            <button type="button" onClick={() => navigate("/admin/products")}
                                style={{
                                    flex: 1, padding: "11px",
                                    background: "#fff", border: "1px solid #e2e8f0",
                                    borderRadius: 8, color: "#64748b",
                                    fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#1e293b"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#64748b"; }}
                            >
                                Cancel
                            </button>

                            <button type="submit" disabled={loading}
                                style={{
                                    flex: 2, padding: "11px",
                                    background: loading ? "#93c5fd" : "#2563eb",
                                    color: "#fff", border: "none", borderRadius: 8,
                                    fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    letterSpacing: "0.02em",
                                    boxShadow: loading ? "none" : "0 2px 8px rgba(37,99,235,0.3)",
                                    transition: "all 0.15s",
                                }}>
                                {loading ? (
                                    <>
                                        <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "ap-spin 0.7s linear infinite" }} />
                                        Publishing...
                                    </>
                                ) : (
                                    <><FaPlus size={10} /> Publish Product</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAddProduct;