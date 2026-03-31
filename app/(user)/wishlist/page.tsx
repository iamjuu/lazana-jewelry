"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import ProtectedRoute from "@/components/user/ProtectedRoute";
import WishlistButton from "@/components/user/WishlistButton";
import { Bucket1 } from "@/public/assets";
import { useWishlist } from "@/stores/useWishlist";
import { useCart } from "@/stores/useCart";
import toast from "react-hot-toast";

const formatCurrency = (amount: number) => {
  const rounded = Math.round(amount * 100) / 100;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

const normalizeImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("data:image")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `data:image/jpeg;base64,${url}`;
};

function WishlistPageContent() {
  const items = useWishlist((state) => state.items);
  const loading = useWishlist((state) => state.loading);
  const initialized = useWishlist((state) => state.initialized);
  const fetchWishlist = useWishlist((state) => state.fetchWishlist);
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    fetchWishlist().catch(() => {
      toast.error("Failed to load wishlist");
    });
  }, [fetchWishlist]);

  const handleAddToCart = (item: (typeof items)[number]) => {
    const discountedPrice =
      item.discount && item.discount > 0 ? item.price - item.discount : item.price;

    addItem({
      id: item._id,
      name: item.name,
      price: discountedPrice,
      imageUrl:
        Array.isArray(item.imageUrl) && item.imageUrl.length > 0
          ? normalizeImageUrl(item.imageUrl[0])
          : "",
    });

    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-seasons text-[32px] text-[#1C3163]">
              Wishlist
            </h1>
            <p className="font-touvlo text-sm text-[#545454] mt-2">
              Pieces you have saved for later.
            </p>
          </div>
          <p className="font-touvlo text-sm text-[#545454]">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {loading && !initialized ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#1C3163]" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#1C3163]/10 bg-[#F7F8FB] px-6 py-16 text-center">
            <h2 className="font-seasons text-[24px] text-[#1C3163]">
              Your wishlist is empty
            </h2>
            <p className="mt-3 font-touvlo text-sm text-[#545454]">
              Save pieces from the shop to keep them here.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-[#1C3163] px-6 py-3 font-touvlo text-sm text-white transition-colors hover:bg-[#152747]"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const hasDiscount = item.discount && item.discount > 0;
              const finalPrice =
                hasDiscount && item.discount ? item.price - item.discount : item.price;
              const primaryImage =
                Array.isArray(item.imageUrl) && item.imageUrl.length > 0
                  ? normalizeImageUrl(item.imageUrl[0])
                  : "";

              return (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-[#1C3163]/10 bg-white shadow-sm"
                >
                  <Link href={`/shop/${item._id}`} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-[#F2F4F8]">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={Bucket1}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <WishlistButton
                        product={item}
                        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
                        activeLabel="Remove from wishlist"
                        inactiveLabel="Save to wishlist"
                      />
                    </div>
                  </Link>

                  <div className="space-y-4 p-5">
                    <div>
                      <Link
                        href={`/shop/${item._id}`}
                        className="font-touvlo text-[17px] text-[#1C3163]"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-2 font-touvlo text-sm text-[#545454]">
                        {hasDiscount ? (
                          <>
                            <span className="line-through">
                              {formatCurrency(item.price)}
                            </span>
                            <span>{formatCurrency(finalPrice)}</span>
                          </>
                        ) : (
                          <span>{formatCurrency(finalPrice)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1C3163] px-4 py-3 font-touvlo text-sm text-white transition-colors hover:bg-[#152747]"
                      >
                        <ShoppingCart size={16} />
                        Add to cart
                      </button>
                      <WishlistButton
                        product={item}
                        showLabel
                        iconSize={16}
                        activeLabel="Remove"
                        inactiveLabel="Save"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1C3163]/20 px-4 py-3 font-touvlo text-sm text-[#1C3163] transition hover:bg-[#F7F8FB]"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistPageContent />
    </ProtectedRoute>
  );
}
