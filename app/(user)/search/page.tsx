"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import Image from "next/image";
import { Search, ChevronDown } from "lucide-react";
import { Bucket1, FliterIcon, SortIcon } from "@/public/assets";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Product = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  imageUrl?: string[];
  category?: { _id: string; name: string; slug: string };
};

const normalizeImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:image") || url.startsWith("http")) return url;
  return `data:image/jpeg;base64,${url}`;
};

const SearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || searchParams.get("search") || "";

  const [query, setQuery] = useState(qParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Filter states (same as shop page)
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
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortDropdown]);

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

  const buildApiUrl = (page: number) => {
    const keyword = query.trim();
    const params = new URLSearchParams();
    if (keyword) params.append("search", keyword);
    if (filters.featured) params.append("featured", "true");
    if (filters.newAddition) params.append("newAddition", "true");
    if (filters.weight) params.append("weight", filters.weight);
    if (filters.octave) params.append("octave", filters.octave);
    if (filters.size) params.append("size", filters.size);
    if (filters.tuning) params.append("tuning", filters.tuning);
    if (filters.sortBy) {
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
    }
    params.append("page", String(page));
    params.append("limit", "20");
    return `/api/products?${params.toString()}`;
  };

  useEffect(() => {
    let isMounted = true;
    const keyword = query.trim();

    if (!keyword) {
      setProducts([]);
      setLoading(false);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalProducts(0);
      setHasNext(false);
      setHasPrev(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(buildApiUrl(1));
        const data = await res.json();
        if (isMounted && data.success) {
          setProducts(data.data || []);
          setCurrentPage(1);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setTotalProducts(data.pagination?.total ?? 0);
          setHasNext(data.pagination?.hasNext ?? false);
          setHasPrev(data.pagination?.hasPrev ?? false);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [
    query,
    filters.featured,
    filters.newAddition,
    filters.weight,
    filters.octave,
    filters.size,
    filters.tuning,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.weight,
    filters.octave,
    filters.size,
    filters.tuning,
    filters.featured,
    filters.newAddition,
    filters.sortBy,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = query.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search");
  };

  const handlePageChange = (page: number) => {
    const keyword = query.trim();
    if (!keyword) return;
    fetch(buildApiUrl(page))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data || []);
          setCurrentPage(page);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setHasNext(data.pagination?.hasNext ?? false);
          setHasPrev(data.pagination?.hasPrev ?? false);
        }
      });
  };

  const handlePreviousPage = () => {
    if (hasPrev) {
      handlePageChange(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      handlePageChange(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const menuClose = () => {
    setShowFilters(false);
  };

  const formatPrice = (price: number) => {
    const rounded = Math.round(price * 100) / 100;
    return rounded % 1 === 0 ? `$${rounded}` : `$${rounded.toFixed(2)}`;
  };

  const keyword = query.trim();

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="w-full mt-[25px]" onClick={menuClose}>
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-seasons text-[#000000] text-[28px] md:text-[30px] lg:text-[32px] font-normal mb-[25px]">
            Search Results
          </h1>

          <form onSubmit={handleSearchSubmit} className="mb-[25px]">
            <div className="relative max-w-2xl">
              <input
                type="text"
                name="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-6 py-4 pr-12 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] font-touvlo"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000000] hover:text-[#1C3163] transition-colors"
                aria-label="Search"
              >
                <Search size={24} />
              </button>
            </div>
          </form>

          <p className="font-touvlo text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] mb-8">
            {!keyword ? (
              "Enter a keyword to search products"
            ) : loading ? (
              "Searching..."
            ) : (
              <>
                {products.length} result{products.length !== 1 ? "s" : ""} for
                &quot;{keyword}&quot;
              </>
            )}
          </p>

          {!keyword ? (
            <div className="text-center py-12 text-[#545454] font-touvlo">
              Enter a keyword in the search box above to search products
            </div>
          ) : (
            <div
              onClick={menuClose}
              className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-[35px]"
            >
              <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 mb-4 lg:mb-0 lg:items-start">
                <button
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

                <div
                  className="relative"
                  ref={sortDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
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
                      className="absolute left-0 lg:left-full lg:top-0 top-full mt-2 lg:mt-0 lg:ml-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 min-w-[220px]"
                    >
                      <button
                        onClick={() => handleSortChange("featured", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.featured ? "underline" : ""}`}
                      >
                        FEATURED
                      </button>
                      <button
                        onClick={() => handleSortChange("newAddition", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.newAddition ? "underline" : ""}`}
                      >
                        NEW ADDITION
                      </button>
                      <button
                        onClick={() => handleSortChange("name", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.sortBy === "name" && filters.sortOrder === "asc" ? "underline" : ""}`}
                      >
                        ALPHABETICALLY, A-Z
                      </button>
                      <button
                        onClick={() => handleSortChange("name", "desc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.sortBy === "name" && filters.sortOrder === "desc" ? "underline" : ""}`}
                      >
                        ALPHABETICALLY, Z-A
                      </button>
                      <button
                        onClick={() => handleSortChange("price", "asc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.sortBy === "price" && filters.sortOrder === "asc" ? "underline" : ""}`}
                      >
                        PRICE, LOW TO HIGH
                      </button>
                      <button
                        onClick={() => handleSortChange("price", "desc")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filters.sortBy === "price" && filters.sortOrder === "desc" ? "underline" : ""}`}
                      >
                        PRICE, HIGH TO LOW
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showFilters && (
                <>
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#1C3163]">
                          ALL COLLECTIONS
                        </h3>
                        <ChevronDown className="w-5 h-5 text-[#1C3163]" />
                      </div>

                      <div className="space-y-3">
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
                                    weight: e.target.checked
                                      ? weight.value
                                      : "",
                                  });
                                  setShowSortDropdown(false);
                                }}
                                className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                              />
                            </label>
                          ))}
                        </div>

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
                                    octave: e.target.checked
                                      ? octave.value
                                      : "",
                                  });
                                  setShowSortDropdown(false);
                                }}
                                className="w-4 h-4 text-[#1C3163] border-gray-300 rounded focus:ring-[#1C3163]"
                              />
                            </label>
                          ))}
                        </div>

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

              <div className="flex-1">
                {loading ? (
                  <div className="text-center py-12 text-[#1C3163]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4" />
                    <p>Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 text-[#1C3163] font-touvlo">
                    No products found for &quot;{keyword}&quot;
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-[18px] w-full">
                      {products.map((item) => {
                        const imageUrl =
                          item.imageUrl && item.imageUrl.length > 0
                            ? normalizeImageUrl(item.imageUrl[0])
                            : null;
                        const hasDiscount =
                          item.discount && item.discount > 0;
                        const discountedPrice =
                          hasDiscount && item.discount
                            ? item.price - item.discount
                            : item.price;

                        return (
                          <Link
                            href={`/shop/${item._id}`}
                            key={item._id}
                            className="text-black group cursor-pointer"
                          >
                            <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  unoptimized
                                />
                              ) : (
                                <Image
                                  src={Bucket1}
                                  alt={item.name}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              )}
                            </div>
                            <div className="pt-4 sm:pt-6 md:pt-[28px]">
                              <p className="font-touvlo text-[16px] text-[#1C3163] font-medium">
                                {item.name}
                              </p>
                              <div className="text-[14px] text-[#545454] font-light font-touvlo mt-1">
                                {hasDiscount && (
                                  <span className="line-through mr-1">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                                {formatPrice(discountedPrice)} USD
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {totalProducts > 20 && (
                      <div className="flex items-center justify-center gap-6 mt-12 mb-8">
                        <button
                          onClick={handlePreviousPage}
                          disabled={!hasPrev}
                          className={`px-6 py-2 rounded-lg font-touvlo text-[14px] sm:text-[16px] transition-all ${
                            hasPrev
                              ? "bg-[#1C3163] text-white hover:opacity-90 cursor-pointer"
                              : "bg-[#1C3163] text-white opacity-50 cursor-not-allowed"
                          }`}
                        >
                          Previous
                        </button>
                        <span className="font-touvlo text-[14px] sm:text-[16px] text-[#1C3163]">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={!hasNext}
                          className={`px-6 py-2 rounded-lg font-touvlo text-[14px] sm:text-[16px] transition-all ${
                            hasNext
                              ? "bg-[#1C3163] text-white hover:opacity-90 cursor-pointer"
                              : "bg-[#1C3163] text-white opacity-50 cursor-not-allowed"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense
      fallback={
        <div className="bg-white min-h-screen">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center text-[#1C3163]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;


