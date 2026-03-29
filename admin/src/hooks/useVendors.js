import { useState, useCallback } from "react";
import * as vendorApi from "../api/vendorApi";

const PAGE_LIMIT = 20;

export const useVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // vendorId
    const [error, setError] = useState("");
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchVendors = useCallback(async ({ page = 1, status = "ALL", search = "" } = {}) => {
        try {
            setLoading(true);
            setError("");
            const params = { page, limit: PAGE_LIMIT };
            if (status && status !== "ALL") params.status = status;
            if (search.trim()) params.search = search.trim();
            const { data } = await vendorApi.fetchVendors(params);
            setVendors(data.vendors || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.page || 1);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load vendors");
            setVendors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const approveVendor = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const { data } = await vendorApi.approveVendor(id, payload);
            setVendors(prev => prev.map(v => v._id === id ? data.vendor : v));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to approve" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const rejectVendor = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const { data } = await vendorApi.rejectVendor(id, payload);
            setVendors(prev => prev.map(v => v._id === id ? data.vendor : v));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to reject" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const suspendVendor = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const { data } = await vendorApi.suspendVendor(id, payload);
            setVendors(prev => prev.map(v => v._id === id ? data.vendor : v));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to suspend" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const updateCommission = useCallback(async (id, commissionRate) => {
        setActionLoading(id);
        try {
            await vendorApi.updateCommission(id, { commissionRate });
            setVendors(prev => prev.map(v => v._id === id ? { ...v, commissionRate } : v));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to update commission" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const deleteVendor = useCallback(async (id) => {
        setActionLoading(id);
        try {
            await vendorApi.deleteVendor(id);
            setVendors(prev => prev.filter(v => v._id !== id));
            setTotal(t => t - 1);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to delete" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    return {
        vendors, loading, actionLoading, error,
        total, totalPages, currentPage,
        fetchVendors, approveVendor, rejectVendor,
        suspendVendor, updateCommission, deleteVendor,
    };
};