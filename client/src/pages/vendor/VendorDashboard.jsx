import { useEffect, useState } from "react";
import { getVendorProfile, toggleShopStatus } from "../../api/vendorApi";

const Card = ({ label, value }) => (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
        <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{label}</p>
        <h3 style={{ margin: "4px 0 0", fontSize: 20 }}>{value}</h3>
    </div>
);

const VendorDashboard = () => {
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const loadProfile = async () => {
        try {
            const { data } = await getVendorProfile();
            setVendor(data.vendor);
        } catch (err) {
            setMessage(err.response?.data?.message || "Unable to load vendor profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleToggle = async () => {
        try {
            const { data } = await toggleShopStatus();
            setMessage(data.message);
            loadProfile();
        } catch (err) {
            setMessage(err.response?.data?.message || "Unable to change shop status");
        }
    };

    if (loading) return <p>Loading dashboard...</p>;

    if (!vendor) return <p style={{ color: "#dc2626" }}>{message || "Vendor not found"}</p>;

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Vendor Dashboard</h2>
            {message && <p style={{ color: "#0f766e" }}>{message}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 14 }}>
                <Card label="Shop Name" value={vendor.shopName} />
                <Card label="Status" value={vendor.status} />
                <Card label="Total Orders" value={vendor.totalOrders || 0} />
                <Card label="Total Revenue" value={`₹${(vendor.totalRevenue || 0).toLocaleString("en-IN")}`} />
            </div>

            <button onClick={handleToggle} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: vendor.isOpen ? "#dc2626" : "#16a34a", color: "#fff", fontWeight: 700 }}>
                {vendor.isOpen ? "Close Shop" : "Open Shop"}
            </button>
        </div>
    );
};

export default VendorDashboard;
