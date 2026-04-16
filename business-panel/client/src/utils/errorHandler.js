/**
 * errorHandler.js — Centralized API error handling for client
 */
export const getErrorMessage = (err) => {
    if (!err) return "Something went wrong";
    if (typeof err === "string") return err;
    // Axios error with response
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.errors?.[0]) return err.response.data.errors[0];
    // Network error
    if (err.code === "ERR_NETWORK" || err.message === "Network Error")
        return "Network error — please check your connection";
    if (err.code === "ECONNABORTED") return "Request timed out — please try again";
    // HTTP status fallbacks
    const status = err.response?.status;
    if (status === 401) return "Session expired — please login again";
    if (status === 403) return "You don't have permission to do this";
    if (status === 404) return "Not found";
    if (status === 429) return "Too many requests — please slow down";
    if (status >= 500) return "Server error — please try again shortly";
    return err.message || "Something went wrong";
};

export const isAuthError = (err) => err?.response?.status === 401;
export const isNetworkError = (err) => err?.code === "ERR_NETWORK" || err?.message === "Network Error";
