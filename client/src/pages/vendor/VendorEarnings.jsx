import { useEffect, useState } from "react";
import { getVendorEarnings, getVendorWeeklyEarnings } from "../../api/vendorApi";

const VendorEarnings = () => {
    const [summary, setSummary] = useState(null);
    const [weekly, setWeekly] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [{ data: earnings }, { data: weeklyData }] = await Promise.all([
                    getVendorEarnings(),
                    getVendorWeeklyEarnings(),
                ]);
                setSummary(earnings);
                setWeekly(weeklyData);
            } catch (err) {
                setError(err.response?.data?.message || "Unable to fetch earnings");
            }
        })();
    }, []);

    if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;
    if (!summary || !weekly) return <p>Loading earnings...</p>;

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Earnings</h2>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
                <p><strong>Total Earned:</strong> ₹{Number(summary.totalEarned || 0).toLocaleString("en-IN")}</p>
                <p><strong>Pending:</strong> ₹{Number(summary.pendingAmount || 0).toLocaleString("en-IN")}</p>
                <p><strong>Commission:</strong> {summary.commissionRate}%</p>
            </div>

            <h3>Last 7 Days</h3>
            <ul>
                {Object.entries(weekly.dailyBreakdown || {}).map(([day, amount]) => (
                    <li key={day}>{day}: ₹{Number(amount).toLocaleString("en-IN")}</li>
                ))}
            </ul>
        </div>
    );
};

export default VendorEarnings;
