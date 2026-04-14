import { useState, useCallback } from "react";
import * as vendorApi from "../api/vendorApi";

const PAGE_LIMIT = 20;

export const useSettlements = () => {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchSettlements = useCallback(async ({ page = 1, status = "", vendorId = "" } = {}) => {
        try {
            setLoading(true);
            setError("");
            const params = { page, limit: PAGE_LIMIT };
            if (status) params.status = status;
            if (vendorId) params.vendorId = vendorId;
            const { data } = await vendorApi.fetchSettlements(params);
            setSettlements(data.settlements || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.page || 1);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load settlements");
        } finally {
            setLoading(false);
        }
    }, []);

    const processSettlements = useCallback(async () => {
        setActionLoading("process");
        try {
            const { data } = await vendorApi.processSettlements();
            return { success: true, data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to process" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const markSettlementPaid = useCallback(async (id, payload) => {
        setActionLoading(id);
        try {
            const { data } = await vendorApi.markSettlementPaid(id, payload);
            setSettlements(prev => prev.map(s => s._id === id ? data.settlement : s));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to mark paid" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    const markBatchPaid = useCallback(async (batchId, payload) => {
        setActionLoading(batchId);
        try {
            await vendorApi.markBatchPaid(batchId, payload);
            setSettlements(prev =>
                prev.map(s => s.batchId === batchId ? { ...s, status: "paid" } : s)
            );
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to mark batch paid" };
        } finally {
            setActionLoading(null);
        }
    }, []);

    return {
        settlements, loading, actionLoading, error,
        total, totalPages, currentPage,
        fetchSettlements, processSettlements,
        markSettlementPaid, markBatchPaid,
    };
};