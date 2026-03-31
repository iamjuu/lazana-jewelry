"use client";

import { create } from "zustand";
import type { WishlistProduct } from "@/types";

type WishlistState = {
  items: WishlistProduct[];
  initialized: boolean;
  loading: boolean;
  pendingIds: string[];
  fetchWishlist: () => Promise<WishlistProduct[]>;
  addToWishlist: (productId: string) => Promise<WishlistProduct[]>;
  removeFromWishlist: (productId: string) => Promise<WishlistProduct[]>;
  toggleWishlist: (productId: string) => Promise<WishlistProduct[]>;
  clearWishlist: () => void;
  isWishlisted: (productId: string) => boolean;
};

const getToken = () =>
  typeof window !== "undefined" ? sessionStorage.getItem("userToken") : null;

const requestWishlist = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<WishlistProduct[]> => {
  const token = getToken();
  if (!token) {
    throw new Error("Please login to continue");
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Wishlist request failed");
  }

  return Array.isArray(data.data) ? data.data : [];
};

export const useWishlist = create<WishlistState>()((set, get) => ({
  items: [],
  initialized: false,
  loading: false,
  pendingIds: [],
  fetchWishlist: async () => {
    if (!getToken()) {
      set({ items: [], initialized: true, loading: false });
      return [];
    }

    set({ loading: true });

    try {
      const items = await requestWishlist("/api/wishlist", { method: "GET" });
      set({ items, initialized: true, loading: false });
      return items;
    } catch (error) {
      set({ items: [], initialized: true, loading: false });
      throw error;
    }
  },
  addToWishlist: async (productId) => {
    const items = await requestWishlist("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    set({ items, initialized: true });
    return items;
  },
  removeFromWishlist: async (productId) => {
    const items = await requestWishlist(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });
    set({ items, initialized: true });
    return items;
  },
  toggleWishlist: async (productId) => {
    const { pendingIds, isWishlisted, addToWishlist, removeFromWishlist } = get();

    if (pendingIds.includes(productId)) {
      return get().items;
    }

    set((state) => ({ pendingIds: [...state.pendingIds, productId] }));

    try {
      return isWishlisted(productId)
        ? await removeFromWishlist(productId)
        : await addToWishlist(productId);
    } finally {
      set((state) => ({
        pendingIds: state.pendingIds.filter((id) => id !== productId),
      }));
    }
  },
  clearWishlist: () =>
    set({ items: [], initialized: false, loading: false, pendingIds: [] }),
  isWishlisted: (productId) => get().items.some((item) => item._id === productId),
}));
