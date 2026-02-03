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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  // const [isSearching, setIsSearching] = useState(false); // Can add loading state if needed

  const shopHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offeringHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce timeout

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      // Set loading state here if desired
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`,
          );
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.data || []);
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // User requested "enter option no need to go", so we do nothing on submit
    // unless we want to keep it as a fallback?
    // "enter option no need to go" -> Disable redirect on Enter.
    // if (searchQuery.trim()) {
    //   router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    //   setIsSearchOpen(false);
    //   setSearchQuery("");
    // }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/shop/${productId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
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
        if (data.success) setCategories(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <div className="hidden md:block md:min-h-[84px]" />

      <nav
        ref={navRef}
        className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-[43px]
        relative lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-50
        lg:bg-white/10 lg:backdrop-blur-sm bg-transparent overflow-visible"
      >
        {/* MOBILE/TABLET NAVBAR - ALWAYS VISIBLE */}
        <div className="lg:hidden flex items-center justify-between py-4 relative z-40">
          <Link href="/" className="flex items-center">
            <Image
              src={CryselLogo}
              alt="Logo"
              width={150}
              height={30}
              className="h-6 sm:h-8 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
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
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
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
          <div className="font-seasons lg:hidden bg-white/20 backdrop-blur-md rounded-lg p-4 space-y-3 mb-4 relative z-30">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition ${
                  pathname === item.href
                    ? "text-white font-semibold bg-white/20"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/book-a-session"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 px-3 text-[#D5B584] hover:text-[#1C3163] hover:bg-white/10 rounded transition ${
                pathname === "/book-a-session"
                  ? "text-white font-semibold bg-white/20"
                  : ""
              }`}
            >
              Book a Call
            </Link>

            {/* Shop Categories for Mobile */}
            <div className="pl-4 space-y-2 border-l border-[#D5B584]/30 pt-2">
              <p className="text-xs text-[#D5B584] uppercase font-semibold">
                Categories
              </p>
              <Link
                href="/shop?category=all"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-[#1C3163] hover:text-[#D5B584] py-1"
              >
                All Bowls
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat._id}
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-[#1C3163] hover:text-[#D5B584] py-1 font-touvlo"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* DESKTOP NAVBAR */}
        <div className="max-w-[1400px] mx-auto hidden lg:flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src={CryselLogo}
              alt="Logo"
              width={200}
              height={40}
              className="h-8 xl:h-10 w-auto"
              priority
            />
          </Link>

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
                      className={`text-[#D5B584]  hover:text-[#1C3163] transition  ${
                        pathname.startsWith("/shop")
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
                          rounded-lg z-[100] pointer-events-auto py-3
                          !text-[16px]
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
                          className="block py-3 px-4 text-[#1C3163] hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md"
                        >
                          All Crystal singing bowls
                        </Link>

                        {categories.slice(0, 8).map((cat) => (
                          <Link
                            key={cat._id}
                            href={`/shop?category=${cat.slug}`}
                            className="block py-3 px-4 text-[#1C3163] hover:text-white hover:bg-[#D5B584] transition hover:translate-x-2 rounded-md font-touvlo"
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
                      className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                        pathname.startsWith("/services") ||
                        pathname.startsWith("/events")
                          ? "text-white font-semibold scale-110 !text-[16px] "
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
                          rounded-lg z-[100] pointer-events-auto py-3
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
                  className={`text-[#D5B584] hover:text-[#1C3163] transition  ${
                    pathname === item.href
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
              className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                pathname === "/book-a-session"
                  ? "text-[#1C3163] font-semibold scale-110"
                  : ""
              }`}
            >
              Book a Call
            </Link>
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-6 text-lg">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-[#D5B584] hover:text-white transition-colors"
            >
              <Search size={22} />
            </button>

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

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#D5B584]/20 shadow-lg py-4 px-4 z-40 transition-all duration-300">
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

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && searchQuery.trim() && (
              <div className="max-w-4xl mx-auto mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-[#D5B584]/20 overflow-hidden max-h-[60vh] overflow-y-auto">
                <div className="p-2">
                  {searchResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="flex items-center gap-4 p-3 hover:bg-[#D5B584]/10 cursor-pointer rounded-md transition-colors border-b border-gray-100 last:border-0"
                    >
                      {/* Product Image */}
                      <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {product.imageUrl && product.imageUrl.length > 0 ? (
                          <Image
                            src={product.imageUrl[0]} // Using first image, ensure it's handled properly if relative/absolute
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Search size={16} />
                          </div>
                        )}
                      </div>

                      {/* Product Name & Price */}
                      <div>
                        <p className="text-[#1C3163] font-seasons text-lg leading-tight">
                          {product.name}
                        </p>
                        {/* Option to show price if needed: <p className="text-[#D5B584] text-sm">${product.price}</p> */}
                      </div>
                    </div>
                  ))}
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
