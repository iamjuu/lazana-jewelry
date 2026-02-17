"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import localFont from "next/font/local";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import Image from "next/image";
import { Plus, ChevronDown, X } from "lucide-react";
import { Bucket1, FliterIcon, SortIcon } from "@/public/assets";
import Link from "next/link";
import { useCart } from "@/stores/useCart";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

// Fonts are now defined in globals.css as font-seasons and font-touvlo

type Product = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  createdAt: string;
  description?: string;
  category?: string | { _id: string; name: string; slug: string };
  imageUrl?: string[];
  videoUrl?: string | string[];
};

type Category = {
  _id: string;
  name: string;
  slug: string;
};

const normalizeProductDisplayName = (name: string) => {
  const superscriptDigits: Record<string, string> = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
  };

  return (
    (name || "")
      // Normalize various dash/hyphen/minus characters to a simple hyphen
      .replace(/[–—−‑‒]/g, "-")
      // Normalize common superscript "th" patterns to plain "th"
      .replace(/ᵗʰ/g, "th")
      .replace(/ᵗ/g, "t")
      .replace(/ʰ/g, "h")
      // Normalize superscript digits (e.g., ⁴ -> 4)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (m) => superscriptDigits[m] ?? "")
      // Normalize nbsp
      .replace(/\u00a0/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
};

const ShopPageContent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>("All Products");
  const { addItem } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get category from URL using useSearchParams (works with Next.js client-side navigation)
  const categoryParam = searchParams.get("category");

  // Filter states
  const [filters, setFilters] = useState({
    featured: false,
    newAddition: false,
    weight: "",
    octave: "",
    size: "",
    tuning: "",
    sortBy: "",
    sortOrder: "asc",
  });

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  // Guard against rapid pagination clicks (race condition fix)
  const isNavigatingRef = useRef(false);

  // Close filters when category changes
  useEffect(() => {
    setShowFilters(false);
  }, [categoryParam]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortDropdown]);

  // Get sort label
  const getSortLabel = () => {
    if (filters.featured) return "FEATURED";
    if (filters.newAddition) return "NEW ADDITION";
    if (filters.sortBy === "price" && filters.sortOrder === "desc")
      return "PRICE, HIGH TO LOW";
    if (filters.sortBy === "price" && filters.sortOrder === "asc")
      return "PRICE, LOW TO HIGH";
    if (filters.sortBy === "name" && filters.sortOrder === "asc")
      return "ALPHABETICALLY, A-Z";
    if (filters.sortBy === "name" && filters.sortOrder === "desc")
      return "ALPHABETICALLY, Z-A";
    return "SORT PRODUCTS";
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    if (sortBy === "featured") {
      setFilters({
        ...filters,
        featured: true,
        newAddition: false,
        sortBy: "",
        sortOrder: "asc",
      });
    } else if (sortBy === "newAddition") {
      setFilters({
        ...filters,
        newAddition: true,
        featured: false,
        sortBy: "",
        sortOrder: "asc",
      });
    } else {
      setFilters({
        ...filters,
        sortBy,
        sortOrder,
        featured: false,
        newAddition: false,
      });
    }
    setShowSortDropdown(false);
  };

  // Category param is now handled by useSearchParams which automatically updates on navigation

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let abortController: AbortController | null = null;

    const ABORT_REASON = "shop_fetch_cleanup";

    const fetchProducts = async () => {
      // Cancel previous request if still pending
      if (abortController && !abortController.signal.aborted) {
        try {
          abortController.abort(ABORT_REASON);
        } catch {
          // ignore
        }
      }
      abortController = new AbortController();
      try {
        setLoading(true);

        // Build API URL with category and filters
        let apiUrl = "/api/products";
        const params = new URLSearchParams();

        if (categoryParam && categoryParam !== "all") {
          params.append("category", categoryParam);
        }

        // Add filters
        if (filters.featured) {
          params.append("featured", "true");
        }
        if (filters.newAddition) {
          params.append("newAddition", "true");
        }
        if (filters.weight) {
          params.append("weight", filters.weight);
        }
        if (filters.octave) {
          params.append("octave", filters.octave);
        }
        if (filters.size) {
          params.append("size", filters.size);
        }
        if (filters.tuning) {
          params.append("tuning", filters.tuning);
        }
        if (filters.sortBy) {
          params.append("sortBy", filters.sortBy);
          params.append("sortOrder", filters.sortOrder);
        }

        // Add pagination parameters
        params.append("page", currentPage.toString());
        params.append("limit", "20");

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        // Add timeout to prevent hanging requests
        timeoutId = setTimeout(() => {
          if (abortController && !abortController.signal.aborted) {
            try {
              abortController.abort("request_timeout");
            } catch {
              // ignore
            }
          }
        }, 10000); // 10 second timeout (increased for slower connections)

        const response = await fetch(apiUrl, {
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Always set products, even if empty array
        if (isMounted) {
          setProducts(data.data || []);

          // Update pagination state from API response
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalProducts(data.pagination.total || 0);
            setHasNext(data.pagination.hasNext || false);
            setHasPrev(data.pagination.hasPrev || false);
          }
        }

        // Set category name immediately with a default, then try to fetch the real name
        if (categoryParam && categoryParam !== "all") {
          // Set a default first
          if (isMounted) {
            setCategoryName(categoryParam);
          }

          // Then try to fetch the real category name (non-blocking)
          fetch("/api/categories")
            .then((categoryResponse) => categoryResponse.json())
            .then((categoryData) => {
              if (categoryData.success && isMounted) {
                const category = categoryData.data.find((cat: Category) => {
                  const slugMatch = cat.slug === categoryParam;
                  const nameSlugMatch =
                    cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") ===
                    categoryParam;
                  return slugMatch || nameSlugMatch;
                });
                if (isMounted && category) {
                  setCategoryName(category.name);
                }
              }
            })
            .catch((catError) => {
              console.error("Failed to fetch category name:", catError);
            });
        } else {
          if (isMounted) {
            setCategoryName("All Products");
          }
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || error?.message === "shop_fetch_cleanup" || error?.message === "request_timeout") {
          return;
        }
        console.error("Failed to fetch products:", error);
        if (isMounted) {
          setProducts([]);
          setCategoryName(
            categoryParam && categoryParam !== "all"
              ? categoryParam || "Category"
              : "All Products",
          );
        }
      } finally {
        // Always clear loading state and navigation lock
        if (isMounted) {
          setLoading(false);
        }
        // Always reset navigation ref, even if unmounted (safety)
        isNavigatingRef.current = false;
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (abortController) {
        try {
          if (!abortController.signal.aborted) {
            abortController.abort(ABORT_REASON);
          }
        } catch {
          // Ignore when abort fails (e.g. already aborted)
        }
        abortController = null;
      }
      // Force loading to false and reset navigation ref on cleanup
      setLoading(false);
      isNavigatingRef.current = false;
    };
  }, [
    categoryParam,
    filters.featured,
    filters.newAddition,
    filters.weight,
    filters.octave,
    filters.size,
    filters.tuning,
    filters.sortBy,
    filters.sortOrder,
    currentPage,
  ]); // Re-fetch when category or specific filter values change

  // Reset to page 1 when filters or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryParam,
    filters.weight,
    filters.octave,
    filters.size,
    filters.tuning,
    filters.featured,
    filters.newAddition,
    filters.sortBy,
  ]);

  // Use instant scroll on iOS/touch to avoid Safari quirks; smooth on desktop
  const scrollToTop = () => {
    try {
      const isTouch =
        typeof navigator !== "undefined" &&
        (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          "ontouchstart" in window);
      if (isTouch) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Scroll error:", error);
      // Fallback: try basic scroll
      try {
        window.scrollTo(0, 0);
      } catch {
        // Silently fail if scroll is completely broken
      }
    }
  };

  const handlePreviousPage = () => {
    if (hasPrev && !loading && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      // Safety timeout: if fetch doesn't complete in 15s, reset ref
      setTimeout(() => {
        if (isNavigatingRef.current) {
          console.warn("Navigation timeout - resetting lock");
          isNavigatingRef.current = false;
        }
      }, 15000);
      
      setCurrentPage((prev) => prev - 1);
      // Delay scroll slightly to let state update propagate
      setTimeout(() => {
        scrollToTop();
      }, 50);
    }
  };

  const handleNextPage = () => {
    if (hasNext && !loading && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      // Safety timeout: if fetch doesn't complete in 15s, reset ref
      setTimeout(() => {
        if (isNavigatingRef.current) {
          console.warn("Navigation timeout - resetting lock");
          isNavigatingRef.current = false;
        }
      }, 15000);
      
      setCurrentPage((prev) => prev + 1);
      // Delay scroll slightly to let state update propagate
      setTimeout(() => {
        scrollToTop();
      }, 50);
    }
  };

  // Helper function to normalize image URL
  const normalizeImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  // Handle Add to Cart
  const handleAddToCart = (e: React.MouseEvent, item: Product) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    // Calculate discounted price if applicable
    const hasDiscount = item.discount && item.discount > 0;
    const discountedPrice =
      hasDiscount && item.discount ? item.price - item.discount : item.price;

    // Get first image URL for cart
    const imageUrl =
      item.imageUrl && item.imageUrl.length > 0
        ? normalizeImageUrl(item.imageUrl[0])
        : "";

    addItem({
      id: item._id,
      name: item.name,
      price: discountedPrice, // Use discounted price
      imageUrl: imageUrl,
    });

    toast.success("Added to cart!");
  };

  // Toggle expanded state for description
  const toggleExpanded = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const menuClose = () => {
    setShowFilters(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />

      <>
        <section
                    onClick={menuClose}

        className="w-full mt-[25px] ">
          <div className="max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-[50px] ">
                <h2 className="font-seasons text-[#D5B584] text-[26px] sm:text-[28px] md:text-[30px] font-normal m-0 leading-none">
                  {categoryName}
                </h2>
              </div>
              {/* Description Text */}
              <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] leading-relaxed text-[#545454] mt-[25px]">
                Thoughtfully crafted Crystal Bowls designed for clarity,
                relaxation, modern mindful living, sound healing, meditation and
                yoga. Made from 99.9% pure quartz crystal. Lightweight,
                travel-friendly, and designed for everyday practice. Each bowl
                is unique and can be customised by chakra, note, frequency,
                colour, and design to make it uniquely yours. Explore our
                collection below.
              </p>
            </div>

            {/* Main Content Layout */}
            <div
            onClick={menuClose}
            className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-[35px]">
              {/* Left Side Icons - Filter and Sort */}
              <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 mb-4 lg:mb-0 lg:items-start">
                {/* Filter Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilters(!showFilters);
                    setShowSortDropdown(false);
                  }}
                  className="p-2 lg:p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  aria-label={showFilters ? "Hide Filters" : "Show Filters"}
                >
                  <Image
                    src={FliterIcon}
                    alt="filter"
                    className="w-5 h-5 lg:w-6 lg:h-6"
                  />
                </button>

                {/* Sort Icon Button with Dropdown */}
                <div
                  className="relative"
                  ref={sortDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilters(false);
                    }}
                    className="p-2 lg:p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    aria-label="Sort Products"
                  >
                    <Image
                      src={SortIcon}
                      alt="sort"
                      className="w-5 h-5 lg:w-6 lg:h-6"
                    />
                  </button>

                  {showSortDropdown && (
                    <div
                      className="absolute left-0 lg:left-full lg:top-0 top-full mt-2 lg:mt-0 lg:ml-2
  bg-white/10 backdrop-blur-sm
  border border-white/20
  rounded-lg shadow-lg
  z-50 min-w-[220px]"
                    >
                      <button
                        type="button"
                        onClick={() => handleSortChange("featured", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.featured ? "underline" : ""
                        }`}
                      >
                        FEATURED
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange("newAddition", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.newAddition ? "underline" : ""
                        }`}
                      >
                        NEW ADDITION
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange("name", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === "name" &&
                          filters.sortOrder === "asc"
                            ? "underline"
                            : ""
                        }`}
                      >
                        ALPHABETICALLY, A-Z
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange("name", "desc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === "name" &&
                          filters.sortOrder === "desc"
                            ? "underline"
                            : ""
                        }`}
                      >
                        ALPHABETICALLY, Z-A
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange("price", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === "price" &&
                          filters.sortOrder === "asc"
                            ? "underline"
                            : ""
                        }`}
                      >
                        PRICE, LOW TO HIGH
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange("price", "desc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === "price" &&
                          filters.sortOrder === "desc"
                            ? "underline"
                            : ""
                        }`}
                      >
                        PRICE, HIGH TO LOW
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Sidebar - Left: below md slides in from left */}
              {showFilters && (
                <>
                  {/* Backdrop below md: tap to close */}
                  <div
                    aria-hidden
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 z-40 bg-white/10 md:hidden"
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full lg:w-64 shrink-0 bg-white/10 backdrop-blur-lg border h-fit border-white/20 rounded-lg p-6 shadow-lg max-md:fixed max-md:left-0 max-md:top-0 max-md:z-50 max-md:h-full max-md:w-64 max-md:max-w-[85vw] max-md:rounded-none max-md:rounded-r-lg max-md:animate-slide-in-from-left max-md:overflow-y-auto"
                  >
                  <div className="space-y-6">
                    {/* All Collections Heading */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#1C3163]">
                        ALL COLLECTIONS
                      </h3>
                      <ChevronDown className="w-5 h-5 text-[#1C3163]" />
                    </div>

                    {/* Filter Options */}
                    <div className="space-y-3">
                      {/* Weight Options */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-sm font-medium text-[#1C3163]">
                          Weight
                        </h4>
                        {[
                          { label: "LESS THAN 1KG", value: "less than 1kg" },
                          { label: "LESS THAN 6KG", value: "less than 6kg" },
                          { label: "BETWEEN 1-3KG", value: "between 1-3kg" },
                          { label: "BETWEEN 3-5KG", value: "3-5kg" },
                          {
                            label: "GREATER THAN 6KG",
                            value: "greater than 6kg",
                          },
                        ].map((weight) => (
                          <label
                            key={weight.value}
                            className="flex items-center justify-between cursor-pointer py-1"
                          >
                            <span className="text-sm text-[#1C3163]">
                              {weight.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={filters.weight === weight.value}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  weight: e.target.checked ? weight.value : "",
                                });
                                setShowSortDropdown(false);
                              }}
                              className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                            />
                          </label>
                        ))}
                      </div>

                      {/* Octave Options */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-sm font-medium text-[#1C3163]">
                          Octave
                        </h4>
                        {[
                          { label: "3RD OCTAVE", value: "3rd octave" },
                          { label: "4TH OCTAVE", value: "4th octave" },
                        ].map((octave) => (
                          <label
                            key={octave.value}
                            className="flex items-center justify-between cursor-pointer py-1"
                          >
                            <span className="text-sm text-[#1C3163]">
                              {octave.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={filters.octave === octave.value}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  octave: e.target.checked ? octave.value : "",
                                });
                                setShowSortDropdown(false);
                              }}
                              className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                            />
                          </label>
                        ))}
                      </div>

                      {/* Size Options */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-sm font-medium text-[#1C3163]">
                          Size
                        </h4>

                        {["5-6", "6-7", "7-8", "8-9"].map((size) => (
                          <label
                            key={size}
                            className="flex items-center justify-between cursor-pointer py-1"
                          >
                            <span className="text-sm text-[#1C3163]">
                              {/* {size}″ */}
                              {size} INCHES
                            </span>

                            <input
                              type="checkbox"
                              checked={filters.size === size}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  size: e.target.checked ? size : "",
                                  
                                });
                                setShowSortDropdown(false);
                              }}
                              className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                            />
                          </label>
                        ))}
                      </div>

                      {/* Tuning Options */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-sm font-medium text-[#1C3163]">
                          Tuning
                        </h4>
                        {["432", "440", "528"].map((tuning) => (
                          <label
                            key={tuning}
                            className="flex items-center justify-between cursor-pointer py-1"
                          >
                            <span className="text-sm text-[#1C3163]">
                              {tuning} HZ TUNING
                            </span>
                            <input
                              type="checkbox"
                              checked={filters.tuning === tuning}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  tuning: e.target.checked ? tuning : "",
                                });
                                setShowSortDropdown(false);
                              }}
                              className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                </>
              )}

              {/* Products Grid - Right */}
              <div className="flex-1">
                {loading ? (
                  <div className="text-center py-12 text-[#1C3163]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
                    <p>Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 text-[#1C3163]">
                    {categoryParam && categoryParam !== "all"
                      ? "No products for this category"
                      : "No products available"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-[18px] w-full">
                    {products.map((item) => {
                      // Get first and second images
                      const imageUrl =
                        item.imageUrl && item.imageUrl.length > 0
                          ? item.imageUrl[0]
                          : null;
                      const secondImageUrl =
                        item.imageUrl && item.imageUrl.length > 1
                          ? item.imageUrl[1]
                          : null;
                      // Price is already in dollars - format to always show 2 decimals for consistency
                      const formatPrice = (price: number) => {
                        const rounded = Math.round(price * 100) / 100;
                        return rounded % 1 === 0
                          ? `$${rounded}`
                          : `$${rounded.toFixed(2)}`;
                      };
                      const hasDiscount = item.discount && item.discount > 0;
                      const originalPrice = item.price;
                      const discountedPrice =
                        hasDiscount && item.discount
                          ? item.price - item.discount
                          : item.price;
                      const displayPrice = formatPrice(discountedPrice);
                      const displayOriginalPrice = formatPrice(originalPrice);

                      const displayName = normalizeProductDisplayName(
                        item.name || "",
                      );

                      return (
                        <Link
                          href={`/shop/${item._id}`}
                          key={item._id}
                          className="text-black group cursor-pointer"
                          prefetch={false}
                        >
                          <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                            {imageUrl ? (
                              <>
                                {/* First Image */}
                                <Image
                                  src={
                                    imageUrl.startsWith("data:") ||
                                    imageUrl.startsWith("http")
                                      ? imageUrl
                                      : `data:image/jpeg;base64,${imageUrl}`
                                  }
                                  alt={displayName}
                                  fill
                                  className="object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-110"
                                  unoptimized
                                  loading="lazy"
                                />
                                {/* Second Image - only show if it exists */}
                                {secondImageUrl && (
                                  <Image
                                    src={
                                      secondImageUrl.startsWith("data:") ||
                                      secondImageUrl.startsWith("http")
                                        ? secondImageUrl
                                        : `data:image/jpeg;base64,${secondImageUrl}`
                                    }
                                    alt={`${displayName} - alternate view`}
                                    fill
                                    className="object-cover transition-all duration-500 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-105"
                                    unoptimized
                                    loading="lazy"
                                  />
                                )}
                              </>
                            ) : (
                              <Image
                                src={Bucket1}
                                alt={displayName}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="pt-4 sm:pt-6 md:pt-[28px] flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-touvlo text-[16px]   text-[#1C3163] font-medium">
                                {displayName}
                              </p>
                              <div className=" md:text-[14px] text-black flex items-center gap-0 font-touvlo ">
                                {hasDiscount ? (
                                  <div className=" flex gap-1">
                                    <span className="text-[#545454] font-light line-through text-[14px]  ">
                                      {displayOriginalPrice}
                                    </span>
                                    <span className="text-[#545454] font-light text-[14px] whitespace-nowrap">
                                      {displayPrice} USD
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#545454] font-light text-[14px] whitespace-nowrap">
                                    {displayPrice} USD
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* <button
                              onClick={(e) => handleAddToCart(e, item)}
                              className="border rounded-full p-1 hover:bg-[#1C3163] hover:text-white transition-colors cursor-pointer flex-shrink-0"
                              aria-label="Add to cart"
                            >
                              <Plus size={16} />
                              </button> */}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls - below the product grid */}
                {totalProducts > 20 && (
                  <div className="flex items-center justify-center gap-6 mt-12 mb-8">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={!hasPrev || loading}
                      className={`px-6 py-2 rounded-lg font-touvlo text-[14px] sm:text-[15px] md:text-[16px] transition-all ${
                        hasPrev && !loading
                          ? "bg-[#1C3163] text-white hover:opacity-90 cursor-pointer"
                          : "bg-[#1C3163] text-white opacity-50 cursor-not-allowed"
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Indicator */}
                    <span className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] text-[#1C3163]">
                      Page {currentPage} of {totalPages}
                    </span>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={!hasNext || loading}
                      className={`px-6 py-2 rounded-lg font-touvlo text-[14px] sm:text-[15px] md:text-[16px] transition-all ${
                        hasNext && !loading
                          ? "bg-[#1C3163] text-white hover:opacity-90 cursor-pointer"
                          : "bg-[#1C3163] text-white opacity-50 cursor-not-allowed"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </>

      <Footer />
    </div>
  );
};

const ShopPage = () => {
  return (
    <Suspense
      fallback={
        <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center text-[#1C3163]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  );
};

export default ShopPage;