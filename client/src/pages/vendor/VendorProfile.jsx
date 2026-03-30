import { useEffect, useState } from "react";
import { getVendorProfile, updateVendorProfile } from "../../api/vendorApi";

const VendorProfile = () => {
    const [form, setForm] = useState({
        whatsapp: "",
        alternatePhone: "",
        shopDescription: "",
        minOrderAmount: 0,
        preparationTime: 30,
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getVendorProfile();
                const vendor = data.vendor;
                setForm({
                    whatsapp: vendor.whatsapp || "",
                    alternatePhone: vendor.alternatePhone || "",
                    shopDescription: vendor.shopDescription || "",
                    minOrderAmount: vendor.minOrderAmount || 0,
                    preparationTime: vendor.preparationTime || 30,
                });
            } catch (err) {
                setMessage(err.response?.data?.message || "Unable to load profile");
            }
        })();
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await updateVendorProfile(form);
            setMessage(data.message || "Profile updated");
        } catch (err) {
            setMessage(err.response?.data?.message || "Update failed");
        }
    };

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Vendor Profile</h2>
            {message && <p style={{ color: message.toLowerCase().includes("failed") ? "#dc2626" : "#0f766e" }}>{message}</p>}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 620 }}>
                <input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="WhatsApp Number" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                <input name="alternatePhone" value={form.alternatePhone} onChange={onChange} placeholder="Alternate Phone" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                <textarea name="shopDescription" value={form.shopDescription} onChange={onChange} rows={4} placeholder="Shop Description" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={onChange} placeholder="Minimum Order" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }} />
                <input type="number" name="preparationTime" value={form.preparationTime} onChange={onChange} placeholder="Preparation Time (minutes)" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }} />

                <button type="submit" style={{ width: "fit-content", padding: "10px 16px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 700 }}>
                    Save Profile
                </button>
            </form>
        </div>
    );
};

export default VendorProfile;
