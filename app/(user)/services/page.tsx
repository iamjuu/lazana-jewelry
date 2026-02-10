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
  // On mobile, tap card to show description (no hover); one card expanded at a time
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

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

  const corporateSessions = sessions.filter(
    (s) => s.sessionType === "corporate",
  );
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
  const handlePrev = (
    index: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    length: number,
  ) => {
    setIndex((prev) =>
      prev === 0 ? Math.max(0, Math.ceil(length / itemsPerPage) - 1) : prev - 1,
    );
  };

  const handleNext = (
    index: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    length: number,
  ) => {
    const maxPage = Math.max(0, Math.ceil(length / itemsPerPage) - 1);
    setIndex((prev) => (prev === maxPage ? 0 : prev + 1));
  };

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2]  min-h-screen ">
      <Navbar />

      <main className="w-full md:px-4 ">
        {/* HERO / TOP SECTION - Matches your design image */}
        <section className="max-w-7xl mx-auto px-6 md:px-6 lg:px-0">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
            {/* Left Column - Text Content */}
            <div className="w-full lg:w-1/2 mt-[25px] ">
              <div className="">
                <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                  Services
                </h2>
                <p className="font-touvlo text-[14px] sm:text-[15px]  md:text-[16px] text-[#545454] leading-relaxed max-w-xl mt-[25px] ">
                  Whether through a guided sound bath, meditation or private
                  session, Yoga and Sound Healing offers a powerful way to
                  reconnect with your inner self, reduce stress, and achieve
                  mental, emotional and physical balance.
                </p>
              </div>

              <div className="mt-[25px]">
                <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                  Work with Me
                </h2>
                <div className="mt-[25px]">
                  <h3 className="font-seasons text-[20px] sm:text-[24px] md:text-[18px] text-[#1C3163] leading-relaxed text-wrap">
                    Healing & Transformation through Sound, Movement & Energy
                    Work
                  </h3>
                  <p className="font-touvlo text-[14px] sm:text-[15px]   md:text-[16px] text-[#545454] leading-relaxed max-w-xl mt-[25px]">
                    I offer tailored experiences for individuals, groups, and
                    organizations seeking a deeper transformation through Yoga,
                    Sound Healing, and Meditation.
                  </p>
                </div>
              </div>

            
            </div>

            {/* Right Column - Hero Image (Fixed Aspect Ratio) */}
            <div className="w-full lg:w-1/2 mt-[44px]">
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
        <section className="max-w-7xl mx-auto px-6 md:px-6 lg:px-0 mt-[25px] font-seasons">
        <div className="mt-[25px]">
                <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                  For Corporate & Group
                </h2>
              </div>
          {sessionsLoading ? (
            <div className="text-center py-12 text-[#D5B584] mt-[25px]">
              Loading sessions...
            </div>
          ) : (
            <div className="relative overflow-hidden mt-[25px]">
              <div
                className="flex gap-6 transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${corporateCurrentIndex * 100}%)`,
                }}
              >
                {corporateSessions.map((item) => (
                  <div
                    key={item._id}
                    className="min-w-full md:min-w-[calc(33.333%-1rem)]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setExpandedCardId((id) =>
                          id === item._id ? null : item._id,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedCardId((id) =>
                            id === item._id ? null : item._id,
                          );
                        }
                      }}
                      className="relative group aspect-[3/4] overflow-hidden rounded-2xl shadow-sm cursor-pointer [touch-action:manipulation]"
                    >
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title || "Session"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {/* Default Overlay - Fades out on hover (desktop) or when expanded (mobile) */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 font-touvlo transition-opacity duration-300 group-hover:opacity-0 pointer-events-none ${expandedCardId === item._id ? "opacity-0" : ""}`}
                      >
                        <h3 className="text-white text-[18px] font-medium mb-3 text-touvlo">
                          {item.title}
                        </h3>
                        <span className="text-white text-sm flex items-center gap-2 text-touvlo">
                          Enquire Now <span className="text-[16px]">→</span>
                        </span>
                      </div>

                      {/* Description overlay - hover on desktop, tap to show on mobile. When hidden, pointer-events-none so tap reaches the card. */}
                      <div
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute inset-0 bg-black/60 p-6 flex flex-col gap-3 transition-all duration-300 overflow-y-auto overflow-x-hidden ${expandedCardId === item._id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCardId(null)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg leading-none md:hidden"
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <h3 className="font-seasons text-[20px] text-[#D4A373] leading-tight shrink-0 pr-8">
                          {item.title}
                        </h3>

                        {item.description && (
                          <div className="font-touvlo text-zinc-200 text-[13px] leading-relaxed shrink-0">
                            {item.description}
                          </div>
                        )}

                        {item.benefits && item.benefits.length > 0 && (
                          <div className="font-touvlo text-zinc-200 text-[13px] shrink-0">
                            <p className="font-semibold mb-1 text-[#D4A373]">
                              Key Benefits:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {item.benefits.map((benefit, idx) => (
                                <li key={idx}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-4 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/corporate-session");
                            }}
                            className="w-full bg-[#D4A373] text-white py-2 rounded-full font-touvlo text-[14px] hover:bg-[#c29363] transition-colors"
                          >
                            Enquire Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. PRIVATE & GROUP OFFERINGS SECTION */}
        <section className="max-w-7xl mx-auto px-6 md:px-6 lg:px-0 mt-[25px] font-seasons">
          <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none ">
            Private & Group Offerings
          </h2>

          {sessionsLoading ? (
            <div className="text-center mt-[25px] text-[#D5B584] animate-pulse">
              Loading sessions...
            </div>
          ) : privateSessions.length > 0 ? (
            <div className="relative overflow-hidden mt-[25px]">
              <div
                className="flex gap-6 transition-transform duration-500 ease-in-out"
                /* We use 100% to slide by one full container width */
                style={{
                  transform: `translateX(-${privateCurrentIndex * 100}%)`,
                }}
              >
                {privateSessions.map((item) => (
                  <div
                    key={item._id}
                    className="min-w-full md:min-w-[calc(33.333%-1rem)] flex-shrink-0"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setExpandedCardId((id) =>
                          id === item._id ? null : item._id,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedCardId((id) =>
                            id === item._id ? null : item._id,
                          );
                        }
                      }}
                      className="relative group aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-white/10 cursor-pointer [touch-action:manipulation]"
                    >
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

                      {/* Default Overlay - Fades out on hover (desktop) or when expanded (mobile) */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none ${expandedCardId === item._id ? "opacity-0" : ""}`}
                      >
                        <h3 className="text-white text-[18px] text-touvlo font-medium mb-3">
                          {item.title || "Private Session"}
                        </h3>
                        <span className="text-white text-sm flex items-center gap-2">
                          Book Now <span className="text-[16px] text-touvlo">→</span>
                        </span>
                      </div>

                      {/* Description overlay - hover on desktop, tap to show on mobile. When hidden, pointer-events-none so tap reaches the card. */}
                      <div
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute inset-0 bg-black/60 p-6 flex flex-col gap-3 transition-all duration-300 overflow-y-auto overflow-x-hidden ${expandedCardId === item._id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCardId(null)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg leading-none md:hidden"
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <h3 className="font-seasons text-[20px] text-[#D4A373] leading-tight shrink-0 pr-8">
                          {item.title || "Private Session"}
                        </h3>

                        {item.description && (
                          <div className="font-touvlo text-zinc-200 text-[13px] leading-relaxed shrink-0">
                            {item.description}
                          </div>
                        )}

                        {item.benefits && item.benefits.length > 0 && (
                          <div className="font-touvlo text-zinc-200 text-[13px] shrink-0">
                            <p className="font-semibold mb-1 text-[#D4A373]">
                              Key Benefits:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {item.benefits.map((benefit, idx) => (
                                <li key={idx}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-4 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                isLoggedIn ? "/privateappointment" : "/login",
                              );
                            }}
                            className="w-full bg-[#D4A373] text-white py-2 rounded-full font-touvlo text-[14px] hover:bg-[#c29363] transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Dots - Only show if there is more than one page */}
              {privateSessions.length > itemsPerPage && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({
                    length: Math.ceil(privateSessions.length / itemsPerPage),
                  }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPrivateCurrentIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === privateCurrentIndex
                          ? "bg-[#D4A373] w-8"
                          : "bg-[#D4A373]/30 w-2"
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
                No private sessions are currently scheduled. Please check back
                soon.
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
