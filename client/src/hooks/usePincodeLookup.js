// client/src/hooks/usePincodeLookup.js
import { useState } from "react";

const usePincodeLookup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchCityState = async (pincode) => {
        if (!/^\d{6}$/.test(pincode)) {
            setError("Invalid pincode");
            return null;
        }

        try {
            setLoading(true);
            setError("");

            const res = await fetch(
                `https://api.postalpincode.in/pincode/${pincode}`
            );
            const data = await res.json();

            if (data[0]?.Status !== "Success") {
                setError("Pincode not found");
                return null;
            }

            const postOffice = data[0].PostOffice[0];

            return {
                city: postOffice.District,
                state: postOffice.State,
            };
        } catch {
            setError("Failed to fetch pincode details");
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { fetchCityState, loading, error };
};

export default usePincodeLookup;