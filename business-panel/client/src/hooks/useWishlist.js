/**
 * useWishlist.js — Wishlist hook for components
 */
import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

export const useWishlist = (productId) => {
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !productId) return;
    api.get(`/wishlist/check/${productId}`)
      .then(({ data }) => setInWishlist(data.inWishlist))
      .catch(() => {});
  }, [user, productId]);

  const toggle = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${productId}`);
        setInWishlist(false);
      } else {
        await api.post(`/wishlist/${productId}`);
        setInWishlist(true);
      }
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, [user, productId, inWishlist]);

  return { inWishlist, toggle, loading };
};
