"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CryselLogo } from "@/public/assets";
import { ShoppingCart, User, Search, X, Menu } from "lucide-react";
import { useCart } from "@/stores/useCart";
import toast from "react-hot-toast";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop", hasDropdown: true },
  {
    href: "/services",
    label: "Sound Healing",
    hasOfferingDropdown: true,
    hovertrue: true,
  },
  { href: "/about", label: "About Us", hovertrue: true },
];

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string[];
  price: number;
}; // Adding simplified Product type for search results

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  const { totalQuantity, items } = useCart();

  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isOfferingHovered, setIsOfferingHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileShopExpanded, setMobileShopExpanded] = useState(false);
  const [mobileOfferingExpanded, setMobileOfferingExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  const [loadingMoreSearch, setLoadingMoreSearch] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const shopHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offeringHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect - initial fetch (limit 20)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/products?search=${encodeURIComponent(searchQuery)}&limit=20&page=1`,
          );
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.data || []);
            setSearchPage(1);
            setHasMoreSearch(data.pagination?.hasNext ?? false);
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreSearch(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchMoreSearchResults = async () => {
    if (!searchQuery.trim() || loadingMoreSearch || !hasMoreSearch) return;
    setLoadingMoreSearch(true);
    try {
      const nextPage = searchPage + 1;
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(searchQuery)}&limit=20&page=${nextPage}`,
      );
      const data = await res.json();
      if (data.success && data.data?.length) {
        setSearchResults((prev) => [...prev, ...(data.data || [])]);
        setSearchPage(nextPage);
        setHasMoreSearch(data.pagination?.hasNext ?? false);
      } else {
        setHasMoreSearch(false);
      }
    } catch (error) {
      console.error("Search load more error:", error);
      setHasMoreSearch(false);
    } finally {
      setLoadingMoreSearch(false);
    }
  };

  const handleSearchResultsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom && hasMoreSearch && !loadingMoreSearch) {
      fetchMoreSearchResults();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search");
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/shop/${productId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreSearch(false);
  };

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!sessionStorage.getItem("userToken"));
  }, []);

  useEffect(() => {
    if (mounted) setCartCount(totalQuantity());
  }, [items.length, mounted, totalQuantity]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success){ setCategories(data.data || []);
          // console.log(data.data);

        }

      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const isHomePage = pathname === "/" || pathname === "/home";

  return (
    <>
      {/* No spacer on home so navbar sits on top of the video container; other pages keep spacer */}
      {!isHomePage && <div className="min-h-[64px] md:min-h-[84px]" />}

      <nav
        ref={navRef}
        className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-[35px]
        fixed top-0 left-0 right-0 z-[99999] lg:z-[1000]
        transform-gpu
        lg:bg-white/10   backdrop-blur-sm  lg:backdrop-blur-sm bg-transparent overflow-visible"
      >
        {/* MOBILE/TABLET NAVBAR - fixed row height, larger logo without increasing navbar */}
        <div className="lg:hidden flex items-center justify-between min-h-[56px] py-3 relative z-[9999] gap-4">
          <Link href="/" className="flex items-center h-full min-h-[46px]">
            <Image
              src={CryselLogo}
              alt="Logo"
              width={180}
              height={40}
              className="h-[36px] sm:h-12 w-auto max-h-full object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-[#D5B584] hover:text-white"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link href="/profile" className="text-[#D5B584] hover:text-white">
              <User size={20} />
            </Link>

            <Link
              href={isLoggedIn ? "/cart" : "/login"}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  toast.error("Please login to continue");
                  router.push("/login");
                }
              }}
              className="relative text-[#D5B584] hover:text-white"
            >
              <ShoppingCart size={20} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1c3163] text-xs w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#D5B584] hover:text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU - DROPDOWN */}
        {mobileMenuOpen && (
          <div className="font-seasons lg:hidden bg-white/20 backdrop-blur-md rounded-lg p-4 space-y-3 mb-4 relative z-[1002]">
            {navigationItems.map((item) => {
              /* Shop: expandable with backend categories on mobile */
              if (item.hasDropdown) {
                return (
                  <div key={item.href} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setMobileShopExpanded(!mobileShopExpanded)}
                      className={`w-full text-left py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition flex items-center justify-between ${pathname.startsWith("/shop")
                          ? "text-white font-semibold bg-white/20"
                          : ""
                        }`}
                    >
                      {item.label}
                      <span
                        className={`text-lg transition-transform ${mobileShopExpanded ? "rotate-180" : ""
                          }`}
                      >
                        ▼
                      </span>
                    </button>
                    {mobileShopExpanded && (
                      <div className="pl-4 space-y-1 border-l-2 border-[#D5B584]/40 ml-2">
                        <Link
                          href="/shop?category=all"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileShopExpanded(false);
                          }}
                          className="block py-2 px-3 text-sm text-[#1C3163] hover:text-[#D5B584] hover:bg-white/10 rounded font-touvlo"
                        >
                          All Bowls
                        </Link>
                        {categories.length === 0 ? (
                          <p className="py-2 px-3 text-sm text-[#D5B584]/80 font-touvlo">
                            Loading categories...
                          </p>
                        ) : (
                          categories.slice(0, 10).map((cat) => (
                            <Link
                              key={cat._id}
                              href={`/shop?category=${cat.slug}`}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileShopExpanded(false);
                              }}
                              className="block py-2 px-3 text-sm text-[#1C3163] hover:text-[#D5B584] hover:bg-white/10 rounded font-touvlo"
                            >
                              {cat.name}
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              /* Sound Healing: expandable with Events & Services on mobile */
              if (item.hasOfferingDropdown) {
                return (
                  <div key={item.href} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileOfferingExpanded(!mobileOfferingExpanded)
                      }
                      className={`w-full text-left py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition flex items-center justify-between ${pathname.startsWith("/services") ||
                          pathname.startsWith("/events")
                          ? "text-white font-semibold bg-white/20"
                          : ""
                        }`}
                    >
                      {item.label}
                      <span
                        className={`text-lg transition-transform ${mobileOfferingExpanded ? "rotate-180" : ""
                          }`}
                      >
                        ▼
                      </span>
                    </button>
                    {mobileOfferingExpanded && (
                      <div className="pl-4 space-y-1 border-l-2 border-[#D5B584]/40 ml-2">
                        <Link
                          href="/events"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileOfferingExpanded(false);
                          }}
                          className="block py-2 px-3 text-sm text-[#1C3163] hover:text-[#D5B584] hover:bg-white/10 rounded font-touvlo"
                        >
                          Events
                        </Link>
                        <Link
                          href="/services"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileOfferingExpanded(false);
                          }}
                          className="block py-2 px-3 text-sm text-[#1C3163] hover:text-[#D5B584] hover:bg-white/10 rounded font-touvlo"
                        >
                          Services
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition ${pathname === item.href
                      ? "text-white font-semibold bg-white/20"
                      : ""
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/book-a-session"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition ${pathname === "/book-a-session"
                  ? "text-white font-semibold bg-white/20"
                  : ""
                }`}
            >
              Book a Call
            </Link>
          </div>
        )}

        {/* DESKTOP NAVBAR - fixed row height so logo can be larger without shifting layout */}
        <div className="max-w-[1400px] mx-auto hidden lg:flex items-center justify-between min-h-[48px]">
          {/* LOGO - taller logo, constrained to row so navbar height unchanged */}
          <Link href="/" className="flex items-center h-full min-h-[48px]">
            <Image
              src={CryselLogo}
              alt="Logo"
              width={200}
              height={48}
              className="h-10 xl:h-12 w-auto max-h-full object-contain"
              priority
            />
          </Link>
{/* chanes */}
          {/* NAV LINKS */}
          <div className="font-seasons flex items-center gap-10  text-[18px]">
            {navigationItems.map((item) => {
              /* ================= SHOP ================= */
              if (item.hasDropdown) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (shopHoverTimeoutRef.current)
                        clearTimeout(shopHoverTimeoutRef.current);
                      setIsShopHovered(true);
                    }}
                    onMouseLeave={() => {
                      shopHoverTimeoutRef.current = setTimeout(
                        () => setIsShopHovered(false),
                        120,
                      );
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`text-[#D5B584]  hover:text-[#1C3163] transition  ${pathname.startsWith("/shop")
                          ? "text-white font-semibold  scale-110"
                          : ""
                        }`}
                    >
                      {item.label}
                    </Link>

                    {isShopHovered && (
                      <div
                        className="
                          absolute left-0 top-full mt-2 w-56
                          backdrop-blur-sm
                          shadow-lg border border-white/20
                          rounded-lg z-[1003] pointer-events-auto py-3
                          !text-[18px]

                        "
                        style={{ backgroundColor: "#fde9dd" }}
                        onMouseEnter={() => {
                          if (shopHoverTimeoutRef.current)
                            clearTimeout(shopHoverTimeoutRef.current);
                          setIsShopHovered(true);
                        }}
                        onMouseLeave={() => {
                          shopHoverTimeoutRef.current = setTimeout(
                            () => setIsShopHovered(false),
                            120,
                          );
                        }}
                      >
                        <Link
                          href="/shop?category=all"
                          className="block py-3 px-4 text-[#1C3163] hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md font-seasons"
                        >
                          All Crystal singing bowls
                        </Link>

                        {categories.slice(0, 10).map((cat) => (
                          <Link
                            key={cat._id}
                            href={`/shop?category=${cat.slug}`}
                            className="block py-3 px-4 text-[#1C3163] hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md font-seasons"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              /* ================= OFFERING ================= */
              if (item.hasOfferingDropdown) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (offeringHoverTimeoutRef.current)
                        clearTimeout(offeringHoverTimeoutRef.current);
                      setIsOfferingHovered(true);
                    }}
                    onMouseLeave={() => {
                      offeringHoverTimeoutRef.current = setTimeout(
                        () => setIsOfferingHovered(false),
                        120,
                      );
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`text-[#D5B584] hover:text-[#1C3163] transition font-seasons ${pathname.startsWith("/services") ||
                          pathname.startsWith("/events")
                          ? "text-white font-semibold scale-110 !text-[18px] "
                          : ""
                        }`}
                    >
                      {item.label}
                    </Link>

                    {isOfferingHovered && (
                      <div
                        className="
                          absolute left-0 top-full mt-2 w-56
                          backdrop-blur-sm
                          shadow-lg border border-white/20
                          rounded-lg z-[1003] pointer-events-auto py-3
                        "
                        style={{ backgroundColor: "#fde9dd" }}
                        onMouseEnter={() => {
                          if (offeringHoverTimeoutRef.current)
                            clearTimeout(offeringHoverTimeoutRef.current);
                          setIsOfferingHovered(true);
                        }}
                        onMouseLeave={() => {
                          offeringHoverTimeoutRef.current = setTimeout(
                            () => setIsOfferingHovered(false),
                            120,
                          );
                        }}
                      >
                        <Link
                          href="/events"
                          className="block py-3 px-4 text-[#1C3163]  hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md"
                        >
                          Events
                        </Link>
                        <Link
                          href="/services"
                          className="block py-3 px-4 text-[#1C3163] hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md"
                        >
                          Services
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[#D5B584] hover:text-[#1C3163] transition  ${pathname === item.href
                      ? "text-white font-semibold scale-110"
                      : ""
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/book-a-session"
              className={`text-[#D5B584] hover:text-[#1C3163] transition ${pathname === "/book-a-session"
                  ? "text-[#1C3163] font-semibold scale-110"
                  : ""
                }`}
            >
              Book a Call
            </Link>
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center z-[1001] gap-6 text-lg relative">
            {/* Search Icon */}
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-[#D5B584] hover:text-white transition-colors"
              >
                <Search size={22} />
              </button>
            )}
            <Link href="/profile" className="text-[#D5B584] hover:text-white">
              <User size={24} />
            </Link>

            <Link
              href={isLoggedIn ? "/cart" : "/login"}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  toast.error("Please login to continue");
                  router.push("/login");
                }
              }}
              className="relative text-[#D5B584] hover:text-white"
            >
              <ShoppingCart size={24} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 font-touvlo  -right-2 bg-[#1c3163] text-xs w-5 h-5 rounded-full flex items-center justify-center text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Overlay - visible on both mobile and desktop */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#D5B584]/20 shadow-lg py-4 px-4 z-[1002] transition-all duration-300">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-transparent border-b-2 border-[#D5B584] py-2 px-4 text-[#1C3163] placeholder-[#D5B584]/50 focus:outline-none font-touvlo text-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#D5B584] hover:text-[#1C3163] transition-colors"
                >
                  <Search size={20} />
                </button>
              </form>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[#D5B584] hover:text-[#1C3163]"
              >
                <X size={24} />
              </button>
            </div>

            {/* Live Search Results Dropdown - same card layout on mobile (list) and desktop (grid), limit 20, infinite scroll */}
            {searchQuery.trim() && (
              <div className="max-w-4xl mx-auto mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-[#D5B584]/20 overflow-hidden max-h-[60vh] flex flex-col">
                <div className="px-3 py-2 border-b border-[#D5B584]/20 shrink-0">
                  <p className="font-touvlo text-[#545454] text-sm">
                    {searchResults.length === 0
                      ? "No results"
                      : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div
                  ref={searchResultsRef}
                  onScroll={handleSearchResultsScroll}
                  className="p-2 overflow-y-auto flex-1 min-h-0"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product._id)}
                        className="flex flex-col rounded-lg overflow-hidden border border-[#D5B584]/20 hover:bg-[#D5B584]/10 cursor-pointer transition-colors"
                      >
                        <div className="aspect-square relative w-full bg-gray-100">
                          {product.imageUrl && product.imageUrl.length > 0 ? (
                            <Image
                              src={product.imageUrl[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Search size={24} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[#1C3163] font-seasons text-sm leading-tight line-clamp-2">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {loadingMoreSearch && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D5B584]" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
