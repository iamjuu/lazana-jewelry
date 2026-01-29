"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import {
  Services1,
  Services2,
  Services3,
  Services4
} from "@/public/assets";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const theSeasonsBold = localFont({
  src: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/fonnts.com-513211/fonts/fonnts.com-theseasons-bd.otf",
  display: "swap",
});

const touvloRegular = localFont({
  src: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/touvlo-regular-maisfontes.464c/touvlo-regular.otf",
  display: "swap",
});

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

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await fetch("/api/sessions");
      const data = await response.json();
      console.log("Sessions API response:", data); // Debug log
      if (data.success && data.data) {
        console.log("Sessions loaded:", data.data.length); // Debug log
        setSessions(data.data);
      } else {
        console.error("Failed to fetch sessions:", data.message || "Unknown error");
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Filter sessions by type
  const corporateSessions = sessions.filter((s) => s.sessionType === "corporate");
  const privateSessions = sessions.filter((s) => s.sessionType === "private");

  // Responsive items per page: 1 on mobile, 3 on desktop
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const updateItemsPerPage = () => {
      // Mobile: 1 item, Desktop (md and above): 3 items
      if (window.innerWidth >= 768) {
        setItemsPerPage(3);
      } else {
        setItemsPerPage(1);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const handleCorporatePrev = () => {
    setCorporateCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, Math.ceil(corporateSessions.length / itemsPerPage) - 1) : prev - 1
    );
  };

  const handleCorporateNext = () => {
    const maxPage = Math.max(0, Math.ceil(corporateSessions.length / itemsPerPage) - 1);
    setCorporateCurrentIndex((prev) =>
      prev === maxPage ? 0 : prev + 1
    );
  };

  const handlePrivatePrev = () => {
    setPrivateCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, Math.ceil(privateSessions.length / itemsPerPage) - 1) : prev - 1
    );
  };

  const handlePrivateNext = () => {
    const maxPage = Math.max(0, Math.ceil(privateSessions.length / itemsPerPage) - 1);
    setPrivateCurrentIndex((prev) =>
      prev === maxPage ? 0 : prev + 1
    );
  };

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full ">
        <section className="w-full px-4 md:px-0 py-[0px] mt-[35px]">
          <div className="max-w-6xl pb-[10px] mx-auto">
            <div className="flex flex-col w-full ">
              {/* Section Title */}
              <h2 className={`${theSeasonsBold.className} text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-0 text-[#D5B584] font-normal`}>
                Services
              </h2>

              {/* Content Container */}
              <div className="flex flex-col lg:flex-row w-full items-center gap-8 md:gap-10 lg:gap-12">
                {/* Left side - Text Content */}
                <div className="w-full lg:w-[55%] xl:w-[50%]">
                  <div className={`${touvloRegular.className} flex flex-col gap-4 sm:gap-5 md:gap-6 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed md:leading-loose`}>
                    <p>
                      Whether through a guided sound bath, meditation or private session, Yoga and Sound Healing offers a powerful way to reconnect with your inner self, reduce stress, and achieve mental, emotional and physical balance.
                    </p>
                  </div>
                </div>

                {/* Right side - Image */}
                <div className="w-full lg:w-[45%] xl:w-[50%] mt-4 lg:mt-0">
                  <div className="relative w-full overflow-hidden shadow-lg rounded-lg">
                    <Image
                      src="/assets/images/about/2025Frankie374.jpg"
                      alt="Sound healing session"
                      width={500}
                      height={600}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work With Me Section */}
          <div className="max-w-6xl mx-auto mt-16 md:mt-20 lg:mt-[50px] px-4 md:px-0">
            <div className="flex flex-col lg:flex-row w-full gap-8 md:gap-12 lg:gap-16">
              {/* Left side - Title */}
              <div className="w-full lg:w-[40%]">
                <h2 className={`${theSeasonsBold.className} text-[32px] sm:text-[36px] md:text-[40px] text-[#D5B584] font-normal leading-tight`}>
                  Work With Me
                </h2>
              </div>

              {/* Right side - Content */}
              <div className="w-full lg:w-[60%]">
                <div className="flex flex-col gap-6">
                  <h3 className={`${theSeasonsBold.className} text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] text-[#1C3163] font-normal`}>
                    Healing & Transformation through Sound, Movement & Energy Work
                  </h3>
                  <p className={`${touvloRegular.className} text-[14px] sm:text-[15px] md:text-[16px] text-[#545454] font-light leading-relaxed`}>
                    I offer tailored experiences for individuals, groups, and organizations seeking a deeper transformation through Yoga, Sound Healing, and Meditation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-16 md:mt-20 lg:mt-[50px] px-4 md:px-0">
            <h2 className="text-[32px] pb-[40px]  sm:text-[36px] md:text-[40px]  text-[#D5B584] font-light leading-tight">
              For Corporate & Group
            </h2>
            {sessionsLoading ? (
              <div className="text-center py-12 text-[#D5B584]">Loading sessions...</div>
            ) : corporateSessions.length === 0 ? (
              <div className="text-center py-12 text-[#6B5D4F]">No corporate sessions available.</div>
            ) : (
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-3 sm:gap-4 transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${corporateCurrentIndex * 100}%)`
                    }}
                  >
                    {corporateSessions.map((item) => (
                
                      <div
                        key={item._id}
                        className="min-w-full md:min-w-[calc(33.333%-0.667rem)]"
                      >
                        <div className="relative   group overflow-hidden rounded-[20px] h-[400px] sm:h-[450px] md:h-[640px] w-full">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title || `Corporate & Group ${item._id}`}
                              width={500}
                              height={500}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#D5B584]/20 to-[#D5B584]/40 flex items-center justify-center">
                              <span className="text-[#D5B584] text-lg">No Image</span>
                            </div>
                          )}
                          {/* Default Overlay with Title and Button - always visible on mobile, hides on hover for desktop */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-5 md:p-6 md:group-hover:opacity-0 transition-opacity duration-300">
                            <h3 className="text-white text-[16px] sm:text-[18px] md:text-[20px] font-normal mb-3 leading-snug">
                              {item.title || "Corporate Session"}
                            </h3>
                            <button 
                              onClick={() => router.push('/corporate-session')}
                              className="flex items-center gap-2 text-white text-[14px] sm:text-[15px] font-light hover:gap-3 transition-all duration-300"
                            >
                              Enquire Now
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 12H19M19 12L12 5M19 12L12 19"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Hover Overlay with Details - hidden on mobile, visible on hover for desktop */}
                          <div className="absolute inset-0 bg-black/70 p-6 sm:p-8 md:p-10 opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-300 hidden md:flex flex-col justify-between overflow-y-auto">
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                              {item.description && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Description:
                                  </h4>
                                  <p className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              )}

                              {item.format && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Format:
                                  </h4>
                                  <p className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light">
                                    {item.format}
                                  </p>
                                </div>
                              )}

                              {item.benefits && item.benefits.length > 0 && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Benefits:
                                  </h4>
                                  <ul className="space-y-2">
                                    {item.benefits.map((benefit, index) => (
                                      <li
                                        key={index}
                                        className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light flex items-start gap-2"
                                      >
                                        <span className="text-[#D5B584] mt-1">•</span>
                                        <span>{benefit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => router.push('/corporate-session')}
                              className="flex items-center gap-2 text-white text-[14px] sm:text-[15px] font-light hover:gap-3 transition-all duration-300 mt-6"
                            >
                              Enquire Now
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 12H19M19 12L12 5M19 12L12 19"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {corporateSessions.length > itemsPerPage && (
                  <>
                    <button
                      onClick={handleCorporatePrev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                      aria-label="Previous slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="#D5B584"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCorporateNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                      aria-label="Next slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="#D5B584"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {corporateSessions.length > itemsPerPage && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(corporateSessions.length / itemsPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCorporateCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === corporateCurrentIndex
                            ? "bg-[#D5B584] w-8"
                            : "bg-[#D5B584]/30"
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="max-w-6xl  mx-auto mt-16 md:mt-20 lg:mt-[50px] px-4 md:px-0 " >
            <h2 className="text-[32px] pb-[40px]  sm:text-[36px] md:text-[40px]  text-[#D5B584] font-light leading-tight">
              Private & Group Offerings
            </h2>
            {sessionsLoading ? (
              <div className="text-center py-12 text-[#D5B584]">Loading sessions...</div>
            ) : privateSessions.length === 0 ? (
              <div className="text-center py-12 text-[#6B5D4F]">No private sessions available.</div>
            ) : (
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-3 sm:gap-4 transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${privateCurrentIndex * 100}%)`
                    }}
                  >
                    {privateSessions.map((item) => (
                      <div
                        key={item._id}
                        className="min-w-full md:min-w-[calc(33.333%-0.667rem)]"
                      >
                        <div className="relative group overflow-hidden rounded-[20px] h-[400px] sm:h-[450px] md:h-[640px] w-full">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title || `Private & Group ${item._id}`}
                              width={500}
                              height={500}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#D5B584]/20 to-[#D5B584]/40 flex items-center justify-center">
                              <span className="text-[#D5B584] text-lg">No Image</span>
                            </div>
                          )}
                          {/* Default Overlay with Title and Button - always visible on mobile, hides on hover for desktop */}
                          <div className="absolute bottom-0 left-0 right-0 to-transparent p-4 sm:p-5 md:p-6 md:group-hover:opacity-0 transition-opacity duration-300">
                            <h3 className="text-white text-[16px] sm:text-[18px] md:text-[20px] font-normal mb-3 leading-snug">
                              {item.title || "Private Session"}
                            </h3>
                            <button 
                              onClick={() => router.push(isLoggedIn ? '/privateappointment' : '/login')}
                              className="flex items-center gap-2 text-white text-[14px] sm:text-[15px] font-light hover:gap-3 transition-all duration-300"
                            >
                              Book Now
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 12H19M19 12L12 5M19 12L12 19"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Hover Overlay with Details - hidden on mobile, visible on hover for desktop */}
                          <div className="absolute inset-0 bg-black/40 p-6 sm:p-8 md:p-10 opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-300 hidden md:flex flex-col justify-between overflow-y-auto">
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                              {item.description && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Description:
                                  </h4>
                                  <p className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              )}

                              {item.format && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Format:
                                  </h4>
                                  <p className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light">
                                    {item.format}
                                  </p>
                                </div>
                              )}

                              {item.benefits && item.benefits.length > 0 && (
                                <div>
                                  <h4 className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mb-2">
                                    Benefits:
                                  </h4>
                                  <ul className="space-y-2">
                                    {item.benefits.map((benefit, index) => (
                                      <li
                                        key={index}
                                        className="text-white text-[12px] sm:text-[13px] md:text-[14px] font-light flex items-start gap-2"
                                      >
                                        <span className="text-[#D5B584] mt-1">•</span>
                                        <span>{benefit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => router.push(isLoggedIn ? '/privateappointment' : '/login')}
                              className="flex items-center gap-2 text-white text-[14px] sm:text-[15px] font-light hover:gap-3 transition-all duration-300 mt-6"
                            >
                              Book Now
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 12H19M19 12L12 5M19 12L12 19"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {privateSessions.length > itemsPerPage && (
                  <>
                    <button
                      onClick={handlePrivatePrev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                      aria-label="Previous slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="#D5B584"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handlePrivateNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10"
                      aria-label="Next slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="#D5B584"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {privateSessions.length > itemsPerPage && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(privateSessions.length / itemsPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setPrivateCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === privateCurrentIndex
                            ? "bg-[#D5B584] w-8"
                            : "bg-[#D5B584]/30"
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div >
      <div className="mt-[50px]">
      <Footer /></div>
    </div>
  );
};

export default ServicesPage;
