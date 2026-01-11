'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CryselLogo } from '@/public/assets'
import { ShoppingCart, User, Search, X } from 'lucide-react'
import { useCart } from '@/stores/useCart'

// Navigation items array
const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop', hasDropdown: true },
  { href: '/services', label: 'Offering', hasOfferingDropdown: true },
  { href: '/about', label: 'About Us' },
  // { href: '/events', label: 'Events' },
  // { href: '/blog', label: 'Blog' },
  // { href: '/book', label: 'Book' },
]

type Category = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { totalQuantity, items } = useCart() // Subscribe to items to trigger re-render
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isShopHovered, setIsShopHovered] = useState(false)
  const [isOfferingHovered, setIsOfferingHovered] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const [dropdownTop, setDropdownTop] = useState(0)
  const shopHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const offeringHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isMobileOfferingOpen, setIsMobileOfferingOpen] = useState(false)
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    
    if (mounted) {
      fetchCategories()
    }
  }, [mounted])

  // Only render cart count after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
    // Check login status after mount to prevent hydration mismatch
    setIsLoggedIn(!!sessionStorage.getItem("userToken"))
  }, [])

  // Update cart count whenever items change
  useEffect(() => {
    if (mounted) {
      setCartCount(totalQuantity())
    }
  }, [items, mounted, totalQuantity]) // Depend on items array to detect changes

  // Calculate dropdown position
  useEffect(() => {
    if (isShopHovered && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect()
      setDropdownTop(navRect.bottom)
    }
  }, [isShopHovered])

  // Search functionality
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5&excludeImages=false`)
        const data = await response.json()
        if (data.success && data.data) {
          setSearchResults(data.data)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchProducts()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
        // Clear search query to hide desktop dropdown
        setSearchQuery('')
        setSearchResults([])
      }
    }

    if (searchQuery.trim().length >= 2 || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchQuery, isSearchOpen])

  // Focus search input when opened on mobile
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearchResultClick = (productId: string) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    router.push(`/shop/${productId}`)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    // Use a microtask to avoid synchronous state updates
    Promise.resolve().then(() => {
      setIsMobileMenuOpen(false)
      setIsNavigating(false)
    })
  }, [pathname])

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Don't animate if already on the page
    if (pathname === href) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    setIsNavigating(true)
    setIsMobileMenuOpen(false)

    // Delay navigation for smooth animation
    setTimeout(() => {
      router.push(href)
    }, 150)
  }

  const handleCartNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    // If already on cart page, just refresh
    if (pathname === '/cart') {
      window.location.reload()
      return
    }

    setIsNavigating(true)
    setIsMobileMenuOpen(false)

    // Check login status and route accordingly
    const targetPath = isLoggedIn ? '/cart' : '/login'
    
    setTimeout(() => {
      router.push(targetPath)
    }, 150)
  }

  return (
    <>
      {/* Page Transition Overlay */}
      <div 
        className={`fixed inset-0 bg-linear-to-br from-[#FDECE2] via-[#FEC1A2] to-[#D5B584] z-9999 pointer-events-none transition-all duration-300 ease-in-out ${
          isNavigating 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Animated Crystal Bowl Icon */}
            <div className="w-20 h-20 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <nav ref={navRef} className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-[43px] relative">
        <div className="max-w-[1400px] mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:flex gap-8 xl:gap-[60px] 2xl:gap-[100px] justify-center items-center flex-wrap">
          {/* Logo Section */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center">
              <Image 
                src={CryselLogo} 
                alt="Crystal Bowl Studio Logo" 
                width={200}
                height={40}
                className="h-8 xl:h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8 xl:gap-[40px] 2xl:gap-[68px] flex-wrap justify-center">
            {navigationItems.map((item) => {
              // Handle Shop with dropdown
              if (item.hasDropdown) {
                return (
                  <div 
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (shopHoverTimeoutRef.current) {
                        clearTimeout(shopHoverTimeoutRef.current)
                        shopHoverTimeoutRef.current = null
                      }
                      setIsShopHovered(true)
                    }}
                    onMouseLeave={() => {
                      shopHoverTimeoutRef.current = setTimeout(() => {
                        setIsShopHovered(false)
                      }, 100)
                    }}
                  >
                    <Link 
                      href={item.href} 
                      onClick={(e) => handleNavigation(e, item.href)}
                      className={`group relative text-[#D5B584] hover:text-white transition-all duration-150 text-sm xl:text-base font-normal whitespace-nowrap hover:scale-110 overflow-hidden ${
                        pathname === item.href || pathname.startsWith('/shop') ? 'text-white font-semibold scale-110' : ''
                      }`}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                    
                    {/* Shop Dropdown Menu - Narrow Vertical */}
                    {isShopHovered && (
                      <div 
                        className="absolute left-0 top-full mt-2 w-48 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-lg z-50 pointer-events-auto py-2" 
                        onMouseEnter={() => {
                          if (shopHoverTimeoutRef.current) {
                            clearTimeout(shopHoverTimeoutRef.current)
                            shopHoverTimeoutRef.current = null
                          }
                          setIsShopHovered(true)
                        }}
                        onMouseLeave={() => {
                          shopHoverTimeoutRef.current = setTimeout(() => {
                            setIsShopHovered(false)
                          }, 100)
                        }}
                      >
                        <div className="flex flex-col">
                          {/* All Products Option */}
                          <Link
                            href="/shop?category=all"
                            onClick={(e) => {
                              // Don't use handleNavigation for same-page navigation
                              setIsShopHovered(false)
                            }}
                            className="text-[#1C3163] hover:text-[#D5B584] transition-all duration-150 text-sm xl:text-base font-normal py-2 px-4 hover:translate-x-2 cursor-pointer"
                          >
                            All Products
                          </Link>
                          {/* Dynamic Categories */}
                          {categories.slice(0, 8).map((category) => (
                            <Link
                              key={category._id}
                              href={`/shop?category=${category.slug}`}
                              onClick={(e) => {
                                // Don't use handleNavigation for query param changes (same page)
                                // Just close the dropdown and let the link navigate
                                setIsShopHovered(false)
                              }}
                              className="text-[#1C3163] hover:text-[#D5B584] transition-all duration-150 text-sm xl:text-base font-normal py-2 px-4 hover:translate-x-2 cursor-pointer"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              
              // Handle Offering with dropdown
              if (item.hasOfferingDropdown) {
                return (
                  <div 
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (offeringHoverTimeoutRef.current) {
                        clearTimeout(offeringHoverTimeoutRef.current)
                        offeringHoverTimeoutRef.current = null
                      }
                      setIsOfferingHovered(true)
                    }}
                    onMouseLeave={() => {
                      offeringHoverTimeoutRef.current = setTimeout(() => {
                        setIsOfferingHovered(false)
                      }, 100)
                    }}
                  >
                    <Link 
                      href={item.href} 
                      onClick={(e) => handleNavigation(e, item.href)}
                      className={`group relative text-[#D5B584] hover:text-white transition-all duration-150 text-sm xl:text-base font-normal whitespace-nowrap hover:scale-110 overflow-hidden ${
                        pathname === item.href || pathname.startsWith('/services') || pathname.startsWith('/events') ? 'text-white font-semibold scale-110' : ''
                      }`}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                    
                    {/* Offering Dropdown Menu */}
                    {isOfferingHovered && (
                      <div 
                        className="absolute left-0 top-full mt-2 w-48 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-lg z-50 pointer-events-auto py-2" 
                        onMouseEnter={() => {
                          if (offeringHoverTimeoutRef.current) {
                            clearTimeout(offeringHoverTimeoutRef.current)
                            offeringHoverTimeoutRef.current = null
                          }
                          setIsOfferingHovered(true)
                        }}
                        onMouseLeave={() => {
                          offeringHoverTimeoutRef.current = setTimeout(() => {
                            setIsOfferingHovered(false)
                          }, 100)
                        }}
                      >
                        <div className="flex flex-col">
                          <Link
                            href="/events"
                            onClick={(e) => {
                              handleNavigation(e, '/events')
                              setIsOfferingHovered(false)
                            }}
                            className="text-[#1C3163] hover:text-[#D5B584] transition-all duration-150 text-sm xl:text-base font-normal py-2 px-4 hover:translate-x-2 cursor-pointer"
                          >
                            Events
                          </Link>
                          <Link
                            href="/services"
                            onClick={(e) => {
                              handleNavigation(e, '/services')
                              setIsOfferingHovered(false)
                            }}
                            className="text-[#1C3163] hover:text-[#D5B584] transition-all duration-150 text-sm xl:text-base font-normal py-2 px-4 hover:translate-x-2 cursor-pointer"
                          >
                            Services
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              
              // Regular navigation items
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={`group relative text-[#D5B584] hover:text-white transition-all duration-150 text-sm xl:text-base font-normal whitespace-nowrap hover:scale-110 overflow-hidden ${
                    pathname === item.href ? 'text-white font-semibold scale-110' : ''
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                </Link>
              )
            })}
            <Link 
              href="/book-a-session" 
              onClick={(e) => handleNavigation(e, '/book-a-session')}
              className={`group relative text-[#D5B584] hover:text-white transition-all duration-150 text-sm xl:text-base font-normal whitespace-nowrap hover:scale-110 overflow-hidden ${
                pathname === '/book-a-session' ? 'text-white font-semibold scale-110' : ''
              }`}
            >
              <span className="relative z-10">Book a Call</span>
            </Link>
            
            {/* Search - Desktop */}
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D5B584] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-transparent border border-[#D5B584]/30 rounded-md text-white placeholder-[#D5B584]/60 focus:outline-none focus:border-[#D5B584] text-sm w-48 xl:w-56 transition-all duration-150"
                  />
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm shadow-lg border border-white/20 rounded-lg z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-[#1C3163]">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D5B584] mx-auto"></div>
                      <p className="mt-2 text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => handleSearchResultClick(product._id)}
                          className="w-full px-4 py-3 hover:bg-[#D5B584]/10 transition-colors text-left flex items-center gap-3 group"
                        >
                          {product.imageUrl && product.imageUrl[0] && (
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-zinc-100">
                              <img
                                src={product.imageUrl[0].startsWith('http') ? product.imageUrl[0] : `data:image/jpeg;base64,${product.imageUrl[0]}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1C3163] group-hover:text-[#D5B584] truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#1C3163]/70 mt-0.5">
                              ${product.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[#1C3163] text-sm">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Icon - Always visible */}
            <Link 
              href="/profile" 
              onClick={(e) => handleNavigation(e, '/profile')}
              className={`relative text-[#D5B584] hover:text-white transition-all duration-150 hover:scale-110 ${
                pathname === '/profile' ? 'text-white scale-110' : ''
              }`}
            >
              <User size={24} />
            </Link>
            
            {/* Cart Icon */}
            <Link 
              href={isLoggedIn ? "/cart" : "/login"} 
              onClick={handleCartNavigation}
              className="relative text-[#D5B584] hover:text-white transition-all duration-150 hover:scale-110"
            >
              <ShoppingCart size={24} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Tablet & Mobile Layout */}
        <div className="lg:hidden flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src={CryselLogo} 
              alt="Crystal Bowl Studio Logo" 
              width={160}
              height={32}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            {/* Search Icon Mobile */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="relative text-[#D5B584] hover:text-white transition-all duration-150"
              aria-label="Search"
            >
              <Search size={24} />
            </button>

            {/* Profile Icon Mobile - Always visible */}
            <Link 
              href="/profile" 
              onClick={(e) => handleNavigation(e, '/profile')}
              className={`relative text-[#D5B584] hover:text-white transition-all duration-150 ${
                pathname === '/profile' ? 'text-white' : ''
              }`}
            >
              <User size={24} />
            </Link>
            
            {/* Cart Icon Mobile */}
            <Link 
              href={isLoggedIn ? "/cart" : "/login"} 
              onClick={handleCartNavigation}
              className="relative text-[#D5B584] hover:text-white transition-all duration-150"
            >
              <ShoppingCart size={24} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu}
              className="text-[#D5B584] hover:text-white transition-colors duration-150 p-2"
              aria-label="Toggle menu"
            >
            {isMobileMenuOpen ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div ref={searchRef} className="lg:hidden absolute left-4 right-4 top-full mt-2 bg-black/90 backdrop-blur-md rounded-lg z-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D5B584] w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white/10 border border-[#D5B584]/30 rounded-md text-white placeholder-[#D5B584]/60 focus:outline-none focus:border-[#D5B584] text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#D5B584] hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[#D5B584] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-white">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D5B584] mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSearchResultClick(product._id)}
                        className="w-full px-4 py-3 hover:bg-white/10 transition-colors text-left flex items-center gap-3 rounded-md group"
                      >
                        {product.imageUrl && product.imageUrl[0] && (
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                            <img
                              src={product.imageUrl[0].startsWith('http') ? product.imageUrl[0] : `data:image/jpeg;base64,${product.imageUrl[0]}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-[#D5B584] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-white/70 mt-0.5">
                            ${product.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/70 text-sm">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu Backdrop - Blurs content behind */}
        <div 
          className={`lg:hidden fixed inset-0 backdrop-blur-sm transition-all duration-300 z-40 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Menu Dropdown */}
        <div 
          className={`lg:hidden absolute left-4 right-4 top-full bg-black/80 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out rounded-lg z-50 ${
            isMobileMenuOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col gap-2 py-4 px-2">
            {navigationItems.map((item) => {
              // Handle Shop with sub-menu in mobile (categories from backend)
              if (item.hasDropdown) {
                return (
                  <div key={item.href} className="flex flex-col">
                    <button 
                      onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                      className={`group relative text-white hover:text-[#D5B584] transition-all duration-150 text-base font-normal py-2 px-4 hover:bg-white/10 rounded flex items-center justify-between ${
                        pathname.startsWith('/shop') ? 'bg-white/15 text-[#D5B584] font-semibold' : ''
                      }`}
                    >
                      <span className="relative z-10">{item.label}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2} 
                        stroke="currentColor" 
                        className={`w-4 h-4 transition-transform duration-150 ${isMobileShopOpen ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {/* Shop Sub-menu - Categories from backend */}
                    <div className={`overflow-hidden transition-all duration-150 ${isMobileShopOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <Link 
                        href="/shop?category=all"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-white/80 hover:text-[#D5B584] transition-all duration-150 text-sm font-normal py-2 px-8 hover:bg-white/10 rounded"
                      >
                        All Products
                      </Link>
                      {categories.slice(0, 8).map((category) => (
                        <Link 
                          key={category._id}
                          href={`/shop?category=${category.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-white/80 hover:text-[#D5B584] transition-all duration-150 text-sm font-normal py-2 px-8 hover:bg-white/10 rounded"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              }

              // Handle Offering with sub-menu in mobile
              if (item.hasOfferingDropdown) {
                return (
                  <div key={item.href} className="flex flex-col">
                    <button 
                      onClick={() => setIsMobileOfferingOpen(!isMobileOfferingOpen)}
                      className={`group relative text-white hover:text-[#D5B584] transition-all duration-150 text-base font-normal py-2 px-4 hover:bg-white/10 rounded flex items-center justify-between ${
                        pathname.startsWith('/services') || pathname.startsWith('/events') ? 'bg-white/15 text-[#D5B584] font-semibold' : ''
                      }`}
                    >
                      <span className="relative z-10">{item.label}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2} 
                        stroke="currentColor" 
                        className={`w-4 h-4 transition-transform duration-150 ${isMobileOfferingOpen ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {/* Sub-menu */}
                    <div className={`overflow-hidden transition-all duration-150 ${isMobileOfferingOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <Link 
                        href="/events" 
                        onClick={(e) => handleNavigation(e, '/events')}
                        className={`block text-white/80 hover:text-[#D5B584] transition-all duration-150 text-sm font-normal py-2 px-8 hover:bg-white/10 rounded ${
                          pathname === '/events' ? 'bg-white/15 text-[#D5B584] font-semibold' : ''
                        }`}
                      >
                        Events
                      </Link>
                      <Link 
                        href="/services" 
                        onClick={(e) => handleNavigation(e, '/services')}
                        className={`block text-white/80 hover:text-[#D5B584] transition-all duration-150 text-sm font-normal py-2 px-8 hover:bg-white/10 rounded ${
                          pathname === '/services' ? 'bg-white/15 text-[#D5B584] font-semibold' : ''
                        }`}
                      >
                        Services
                      </Link>
                    </div>
                  </div>
                )
              }
              
              // Regular navigation items
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={`group relative text-white hover:text-[#D5B584] transition-all duration-150 text-base font-normal py-2 px-4 hover:bg-white/10 rounded hover:translate-x-2 overflow-hidden ${
                    pathname === item.href ? 'bg-white/15 text-[#D5B584] font-semibold translate-x-2' : ''
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                </Link>
              )
            })}
            <Link 
              href="/book-a-session" 
              onClick={(e) => handleNavigation(e, '/book-a-session')}
              className={`group relative text-white hover:text-[#D5B584] transition-all duration-150 text-base font-normal py-2 px-4 hover:bg-white/10 rounded hover:translate-x-2 overflow-hidden ${
                pathname === '/book-a-session' ? 'bg-white/15 text-[#D5B584] font-semibold translate-x-2' : ''
              }`}
            >
              <span className="relative z-10">Book a Call</span>
            </Link>
          </div>
        </div>
      </div>
      </nav>
    </>
  )
}

export default Navbar

