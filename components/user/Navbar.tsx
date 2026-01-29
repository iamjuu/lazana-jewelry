'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import localFont from 'next/font/local'
import { CryselLogo } from '@/public/assets'
import { ShoppingCart, User, Search, X } from 'lucide-react'
import { useCart } from '@/stores/useCart'
import toast from 'react-hot-toast'

const theSeasonsBold = localFont({
  src: '../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/fonnts.com-513211/fonts/fonnts.com-theseasons-bd.otf',
  display: 'swap',
})

const touvloRegular = localFont({
  src: '../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/touvlo-regular-maisfontes.464c/touvlo-regular.otf',
  display: 'swap',
})
const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop', hasDropdown: true },
  { href: '/services', label: 'Offering', hasOfferingDropdown: true, hovertrue: true },
  { href: '/about', label: 'About Us', hovertrue: true },
]

type Category = {
  _id: string
  name: string
  slug: string
}

const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)

  const { totalQuantity, items } = useCart()

  const [mounted, setMounted] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [isShopHovered, setIsShopHovered] = useState(false)
  const [isOfferingHovered, setIsOfferingHovered] = useState(false)

  const shopHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const offeringHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    setMounted(true)
    setIsLoggedIn(!!sessionStorage.getItem('userToken'))
  }, [])

  useEffect(() => {
    if (mounted) setCartCount(totalQuantity())
  }, [items.length, mounted, totalQuantity])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (data.success) setCategories(data.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchCategories()
  }, [])

  return (
    <>
      <div className="hidden md:block md:min-h-[84px]" />

      <nav
        ref={navRef}
        className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-[43px]
        relative md:fixed md:top-0 md:left-0 md:right-0 md:z-50
        md:bg-white/10 md:backdrop-blur-sm"
      >
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
          <div className={`${theSeasonsBold.className} flex items-center gap-10`}>

            {navigationItems.map(item => {

              /* ================= SHOP ================= */
              if (item.hasDropdown) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (shopHoverTimeoutRef.current) clearTimeout(shopHoverTimeoutRef.current)
                      setIsShopHovered(true)
                    }}
                    onMouseLeave={() => {
                      shopHoverTimeoutRef.current = setTimeout(() => setIsShopHovered(false), 120)
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                        pathname.startsWith('/shop') ? 'text-white font-semibold scale-110' : ''
                      }`}
                    >
                      {item.label}
                    </Link>

                    {isShopHovered && (
                      <div
                        className="
                          absolute left-0 top-full mt-2 w-48
                          bg-white/10 backdrop-blur-md
                          shadow-lg border border-white/10
                          rounded-lg z-50 pointer-events-auto py-2
                        "
                        onMouseEnter={() => {
                          if (shopHoverTimeoutRef.current) clearTimeout(shopHoverTimeoutRef.current)
                          setIsShopHovered(true)
                        }}
                        onMouseLeave={() => {
                          shopHoverTimeoutRef.current = setTimeout(() => setIsShopHovered(false), 120)
                        }}
                      >
                        <Link
                          href="/shop?category=all"
                          className="block py-2 px-4 text-[#1C3163] hover:text-[#D5B584] transition hover:translate-x-2"
                        >
                          All Crystal singing bowls
                        </Link>

                        {categories.slice(0, 8).map(cat => (
                          <Link
                            key={cat._id}
                            href={`/shop?category=${cat.slug}`}
                            className={`block py-2 px-4 text-[#1C3163] hover:text-[#D5B584] transition hover:translate-x-2 ${touvloRegular.className}`}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              /* ================= OFFERING ================= */
              if (item.hasOfferingDropdown) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (offeringHoverTimeoutRef.current) clearTimeout(offeringHoverTimeoutRef.current)
                      setIsOfferingHovered(true)
                    }}
                    onMouseLeave={() => {
                      offeringHoverTimeoutRef.current = setTimeout(() => setIsOfferingHovered(false), 120)
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                        pathname.startsWith('/services') || pathname.startsWith('/events')
                          ? 'text-white font-semibold scale-110'
                          : ''
                      }`}
                    >
                      {item.label}
                    </Link>

                    {isOfferingHovered && (
                      <div
                        className="
                          absolute left-0 top-full mt-2 w-48
                          bg-white/10 backdrop-blur-sm
                          shadow-lg border border-white/20
                          rounded-lg z-50 pointer-events-auto py-2
                        "
                        onMouseEnter={() => {
                          if (offeringHoverTimeoutRef.current) clearTimeout(offeringHoverTimeoutRef.current)
                          setIsOfferingHovered(true)
                        }}
                        onMouseLeave={() => {
                          offeringHoverTimeoutRef.current = setTimeout(() => setIsOfferingHovered(false), 120)
                        }}
                      >
                        <Link
                          href="/events"
                          className="block py-2 px-4 text-[#1C3163] hover:text-[#D5B584] transition hover:translate-x-2"
                        >
                          Events
                        </Link>
                        <Link
                          href="/services"
                          className="block py-2 px-4 text-[#1C3163] hover:text-[#D5B584] transition hover:translate-x-2"
                        >
                          Services
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                    pathname === item.href ? 'text-white font-semibold scale-110' : ''
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            <Link
              href="/book-a-session"
              className={`text-[#D5B584] hover:text-[#1C3163] transition ${
                pathname === '/book-a-session' ? 'text-[#1C3163] font-semibold scale-110' : ''
              }`}
            >
              Book a Call
            </Link>
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-6">
            <Link href="/profile" className="text-[#D5B584] hover:text-white">
              <User size={24} />
            </Link>

            <Link
              href={isLoggedIn ? '/cart' : '/login'}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault()
                  toast.error('Please login to continue')
                  router.push('/login')
                }
              }}
              className="relative text-[#D5B584] hover:text-white"
            >
              <ShoppingCart size={24} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
