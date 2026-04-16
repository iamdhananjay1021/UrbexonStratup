// client/src/hooks/useSavedAddress.js
const STORAGE_KEY = "rv_saved_address";

export const saveAddress = (address) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
};

export const getSavedAddress = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const clearSavedAddress = () => {
    localStorage.removeItem(STORAGE_KEY);
};