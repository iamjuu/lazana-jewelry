"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

type Session = {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  sessionType?: "regular" | "corporate" | "private" | "discovery";
  format?: string;
  benefits?: string[];
  createdAt: string;
  updatedAt: string;
};

const ServicesPage = () => {
  const router = useRouter();
  const [corporateCurrentIndex, setCorporateCurrentIndex] = useState(0);
  const [privateCurrentIndex, setPrivateCurrentIndex] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("userToken");
    }
    return false;
  });

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await fetch("/api/sessions");
      const data = await response.json();
      if (data.success && data.data) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const corporateSessions = sessions.filter((s) => s.sessionType === "corporate");
  const privateSessions = sessions.filter((s) => s.sessionType === "private");

  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth >= 768 ? 3 : 1);
    };
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Handlers for Carousel Navigation
  const handlePrev = (index: number, setIndex: React.Dispatch<React.SetStateAction<number>>, length: number) => {
    setIndex((prev) => (prev === 0 ? Math.max(0, Math.ceil(length / itemsPerPage) - 1) : prev - 1));
  };

  const handleNext = (index: number, setIndex: React.Dispatch<React.SetStateAction<number>>, length: number) => {
    const maxPage = Math.max(0, Math.ceil(length / itemsPerPage) - 1);
    setIndex((prev) => (prev === maxPage ? 0 : prev + 1));
  };

  return (
    <div className="bg-[#FDF2E9] min-h-screen">
      <Navbar />
      
      <main className="w-full pt-12 pb-0 b">
        {/* HERO / TOP SECTION - Matches your design image */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
            
            {/* Left Column - Text Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="space-y-4">
                <h2 className="font-seasons text-[32px] md:text-[44px] text-[#D4A373] font-normal">
                  Services
                </h2>
                <p className="font-touvlo text-[16px] md:text-[18px] text-[#545454] leading-relaxed max-w-xl">
                  Whether through a guided sound bath, meditation or private
                  session, Yoga and Sound Healing offers a powerful way to
                  reconnect with your inner self, reduce stress, and achieve
                  mental, emotional and physical balance.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="font-seasons text-[32px] md:text-[44px] text-[#D4A373] font-normal">
                  Work with Me
                </h2>
                <div className="space-y-4">
                  <h3 className="font-seasons text-[22px] md:text-[28px] text-[#1C3163] leading-tight">
                    Healing & Transformation through Sound, Movement & Energy Work
                  </h3>
                  <p className="font-touvlo text-[16px] md:text-[18px] text-[#545454] leading-relaxed max-w-xl">
                    I offer tailored experiences for individuals, groups,
                    and organizations seeking a deeper transformation
                    through Yoga, Sound Healing, and Meditation.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <h2 className="font-seasons text-[32px] md:text-[44px] text-[#D4A373] font-normal">
                  For Corporate & Group
                </h2>
              </div>
            </div>

            {/* Right Column - Hero Image (Fixed Aspect Ratio) */}
            <div className="w-full lg:w-1/2 mt-18">
              <div className="relative w-full aspect-[4/3] md:aspect-[3/2] lg:aspect-[4/5] xl:aspect-square overflow-hidden  w-[450px] h-[350px]">
                <Image
                  src="/assets/images/about/2025Frankie374.jpg"
                  alt="Sound healing session"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* 1. CORPORATE SESSIONS LOOP */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mt-6 font-seasons">
          {sessionsLoading ? (
            <div className="text-center py-12 text-[#D5B584]">Loading sessions...</div>
          ) : (
            <div className="relative overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${corporateCurrentIndex * 100}%)` }}
              >
                {corporateSessions.map((item) => (
                  <div key={item._id} className="min-w-full md:min-w-[calc(33.333%-1rem)]">
                    <div className="relative group aspect-[3/4] overflow-hidden rounded-2xl shadow-sm">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title || "Session"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 font-touvlo" >
                        <h3 className="text-white text-xl font-medium mb-3">{item.title}</h3>
                        <button 
                          onClick={() => router.push("/corporate-session")} 
                          className="text-white text-sm flex items-center gap-2 hover:gap-3 transition-all text-touvlo"
                        >
                          Enquire Now <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. PRIVATE & GROUP OFFERINGS SECTION */}
     <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mt-6">
  <h2 className="font-seasons text-[32px] md:text-[40px] text-[#D4A373] font-normal mb-8">
    Private & Group Offerings
  </h2>

  {sessionsLoading ? (
    <div className="text-center py-12 text-[#D5B584] animate-pulse">
      Loading sessions...
    </div>
  ) : privateSessions.length > 0 ? (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-6 transition-transform duration-500 ease-in-out"
        /* We use 100% to slide by one full container width */
        style={{ transform: `translateX(-${privateCurrentIndex * 100}%)` }}
      >
        {privateSessions.map((item) => (
          <div 
            key={item._id} 
            className="min-w-full md:min-w-[calc(33.333%-1rem)] flex-shrink-0"
          >
            <div className="relative group aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-white/10">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Private Session"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#D4A373]/50 italic">
                  Image coming soon
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-medium mb-3">
                  {item.title || "Private Session"}
                </h3>
                <button 
                  onClick={() => router.push(isLoggedIn ? "/privateappointment" : "/login")} 
                  className="text-white text-sm flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Book Now <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots - Only show if there is more than one page */}
      {privateSessions.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(privateSessions.length / itemsPerPage) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPrivateCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === privateCurrentIndex ? 'bg-[#D4A373] w-8' : 'bg-[#D4A373]/30 w-2'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  ) : (
    /* Fallback if length is 0 */
    <div className="text-center py-20 rounded-2xl">
      <p className="font-touvlo text-[#545454]">
        No private sessions are currently scheduled. Please check back soon.
      </p>
    </div>
  )}
</section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;