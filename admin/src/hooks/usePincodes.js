import { useState, useCallback } from "react";
import * as vendorApi from "../api/vendorApi";

export const usePincodes = () => {
    const [pincodes, setPincodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");

    const fetchPincodes = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError("");
            const { data } = await vendorApi.fetchPincodes(params);
            setPincodes(data.pincodes || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load pincodes");
        } finally {
            setLoading(false);
        }
    }, []);

    const createPincode = useCallback(async (payload) => {
        setActionLoading("create");
        try {
            const { data } = await vendorApi.createPincode(payload);
            setPincodes(prev => [data.pincode, ...prev]);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to create" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const updatePincode = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const { data } = await vendorApi.updatePincode(id, payload);
            setPincodes(prev => prev.map(p => p._id === id ? data.pincode : p));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to update" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const deletePincode = useCallback(async (id) => {
        setActionLoading(id);
        try {
            await vendorApi.deletePincode(id);
            setPincodes(prev => prev.filter(p => p._id !== id));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to delete" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    return {
        pincodes, loading, actionLoading, error,
        fetchPincodes, createPincode, updatePincode, deletePincode,
    };
};