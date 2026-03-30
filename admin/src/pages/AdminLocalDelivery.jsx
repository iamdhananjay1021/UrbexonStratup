import { useEffect, useState } from "react";
import api from "../api/adminApi";

const providers = [
    { value: "LOCAL_RIDER", label: "Local Rider" },
    { value: "VENDOR_SELF", label: "Vendor Self" },
    { value: "SHIPROCKET", label: "Shiprocket" },
];

const AdminLocalDelivery = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [assigningId, setAssigningId] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/orders/admin/local-delivery?limit=50");
            setOrders(data.orders || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load local delivery orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const assign = async (orderId, provider) => {
        const riderName = prompt("Rider Name (optional)") || "";
        const riderPhone = prompt("Rider Phone (optional)") || "";
        const note = prompt("Note (optional)") || "";

        try {
            setAssigningId(orderId);
            await api.put(`/orders/admin/local-delivery/${orderId}/assign`, {
                provider,
                riderName,
                riderPhone,
                note,
            });
            await load();
        } catch (err) {
            alert(err.response?.data?.message || "Assignment failed");
        } finally {
            setAssigningId(null);
        }
    };

    if (loading) return <div style={{ padding: 24 }}>Loading local delivery queue...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ marginTop: 0, fontSize: 22 }}>Urbexon Hour Dispatch</h1>
            <p style={{ color: "#64748b", marginTop: 4 }}>Assign local rider / vendor self for 0–15 km orders.</p>

            {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#fef2f2", color: "#dc2626" }}>{error}</div>}

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {orders.length === 0 && <p style={{ color: "#64748b" }}>No active Urbexon Hour orders.</p>}

                {orders.map((o) => (
                    <div key={o._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700 }}>#{o._id.slice(-8).toUpperCase()} · {o.customerName}</p>
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569" }}>{o.address}</p>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                                    Distance: {Number(o.delivery?.distanceKm || 0).toFixed(1)} km · Provider: {o.delivery?.provider || "-"}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                {providers.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => assign(o._id, p.value)}
                                        disabled={assigningId === o._id}
                                        style={{
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid #cbd5e1",
                                            background: o.delivery?.provider === p.value ? "#dbeafe" : "#fff",
                                            color: o.delivery?.provider === p.value ? "#1d4ed8" : "#334155",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {assigningId === o._id ? "Saving..." : p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminLocalDelivery;
