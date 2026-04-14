import { useEffect, useRef, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Fix Leaflet default marker icons in Vite ──────────────── */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/* ── Rider icon ────────────────────────────────────────────── */
const riderIcon = L.divIcon({
    className: "",
    html: `<div style="position:relative;width:32px;height:32px;">
        <div style="position:absolute;inset:0;background:rgba(59,130,246,0.2);border-radius:50%;animation:at-pulse 2s infinite"></div>
        <div style="position:absolute;top:6px;left:6px;width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px">🏍️</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

/* ── Destination icon ──────────────────────────────────────── */
const destIcon = L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:22px;height:22px;background:#ef4444;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px">📍</div>
        <div style="width:2px;height:6px;background:#ef4444"></div>
    </div>`,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -30],
});

/* ── Auto-fit bounds ───────────────────────────────────────── */
const FitBounds = ({ positions }) => {
    const map = useMap();
    const prevKey = useRef("");

    useEffect(() => {
        const valid = positions.filter(Boolean);
        if (valid.length === 0) return;
        const key = valid.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
        if (key === prevKey.current) return;
        prevKey.current = key;

        if (valid.length === 1) {
            map.setView(valid[0], 15, { animate: true });
        } else {
            map.fitBounds(L.latLngBounds(valid), { padding: [30, 30], maxZoom: 16, animate: true });
        }
    }, [positions, map]);

    return null;
};

/* ── Admin Tracking Map with auto-polling ──────────────────── */
const AdminTrackingMap = ({
    orderId,
    riderLat: propRiderLat,
    riderLng: propRiderLng,
    riderName = "Rider",
    destLat,
    destLng,
    destLabel = "Customer Address",
    height = 200,
    api: apiInstance,
}) => {
    const [riderLat, setRiderLat] = useState(propRiderLat || null);
    const [riderLng, setRiderLng] = useState(propRiderLng || null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Poll rider location every 15s if orderId + api provided
    useEffect(() => {
        if (!orderId || !apiInstance) return;
        const poll = async () => {
            try {
                const { data } = await apiInstance.get(`/delivery/orders/${orderId}/rider-location`);
                if (data.available && data.rider?.lat != null && data.rider?.lng != null) {
                    setRiderLat(data.rider.lat);
                    setRiderLng(data.rider.lng);
                    setLastUpdated(data.rider.updatedAt || new Date().toISOString());
                }
            } catch { /* silent */ }
        };
        poll();
        const t = setInterval(poll, 15000);
        return () => clearInterval(t);
    }, [orderId, apiInstance]);

    // Also update from props if they change
    useEffect(() => {
        if (propRiderLat != null && propRiderLng != null) {
            setRiderLat(propRiderLat);
            setRiderLng(propRiderLng);
        }
    }, [propRiderLat, propRiderLng]);

    const riderPos = useMemo(() => (riderLat != null && riderLng != null ? [riderLat, riderLng] : null), [riderLat, riderLng]);
    const destPos = useMemo(() => (destLat != null && destLng != null ? [destLat, destLng] : null), [destLat, destLng]);
    const center = riderPos || destPos || [20.5937, 78.9629];

    if (!riderPos && !destPos) {
        return (
            <div style={{ height, background: "#f8fafc", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                📍 Rider location not available yet
            </div>
        );
    }

    return (
        <div style={{ position: "relative" }}>
            <style>{`
                @keyframes at-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.8);opacity:0}}
                .leaflet-container{border-radius:10px;font-family:inherit}
                .leaflet-control-attribution{font-size:8px!important;background:rgba(255,255,255,.7)!important}
            `}</style>
            <MapContainer
                center={center}
                zoom={15}
                style={{ height, width: "100%", borderRadius: 10, zIndex: 0 }}
                scrollWheelZoom={false}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds positions={[riderPos, destPos]} />

                {riderPos && (
                    <Marker position={riderPos} icon={riderIcon}>
                        <Popup>
                            <div style={{ textAlign: "center", minWidth: 90 }}>
                                <div style={{ fontWeight: 700, fontSize: 12 }}>🏍️ {riderName}</div>
                                {lastUpdated && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Updated: {new Date(lastUpdated).toLocaleTimeString("en-IN")}</div>}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {destPos && (
                    <Marker position={destPos} icon={destIcon}>
                        <Popup>
                            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 12 }}>📍 {destLabel}</div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default AdminTrackingMap;
