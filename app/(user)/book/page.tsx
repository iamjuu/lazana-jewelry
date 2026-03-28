'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { BookNow } from '@/public/assets'

const BookPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("userToken")
    }
    return false
  })
  return (
    <div className=' bg-white min-h-screen'>
      <Navbar />
      <div className="w-full ">
        <section className="w-full px-4 md:px-0 py-[68px]">
          <div className="max-w-6xl pb-[106px] border-b mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="w-full lg:w-1/2">
                <div className="relative rounded-[20px] overflow-hidden bg-gray-200 shadow-lg">
                  <Image
                    src={BookNow}
                    alt="Book a Styling Appointment"
                    width={600}
                    height={700}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <h1 className="text-[32px] sm:text-[36px] md:text-[40px] text-black font-light leading-tight">
                  Get in Touch with Lazana Jewelry
                </h1>

                <div className="flex flex-col gap-4 text-[14px] sm:text-[15px] md:text-[16px] text-[#6B5D4F] font-light leading-relaxed">
                  <p>
                    Whether you are looking for a private styling appointment,
                    help choosing a gift, or support with a corporate enquiry,
                    we would love to hear from you. Reach out and our team will
                    help you find the right pieces for the occasion.
                  </p>
                </div>

                <div className="mt-4">
                  {isLoggedIn ? (
                    <Link href="/discoveryappointment">
                      <button className="bg-[#1C3163] text-white px-8 py-4 rounded-lg text-[16px] sm:text-[18px] font-normal hover:bg-[#2a4580] transition-colors duration-300">
                        Book a Styling Call
                      </button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <button className="bg-[#1C3163] text-white px-8 py-4 rounded-lg text-[16px] sm:text-[18px] font-normal hover:bg-[#2a4580] transition-colors duration-300">
                        Book a Styling Call
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default BookPage
