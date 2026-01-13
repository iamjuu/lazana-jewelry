"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import Link from "next/link";

const BookASessionPage = () => {
  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 py-[68px]">
          <div className="max-w-6xl pb-[106px] mx-auto">
            {/* Header */}
            <div className="mb-8 md:mb-12">
              <h1 className="text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] text-[#D5B584] font-medium leading-tight mb-3">
                Book a Call
              </h1>
              <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-black leading-relaxed max-w-2xl">
                Choose from our available sessions and book your preferred
                experience with us.
              </p>
            </div>

            {/* Session Boxes */}
            <div className="space-y-6">
              {/* Free Studio Visit Box */}
              <div className="bg-white/50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Content */}
                  <div className="flex-1">
                    <h2 className="text-[16px] flex flex-col sm:text-[18px] md:text-[20px] lg:text-[22px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Free Studio Visit in Singapore
                      <span className="text-[13px] text-gray-500 sm:text-[14px] md:text-[15px] lg:text-[16px] mt-1">
                        30 minutes
                      </span>
                    </h2>
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-black mb-4 leading-relaxed max-w-2xl">
                      This is for you if you want to come and visit in person to
                      experience and listen to our Crystal Bowls live before
                      purchasing our collection.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/free-studio-visit"
                      className="rounded-lg border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors"
                    >
                      BOOK NOW
                    </Link>
                  </div>
                </div>
              </div>
              {/* Discovery Session Box */}
              <div className="bg-white/50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Content */}
                  <div className="flex-1">
                    <h2 className="text-[16px] flex flex-col sm:text-[18px] md:text-[20px] lg:text-[22px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Discovery Call
                      <span className="text-[13px] text-gray-500 sm:text-[14px] md:text-[15px] lg:text-[16px] mt-1">
                        45 minutes / 75 USD
                      </span>
                    </h2>
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-black mb-4 leading-relaxed max-w-2xl">
                      A consultation call to help match you with your perfect
                      crystal bowl. We&apos;ll explore your goals, answer your
                      questions, and help you feel confident in choosing the
                      right bowls.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/discoveryappointment"
                      className="rounded-lg border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors"
                    >
                      BOOK NOW
                    </Link>
                  </div>
                </div>
              </div>

              {/* Corporate Session Box */}
              <div className="bg-white/50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Content */}
                  <div className="flex-1">
                    <h2 className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Corporate Wellness Solutions
                    </h2>
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] text-black mb-4 leading-relaxed max-w-2xl">
                      Invite Crystal Bowl Studio into your workplace for team
                      bonding, seminars, sound healing, recharge and
                      rejuvenate.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/corporate-session"
                      className="rounded-lg border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors"
                    >
                      REGISTER YOUR INTEREST
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BookASessionPage;
