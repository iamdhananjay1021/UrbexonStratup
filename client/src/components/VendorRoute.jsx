import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getVendorStatus } from "../api/vendorApi";

const VendorRoute = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState({ applied: false, status: null });

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await getVendorStatus();
                if (active) setVendor({ applied: Boolean(data?.applied), status: data?.status || null });
            } catch (err) {
                if (active) {
                    if (err.response?.status === 404) {
                        setVendor({ applied: false, status: null });
                    } else {
                        setVendor({ applied: true, status: "pending" });
                    }
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
                <p style={{ color: "#64748b" }}>Checking vendor access...</p>
            </div>
        );
    }

    const current = location.pathname;
    const isApply = current === "/vendor/apply";
    const isStatus = current === "/vendor" || current === "/vendor/status";

    if (!vendor.applied) {
        return isApply ? <Outlet /> : <Navigate to="/vendor/apply" replace />;
    }

    if (vendor.status !== "approved") {
        return (isStatus || isApply) ? <Outlet /> : <Navigate to="/vendor/status" replace />;
    }

    if (isApply) return <Navigate to="/vendor/dashboard" replace />;

    return <Outlet />;
};

export default VendorRoute;
