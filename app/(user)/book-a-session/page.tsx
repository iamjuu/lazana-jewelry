"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import Link from "next/link";

const BookASessionPage = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="w-full ">
        <section className="w-full px-4 mt-[25px]">
          <div className="max-w-6xl  mx-auto ">
            {/* Header */}
            <div className="">
              <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Book an Appointment
              </h1>
              <p className="text-[#545454] sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] leading-relaxed max-w-2xl mt-[25px] font-touvlo">
                Choose the appointment that fits your needs, from a private
                studio visit to a styling consultation or corporate enquiry.
              </p>
            </div>

            {/* Session Boxes */}
            <div className="space-y-[25px] mt-[25px]">
              {/* Free Studio Visit Box */}
              <div className="bg-white/50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Left Content */}
                  <div className="flex-1">
                    <h2 className="font-seasons  flex flex-col text-[20px] sm:text-[24px] md:text-[20px] lg:text-[20px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Free Studio Visit in Singapore
                      <span className="text-[13px] text-gray-500 sm:text-[14px] md:text-[16px] lg:text-[16px] mt-1">
                        30 minutes
                      </span>
                    </h2>
                    <p className="sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] text-[#545454] mb-4 leading-relaxed max-w-2xl font-touvlo">
                      This is for you if you want to come and visit in person to
                      experience and preview Lazana Jewelry live before
                      purchasing our collection.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/free-studio-visit"
                      className="rounded-lg border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors font-touvlo"
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
                    <h2 className="font-seasons text-[20px] flex flex-col sm:text-[20px] md:text-[20px] lg:text-[20px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Discovery Call
                      <span className="text-[13px] text-gray-500 sm:text-[14px] md:text-[15px] lg:text-[16px] mt-1">
                        45 minutes / INR 75
                      </span>
                    </h2>
                    <p className="text-[14px] sm:text-[16px] md:text-[16px] lg:text-[16px] text-[#545454] mb-4 leading-relaxed max-w-2xl font-touvlo">
                      A consultation call to help match you with your perfect
                      piece. We&apos;ll talk through your style, answer your
                      questions, and help you feel confident choosing the right
                      pieces.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/discoveryappointment"
                      className="rounded-lg font-touvlo border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors"
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
                    <h2 className="font-seasons text-[20px] sm:text-[20px] md:text-[20px] lg:text-[20px] text-[#1C3163] font-medium mb-3 sm:mb-4">
                      Corporate Gifting & Brand Enquiries
                    </h2>
                    <p className="text-[14px] sm:text-[16px] md:text-[16px] lg:text-[16px] text-[#545454]   mb-4 leading-relaxed max-w-2xl font-touvlo">
                      Speak with us about client gifting, team experiences,
                      pop-ups, trunk shows, and branded jewelry enquiries for
                      your company or event.
                    </p>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 lg:self-center">
                    <Link
                      href="/corporate-session"
                      className="rounded-lg border border-zinc-700 bg-[#1C3163] px-4 py-2 text-[12px] font-medium text-zinc-300 hover:bg-[#7A6345] hover:text-white disabled:opacity-60 transition-colors font-touvlo"
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

