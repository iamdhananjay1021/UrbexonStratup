// hooks/useUserLocation.js
import { useEffect, useState } from "react";

const STORAGE_KEY = "user_location_v1";

const useUserLocation = () => {
    const [location, setLocation] = useState(null);
    const [label, setLabel] = useState("");
    const [error, setError] = useState("");

    // 🔁 Load saved location
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            setLocation(data.location);
            setLabel(data.label);
        } else {
            // 🔥 AUTO detect on first load
            detectLocation();
        }
    }, []);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            return (
                data.address?.suburb ||
                data.address?.city ||
                data.address?.town ||
                "Your location"
            );
        } catch {
            return "Your location";
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError("Location not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const place = await reverseGeocode(latitude, longitude);

                const payload = {
                    location: { latitude, longitude },
                    label: place,
                };

                setLocation(payload.location);
                setLabel(place);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                setError("");
            },
            () => {
                setError("Permission denied");
            }
        );
    };

    const clearLocation = () => {
        localStorage.removeItem(STORAGE_KEY);
        setLocation(null);
        setLabel("");
    };

    return {
        location,
        label,
        error,
        detectLocation, // manual trigger
        clearLocation,
    };
};

export default useUserLocation;