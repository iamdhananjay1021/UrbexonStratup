import { useEffect, useRef, useMemo } from "react";
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

/* ── Rider icon (you / current position) ───────────────────── */
const riderIcon = L.divIcon({
    className: "",
    html: `<div style="position:relative;width:36px;height:36px;">
        <div style="position:absolute;inset:0;background:rgba(34,197,94,0.2);border-radius:50%;animation:dp-pulse 2s infinite"></div>
        <div style="position:absolute;top:6px;left:6px;width:24px;height:24px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px">🏍️</div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
});

/* ── Destination icon (customer address) ───────────────────── */
const destIcon = L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:26px;height:26px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px">📍</div>
        <div style="width:2px;height:8px;background:#ef4444"></div>
    </div>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -38],
});

/* ── Store / pickup icon ───────────────────────────────────── */
const storeIcon = L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:26px;height:26px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px">🏪</div>
        <div style="width:2px;height:8px;background:#3b82f6"></div>
    </div>`,
    iconSize: [26, 38],
    iconAnchor: [13, 38],
    popupAnchor: [0, -38],
});

/* ── Auto-fit bounds when positions change ─────────────────── */
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
            map.fitBounds(L.latLngBounds(valid), { padding: [40, 40], maxZoom: 16, animate: true });
        }
    }, [positions, map]);

    return null;
};

/* ── Main Component ────────────────────────────────────────── */
const DeliveryMap = ({
    myLat,
    myLng,
    destLat,
    destLng,
    destLabel = "Customer Address",
    storeLat,
    storeLng,
    storeLabel = "Pickup Point",
    height = 220,
}) => {
    const myPos = useMemo(() => (myLat && myLng ? [myLat, myLng] : null), [myLat, myLng]);
    const destPos = useMemo(() => (destLat && destLng ? [destLat, destLng] : null), [destLat, destLng]);
    const storePos = useMemo(() => (storeLat && storeLng ? [storeLat, storeLng] : null), [storeLat, storeLng]);
    const center = myPos || destPos || storePos || [20.5937, 78.9629];

    return (
        <div style={{ position: "relative" }}>
            <style>{`
                @keyframes dp-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.8);opacity:0}}
                .leaflet-container{border-radius:10px;font-family:inherit}
                .leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.8)!important}
            `}</style>
            <MapContainer
                center={center}
                zoom={14}
                style={{ height, width: "100%", borderRadius: 10, zIndex: 0 }}
                scrollWheelZoom={false}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds positions={[myPos, destPos, storePos]} />

                {myPos && (
                    <Marker position={myPos} icon={riderIcon}>
                        <Popup><div style={{ textAlign: "center", fontWeight: 700, fontSize: 13 }}>📍 Your Location</div></Popup>
                    </Marker>
                )}

                {destPos && (
                    <Marker position={destPos} icon={destIcon}>
                        <Popup><div style={{ textAlign: "center", fontWeight: 700, fontSize: 13 }}>🏠 {destLabel}</div></Popup>
                    </Marker>
                )}

                {storePos && (
                    <Marker position={storePos} icon={storeIcon}>
                        <Popup><div style={{ textAlign: "center", fontWeight: 700, fontSize: 13 }}>🏪 {storeLabel}</div></Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default DeliveryMap;
