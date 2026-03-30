import { useState } from "react";
import { registerVendor } from "../../api/vendorApi";

const defaultForm = {
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    shopCategory: "",
    shopDescription: "",
    servicePincodes: "",
};

const VendorApply = () => {
    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const fd = new FormData();
            fd.append("shopName", form.shopName);
            fd.append("ownerName", form.ownerName);
            fd.append("email", form.email);
            fd.append("phone", form.phone);
            fd.append("shopCategory", form.shopCategory);
            fd.append("shopDescription", form.shopDescription);
            const codes = form.servicePincodes
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
            fd.append("servicePincodes", JSON.stringify(codes));

            const { data } = await registerVendor(fd);
            setMessage(data.message || "Application submitted successfully.");
            setForm(defaultForm);
        } catch (err) {
            setMessage(err.response?.data?.message || "Unable to submit application");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Vendor Application</h2>
            <p style={{ color: "#64748b", marginBottom: 18 }}>Fill basic details. You can update full profile after approval.</p>

            {message && (
                <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, background: "#f1f5f9", color: "#0f172a" }}>{message}</div>
            )}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 700 }}>
                {[
                    ["shopName", "Shop Name"],
                    ["ownerName", "Owner Name"],
                    ["email", "Email"],
                    ["phone", "Phone"],
                    ["shopCategory", "Shop Category"],
                    ["servicePincodes", "Service Pincodes (comma separated)"],
                ].map(([name, label]) => (
                    <input
                        key={name}
                        name={name}
                        value={form[name]}
                        onChange={onChange}
                        required={["shopName", "ownerName", "email", "phone"].includes(name)}
                        placeholder={label}
                        style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                    />
                ))}

                <textarea
                    name="shopDescription"
                    value={form.shopDescription}
                    onChange={onChange}
                    rows={4}
                    placeholder="Shop Description"
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                />

                <button disabled={loading} type="submit" style={{ width: "fit-content", padding: "10px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700 }}>
                    {loading ? "Submitting..." : "Submit Application"}
                </button>
            </form>
        </div>
    );
};

export default VendorApply;
