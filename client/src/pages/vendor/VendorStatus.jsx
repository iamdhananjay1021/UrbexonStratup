import { useEffect, useState } from "react";
import { getVendorStatus } from "../../api/vendorApi";

const VendorStatus = () => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getVendorStatus();
                setStatus(data);
            } catch (err) {
                setError(err.response?.data?.message || "No vendor application found yet.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <p>Loading status...</p>;

    if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Application Status</h2>
            <div style={{ display: "grid", gap: 10 }}>
                <p><strong>Shop:</strong> {status.shopName}</p>
                <p><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{status.status}</span></p>
                {status.rejectionReason && <p><strong>Reason:</strong> {status.rejectionReason}</p>}
                {status.appliedAt && <p><strong>Applied At:</strong> {new Date(status.appliedAt).toLocaleString()}</p>}
            </div>
        </div>
    );
};

export default VendorStatus;
