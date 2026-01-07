"use client";

import React, { useState } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const BookACallPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("userToken");
    }
    return false;
  });

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 py-[68px]">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 items-center   w-full md:mb-12 flex flex-col justify-between sm:flex-row gap-4 sm:gap-8 md:gap-[62px]">
              <div className="flex  items-center gap-[50px]">
                <h2 className="text-[#D5B584] text-[28px] sm:text-[32px] md:text-[40px] font-normal">
                  Book a Call
                </h2>
                <p className="text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light"></p>
              </div>
            </div>

            {/* Call Options */}
            <div className="flex flex-col bg-gray-50/10  ">
              {/* Studio Visit Option */}
              <div className=" backdrop-blur-sm  p-6 md:p-8 ">
                <h3 className="text-[#1C3163] text-xl md:text-2xl font-semibold mb-2">
                  Alchemy Bowls | Free Studio Visit in Munich
                </h3>
                <p className="text-[#1C3163] text-sm md:text-base font-medium mb-3 opacity-80">
                  45 minutes
                </p>
                <p className="text-[#1C3163] text-sm md:text-base font-light leading-relaxed">
                  This is for you if you want to come and visit the Alchemy
                  Sound Studio in Person in Munich. We are so happy to welcome
                  you.
                </p>
              </div>

              <hr className="border-b  opacity-25 border-gray-50" />
              {/* Online Discovery Call Option */}
              <div className=" backdrop-blur-sm p-6 md:p-8 ">
                <h3 className="text-[#1C3163] text-xl md:text-2xl font-semibold mb-2">
                  Alchemy Bowls | Free Online Discovery Call
                </h3>
                <p className="text-[#1C3163] text-sm md:text-base font-medium mb-3 opacity-80">
                  30 minutes
                </p>
                <p className="text-[#1C3163] text-sm md:text-base font-light leading-relaxed">
                  This is a 30 Min free Alchemy Bowl Discovery Call for you. We
                  meet on zoom.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BookACallPage;
