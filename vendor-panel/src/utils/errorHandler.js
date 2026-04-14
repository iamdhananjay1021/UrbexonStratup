import { useState } from 'react';
/**
 * errorHandler.js — Centralized API error handling
 */
export const getErrorMessage = (err) => {
    if (!err) return "Something went wrong";
    if (typeof err === "string") return err;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.errors?.[0]) return err.response.data.errors[0];
    if (err.code === "ERR_NETWORK" || err.message === "Network Error")
        return "Network error — please check your connection";
    if (err.code === "ECONNABORTED") return "Request timed out";
    const status = err.response?.status;
    if (status === 401) return "Session expired — please login again";
    if (status === 403) return "Access denied";
    if (status === 404) return "Not found";
    if (status === 429) return "Too many requests — please slow down";
    if (status >= 500) return "Server error — please try again shortly";
    return err.message || "Something went wrong";
};

export const useApiCall = () => {
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const call = async (fn, onSuccess) => {
        setLoading(true);
        setError("");
        try {
            const result = await fn();
            onSuccess?.(result);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, setError, call };
};
