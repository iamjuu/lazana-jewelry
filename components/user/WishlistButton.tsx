"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { WishlistProduct } from "@/types";
import { useWishlist } from "@/stores/useWishlist";

type WishlistButtonProps = {
  product: WishlistProduct;
  className?: string;
  showLabel?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  iconSize?: number;
};

export default function WishlistButton({
  product,
  className = "",
  showLabel = false,
  activeLabel = "Saved",
  inactiveLabel = "Save to wishlist",
  iconSize = 18,
}: WishlistButtonProps) {
  const router = useRouter();
  const initialized = useWishlist((state) => state.initialized);
  const loading = useWishlist((state) => state.loading);
  const pendingIds = useWishlist((state) => state.pendingIds);
  const fetchWishlist = useWishlist((state) => state.fetchWishlist);
  const isWishlisted = useWishlist((state) => state.isWishlisted(product._id));
  const toggleWishlist = useWishlist((state) => state.toggleWishlist);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("userToken") : null;

    if (token && !initialized && !loading) {
      fetchWishlist().catch(() => undefined);
    }
  }, [fetchWishlist, initialized, loading]);

  const isPending = pendingIds.includes(product._id);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("userToken") : null;

    if (!token) {
      toast.error("Please login to save items");
      router.push("/login");
      return;
    }

    try {
      await toggleWishlist(product._id);
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update wishlist",
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isWishlisted ? activeLabel : inactiveLabel}
      aria-pressed={isWishlisted}
      className={className}
    >
      <Heart
        size={iconSize}
        className={
          isWishlisted ? "fill-[#1C3163] text-[#1C3163]" : "text-[#1C3163]"
        }
      />
      {showLabel ? (
        <span>{isWishlisted ? activeLabel : inactiveLabel}</span>
      ) : null}
    </button>
  );
}
