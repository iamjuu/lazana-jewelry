"use client";
import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/user/Navbar";
import Image from "next/image";
import localFont from "next/font/local";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

import {
  Bucket1,
  Bucket2,
  Bucket3,
  Crystal,
  Intention,
  landingjewleries1,
  landingjewleries2,
  LightWeight,
  ServiceImage1,
  ServiceImage2,
  ServiceImage3,
  TestimonialIcon,
  UniqueToYou,
  UpcomingEvent1,
  UpcomingEvent2,
  UpcomingEvent3,
  UpcomingEvent4,
  Yoga1,
  Yoga2,
  Yoga3,
  YogaSection1,
  YogaSection2,
  YogaSection3,
} from "@/public/assets";

import Footer from "@/components/user/Footer";
import { FillCdnImage } from "@/components/user/FillCdnImage";
import { PremiumQuality } from "@/public/assets";
import Link from "next/link";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import AboutSectionComponent from "./components/about/AboutSection";
import CollectionSection from "./components/collection/collectionSection";

// Ivy Mode font configuration
const ivyMode = localFont({
  src: [
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ivy-mode",
  display: "swap",
});

const Data = [
  {
    id: 1,
    image: Bucket1,
    title: "Bucket 1",
    description: "Bucket 1 description",
    price: "₹1000",
  },
  {
    id: 2,
    image: Bucket2,
    title: "Bucket 2",
    description: "Bucket 2 description",
    price: "₹2000",
  },
  {
    id: 3,
    image: Bucket3,
    title: "Bucket 3",
    description: "Bucket 3 description",
    price: "₹3000",
  },
  {
    id: 4,
    image: Bucket2,
    title: "Bucket 2",
    description: "Bucket 2 description",
    price: "₹5000",
  },
];

const YogaImage = [
  {
    id: 1,
    image: ServiceImage1,
    title: "Private Styling Appointments",
    description: "Personal support to help you choose pieces that suit your style",
  },
  {
    id: 2,
    image: ServiceImage2,
    title: "Corporate Gifting",
    description: "Thoughtful gifting and branded jewelry enquiries for teams and clients",
  },
  {
    id: 3,
    image: ServiceImage3,
    title: "Studio Visits & Private Events",
    description: "In-person experiences to discover the collection up close",
  },
];

const CreativeJourneyData = [
  {
    id: 1,
    image: YogaSection1,
    title: "Explore timeless pieces designed for layering and everyday wear",
    description: "",
  },
  {
    id: 2,
    image: YogaSection2,
    title: "Discover styling details, finishes, and materials that suit your taste",
    description: "",
  },
  {
    id: 3,
    image: YogaSection3,
    title: "Book private appointments, studio visits, or gifting enquiries",
    description: "",
  },
];

const TestimonialsData = [
  {
    id: 1,
    name: "Tanisha M.",
    testimonial:
      "The pieces feel even better in person. Everything looks refined, lightweight, and easy to wear, and the styling advice made it simple to choose a set I know I will keep reaching for.",
  },
  {
    id: 2,
    name: "David V.",
    testimonial:
      "Lazana Jewelry has that balance of polish and ease that is hard to find. The finish is beautiful, the quality feels solid, and the pieces layer naturally without looking overstyled.",
  },
  {
    id: 3,
    name: "Neeraj K.",
    testimonial:
      "I ordered a gift and the whole experience felt thoughtful from start to finish. The team helped me pick the right piece quickly, and the packaging made it feel special immediately.",
  },
  {
    id: 4,
    name: "John V.",
    testimonial:
      "The discovery call was genuinely useful. Instead of guessing online, I got clear recommendations on length, layering, and what would work best for daily wear.",
  },
  {
    id: 5,
    name: "Peter H.",
    testimonial:
      "What stood out to me most was the wearability. The jewelry feels elevated but still practical, which means I actually use it across work, travel, and evenings out.",
  },
  {
    id: 6,
    name: "Nipun M.",
    testimonial:
      "We reached out for a branded gifting enquiry and the process was smooth, responsive, and professional. The end result felt premium and well considered for our audience.",
  },
];

const UpcomingEventsData = [
  {
    id: 1,
    image: UpcomingEvent1,
    date: "07 Monday",
    title: "Private Studio Preview",
  },
  {
    id: 2,
    image: UpcomingEvent2,
    date: "10 Thursday",
    title: "Corporate Gifting Consultation",
  },
  {
    id: 3,
    image: UpcomingEvent3,
    date: "17 Friday",
    title: "1:1 Styling Availability",
  },
  {
    id: 4,
    image: UpcomingEvent4,
    date: "07 Monday",
    title: "Collection Preview Event",
  },
];

type Category = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured?: boolean;
};

type Event = {
  _id: string;
  title: string;
  name?: string;
  date: string;
  day: string;
  time: string;
  imageUrl?: string;
  endDate?: string;
};

type Session = {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  sessionType?:
    | "regular"
    | "corporate"
    | "private"
    | "discovery"
    | "freeStudioVisit";
  featured?: boolean;
};

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCorporateSessions, setFeaturedCorporateSessions] = useState<
    Session[]
  >([]);
  const [featuredPrivateSessions, setFeaturedPrivateSessions] = useState<
    Session[]
  >([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestLoading, setBestLoading] = useState(true);

  const [testimonialCurrentIndex, setTestimonialCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to convert base64 string to data URL if needed
  const normalizeImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:image")) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  // Prefer a human-readable event title (avoid showing IDs or garbled data)
  const getEventDisplayTitle = (event: Event): string => {
    const t = event.title?.trim();
    const n = event.name?.trim();
    const looksLikeId = t && t.length >= 12 && !/\s/.test(t) && /^[a-zA-Z0-9]+$/.test(t);
    if (t && !looksLikeId) return t;
    if (n) return n;
    return t || "Event";
  };

  // Shorten "6:00 AM" to "6 AM" so date line fits within card (no overflow)
  const shortenTime = (t: string): string =>
    t.replace(/:00\s*(?=AM|PM)/gi, " ");

  // Helper function to format time with day/date
  const formatTime = (
    day: string,
    time: string,
    dateString: string,
    endDateString?: string,
  ): string => {
    if (!endDateString) {
      return ` · ${shortenTime(time)}`;
    }

    const timeParts = time.split("-").map((t) => t.trim());
    const startTime = timeParts[0] || time;
    const endTime = timeParts[1] || "";

    const startDate = new Date(dateString);
    const endDate = new Date(endDateString);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startMonth = months[startDate.getMonth()];
    const startDay = startDate.getDate();
    const endMonth = months[endDate.getMonth()];
    const endDay = endDate.getDate();

    const isMultiDay = startDate.getDate() !== endDate.getDate() || 
                      startDate.getMonth() !== endDate.getMonth() || 
                      startDate.getFullYear() !== endDate.getFullYear();

    if (endTime && isMultiDay) {
      // Shortened format for Home Page cards: "6 AM - 11 AM" when minutes are :00
      return ` · ${shortenTime(startTime)} - ${shortenTime(endTime)}`;
    }

    return ` · ${shortenTime(time)}`;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        // Filter only featured categories
        const featuredCategories = data.data.filter(
          (cat: Category) => cat.isFeatured === true,
        );
        setCategories(featuredCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      if (data.success && data.data) {
        // Filter events that are today or in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data.data
          .filter((event: Event) => {
            try {
              const eventDate = new Date(event.date);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate >= today;
            } catch {
              return false;
            }
          })
          .sort((a: Event, b: Event) => {
            // Sort by date ascending (nearest first)
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .slice(0, 4); // Only take the first 4 upcoming events

        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchFeaturedSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      if (data.success && data.data) {
        // Filter featured corporate sessions (limit 3)
        const corporate = data.data
          .filter(
            (session: Session) =>
              session.sessionType === "corporate" && session.featured === true,
          )
          .slice(0, 3);

        // Filter featured private sessions (limit 3)
        const privateSessions = data.data
          .filter(
            (session: Session) =>
              session.sessionType === "private" && session.featured === true,
          )
          .slice(0, 3);

        setFeaturedCorporateSessions(corporate);
        setFeaturedPrivateSessions(privateSessions);
      }
    } catch (error) {
      console.error("Failed to fetch featured sessions:", error);
    }
  };

  const fetchBestSellers = async () => {
    try {
      setBestLoading(true);
      const response = await fetch("/api/products?bestSelling=true&limit=4");
      const data = await response.json();
      if (data.success && data.data) {
        setBestSellers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch best sellers:", error);
    } finally {
      setBestLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUpcomingEvents();
    fetchFeaturedSessions();
    fetchBestSellers();
  }, []);

  // Mobile (iOS Safari, Android Chrome): autoplay often needs explicit play() and muted; try on multiple readiness events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const attemptPlay = () => {
      if (video.paused) {
        video.muted = true;
        video.play().catch(() => {});
      }
    };
    const events = ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"] as const;
    events.forEach((ev) => video.addEventListener(ev, attemptPlay));
    if (video.readyState >= 2) attemptPlay();
    return () => events.forEach((ev) => video.removeEventListener(ev, attemptPlay));
  }, []);

  const Icons = [
    {
      id: 1,
      image: PremiumQuality,
      title: " Premium Craftsmanship",
      para: "Each piece is finished with care—quality materials and details you can see and feel.",
    },

    {
      id: 2,
      image: UniqueToYou,
      title: "Light Weight",
      para: "Lightweight designs made for everyday wear—easy to layer and take with you.",
    },

    {
      id: 3,
      image: Crystal,
      title: "Made for You",
      para: "Each piece feels unique—choose finishes and styles that feel like you.",
    },
    {
      id: 4,
      image: Intention,
      title: "With Intention",
      para: "Thoughtfully chosen details, finishes, and silhouettes designed to feel personal from the first wear.",
    },
  ];

  return (
    <div className="bg-white min-h-screen w-full min-w-0 relative">
      {/* Navbar moved outside overflow-hidden so it stays visible on mobile after scroll (iOS fix) */}
      <Navbar />
      <div className="relative z-10 h-screen w-full overflow-hidden sm:mt-0">
        {/* <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => console.error("Video error:", e)}
          onLoadedData={() => console.log("Video loaded successfully")}
        >
          <source
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video> */}
        <div className="w-full flex justify-center items-center">
          
     
        <div className="max-w-7xl  pt-[100px] ">

        <Image src={landingjewleries2} alt="Lazana Jewelry hero" className="h-[600px] object-cover  px-2 md:object-fit rounded-2xl"/>
        </div>
           </div>

        <div className="relative z-10 h-full flex flex-col justify-between w-full">
          <div className="min-h-[64px] md:min-h-[84px]" />

          <div className="relative">
            <h1 className="font-seasons text-center pb-[60px] sm:pb-[80px] md:pb-[100px] lg:pb-[120px] px-4 text-[#000000] text-[28px] sm:text-[32px] md:text-[40px] lg:text-[50px]  leading-tight">
              Lazana Jewelry for
              <br /> timeless style{" "}
              <span style={{ fontFamily: "var(--font-montserrat)" }}>
                {"&"}
              </span>{" "}
              everyday elegance.
            </h1>
          </div>
        </div>
      </div>

 
      <div className="w-full relative z-0">
        {/* about section  */}

        {/* collection section  */}

        <CollectionSection categories={categories} loading={loading} />

        {/* Shop Lazana Jewelry */}
        <section className="w-full  md:py-0  mt-[25px]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex w-full items-center justify-between mb-6">
              <h2 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Shop Lazana Jewelry
              </h2>
              <Link
                href="/shop?category=all"
                className="font-seasons text-[#1c3163] flex items-center gap-1.5 text-[14px] sm:text-[14px] md:text-[16px] hover:opacity-80 transition-opacity"
              >
                Shop All
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full mt-[25px]">
              {loading ? (
                <div className="col-span-2 md:col-span-4 flex justify-center ">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#000000] border-t-transparent" />
                </div>
              ) : categories.length === 0 ? (
                <div className="col-span-2 md:col-span-4 text-center py-12 text-[#2d2d2d]">
                  <p>No featured categories available</p>
                </div>
              ) : (
                categories.slice(0, 4).map((category) => (
                  <div key={category._id} className="group">
                    <Link href={`/shop?category=${category.slug}`}>
                      <div className="relative w-full aspect-[4/5] md:aspect-square rounded-xl overflow-hidden bg-white/50">
                        {category.imageUrl ? (
                          <FillCdnImage
                            src={normalizeImageUrl(category.imageUrl)}
                            alt={category.name}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#000000] to-[#FEC1A2] flex items-center justify-center">
                            <span className="text-white text-lg font-medium text-center px-2 text-[#1c3163]">
                              {category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <p className="font-seasons pt-4 sm:pt-5 text-left  text-[14px] sm:text-[16px] md:text-[16px] text-[#1c3163]">
                      {category.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <section className="w-full mt-[25px]">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                About Lazana Jewelry
              </h2>
              {/* Wrapped in a fragment to replace the div but keep structure clean if needed, or just standard p tags */}
              <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] leading-[1.9] text-[#545454] mt-[25px]">
                Lazana Jewelry is designed for modern living with timeless
                craftsmanship. Each piece is carefully curated and finished to
                bring lasting beauty and confidence to your everyday look.{" "}
                <span className="font-semibold">
                  Our collections are versatile and made to be worn often,
                </span>{" "}
                with{" "}
                <span className="font-semibold">
                  elegant details
                </span>{" "}
                you will reach for again and again.{" "}
                <span className="font-semibold">
                  Discover pieces that feel personal—no two styling moments are the same.
                </span>
              </p>
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-[1.9] text-[#545454]">
                Each piece is chosen with care so you can find something that
                matches your taste and lifestyle. Lazana Jewelry offers
                thoughtfully curated designs made to complement and elevate
                modern life.
              </p>
            </div>
          </section>

          <div className="max-w-6xl flex flex-col mx-auto px-4 mt-[25px] ">
            <div className="flex w-full ">
              <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none ">
                What makes our jewelry unique
              </h1>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 lg:gap-[54px] mt-[25px] ">
              {Icons.map((item) => (
                <div
                  key={item.id}
                  className="flex text-black flex-col items-center  hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="leading-5">
                    <p className="font-seasons pt-4 sm:pt-6 md:pt-[28px] text-center font-normal text-[14px] sm:text-[16px] md:text-[18px] text-[#1c3163]">
                      {item.title}
                    </p>
                    <p className="text-center sm:text-[15px]  text-[14px]  md:text-[16px] font-light  sm:leading-[15px] md:leading-[22px] font-touvlo text-[#545454] mt-[25px]">
                      {item.para}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* holder  */}

        <section className="w-full mt-[25px] ">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex w-full items-center justify-between ">
              <h2
                className={`font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none`}
              >
                Our Best Sellers
              </h2>
              <Link
                href="/shop"
                className={`font-seasons text-[#1c3163] flex items-center gap-1.5 text-[14px] sm:text-[16px] md:text-[16px] hover:opacity-80 transition-opacity`}
              >
                Shop All
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full mt-[25px]">
              {bestLoading ? (
                <div className="col-span-2 md:col-span-4 flex justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#000000] border-t-transparent" />
                </div>
              ) : bestSellers.length === 0 ? (
                <div className="col-span-2 md:col-span-4 text-center py-12 text-[#545454]">
                  <p>No best sellers available</p>
                </div>
              ) : (
                bestSellers.slice(0, 4).map((product) => (
                  <div key={product._id} className="group">
                    <Link href={`/shop/${product._id}`}>
                      <div className="relative w-full aspect-[4/5] md:aspect-square rounded-xl overflow-hidden ">
                        {product.imageUrl &&
                        Array.isArray(product.imageUrl) &&
                        product.imageUrl.length > 0 ? (
                          <FillCdnImage
                            src={normalizeImageUrl(product.imageUrl[0])}
                            alt={product.name || "Product"}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#000000] to-[#FEC1A2] flex items-center justify-center">
                            <span className="text-white text-lg font-medium text-center px-2 f">
                              {product.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <p
                      className={`font-touvlo pt-4 sm:pt-5 text-left text-[#1c3163] text-[14px] sm:text-[16px] md:text-[16px]`}
                    >
                      {product.name}
                    </p>
                    <p className="text-left  md:text-[13px] text-[#545454] font-touvlo">
                      {product.discount ? (
                        <>
                          <span className="line-through mr-2">
                            ${product.price}
                          </span>
                          <span className="font-semibold text-[14px]">
                            $
                            {Math.round(
                              (product.price - product.discount) * 100,
                            ) / 100}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold font-touvlo text-[#545454] text-[14px]">
                          ${product.price} USD
                        </span>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-6xl mx-auto px-4 mt-[25px]">
            <div className="flex w-full items-center gap-4 sm:gap-5 md:gap-6 flex-wrap sm:flex-nowrap">
              <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                We Ship Globally.
              </h1>
              <Link
                href="/shipping-and-delivery"
                className="font-seasons flex items-center gap-2 text-[14px] sm:text-[16px] md:text-[16px] text-[#1f3364] hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                Learn more about our Shipping{" "}
                <span className="font-sans">&</span> Delivery{" "}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full mt-[25px]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col gap-4 md:gap-[25px]">
              <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Jewelry & intention
              </h1>
              <p className="text-[#545454] sm:text-[15px]  text-[14px]  md:text-[16px] leading-relaxed font-light font-touvlo">
                We believe jewelry is more than decoration. The right piece can
                become part of how you show up every day, adding polish,
                confidence, and a sense of personal style without effort.
              </p>
              <p className="text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-light font-touvlo">
                That is why we focus on pieces that feel easy to wear, easy to
                gift, and easy to return to again and again. Timeless design,
                quality materials, and versatility matter more than trend-led
                excess.
              </p>
              <div className="">
                <Link
                  href="/about"
                  className="font-seasons inline-flex items-center gap-2 text-[14px] sm:text-[16px] md:text-[16px] text-[#1C3163] hover:opacity-80 transition-opacity"
                >
                  Learn more about Lazana Jewelry
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <AboutSectionComponent />

        {(featuredCorporateSessions.length > 0 || featuredPrivateSessions.length > 0) && (
        <section className="w-full  md:py-[0px] mt-[25px] ">
          <div className="max-w-6xl flex flex-col  md:gap-0   mx-auto px-4">
            {/* Header */}
            <div className="mb-8 md:mb-6 flex justify-between items-center flex-wrap gap-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-[62px]">
                <h2 className="text-black text-[28px] sm:text-[30px] md:text-[32px] font-normal font-seasons">
                  Appointments
                </h2>
                <p className="text-[#545454] text-[16px] mt-3 sm:text-[16px] md:text-[16px] font-light flex items-center justify-center font-touvlo">
                  Private styling, studio visits & gifting enquiries
                </p>
              </div>
              <Link
                href="/services"
                className="font-seasons text-[#1C3163] inline-flex items-center gap-1 text-[14px] sm:text-[16px] md:text-[16px] font-normal hover:opacity-80 transition-opacity"
              >
                <span>Explore our Appointments</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#1C3163]" />
              </Link>
            </div>
<div className="flex flex-col gap-[25px]" >
            {/* First Row - Featured Corporate Sessions */}
            {featuredCorporateSessions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-8 md:gap-y-16  md:mb-16 font-touvlo">
              {featuredCorporateSessions.map((session) => {
                  const imageUrl = session.imageUrl
                    ? session.imageUrl.startsWith("data:") ||
                      session.imageUrl.startsWith("http")
                      ? session.imageUrl
                      : `data:image/jpeg;base64,${session.imageUrl}`
                    : ServiceImage1;

                  return (
                    <div
                      key={session._id}
                      className="flex w-full  md:flex-row gap-5 md:gap-0 flex-col-reverse  items-center md:items-end justify-between group "
                    >
                      {/* Image Container - Left Side */}
                      <div className="relative aspect-3/4 w-[50%] rounded-2xl md:rounded-3xl overflow-hidden shrink-0 font-touvlo">
                        <FillCdnImage
                          src={imageUrl}
                          alt={session.title || "Corporate Service"}
                          className="object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-500 ease-out"
                        />
                      </div>

                      {/* Content - Right Side */}
                      <div className="flex w-[40%] h-full  justify-between   flex-row md:flex-col">
                        <h3 className="text-[#545454] pt-4 sm:pt-6 md:pt-[30px] text-[10px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-normal leading-tight line-clamp-2">
                          {session.title || "Corporate Service"}
                        </h3>
                        <div className="flex-col gap-3 sm:gap-4 md:gap-[27px] flex">
                          <p className="text-[#545454] text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-light leading-relaxed line-clamp-2">
                            {/* {session.description || ""} */}
                          </p>
                          {/* Arrow Button */}
                          <Link href="/services">
                            <button className="size-[18px] sm:size-[20px] md:size-[22px] rounded-full border-1 border-[#1C3163] flex items-center justify-center hover:bg-[#1C3163] transition-colors group">
                              <ArrowRight
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-black hover:text-white"
                                strokeWidth={0.9}
                              />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            )}

            {/* Second Section Header */}

            {/* Second Row - Featured Private Sessions */}
            {featuredPrivateSessions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-12 gap-y-8 md:gap-y-16 md:mb-16  ">
              {featuredPrivateSessions.map((session) => {
                  const imageUrl = session.imageUrl
                    ? session.imageUrl.startsWith("data:") ||
                      session.imageUrl.startsWith("http")
                      ? session.imageUrl
                      : `data:image/jpeg;base64,${session.imageUrl}`
                    : YogaSection1;

                  return (
                    <div
                      key={session._id}
                      className="flex w-full  items-center md:items-end  md:flex-row gap-5 md:gap-0 flex-col-reverse justify-between group"
                    >
                      {/* Image Container - Left Side */}
                      <div className="relative aspect-3/4 w-[50%] rounded-2xl md:rounded-3xl overflow-hidden shrink-0">
                        <FillCdnImage
                          src={imageUrl}
                          alt={session.title || "Private Appointment"}
                          className="object-cover group-hover:scale-125 group-hover:rotate-2 group-hover:opacity-90 transition-all duration-700 ease-in-out"
                        />
                      </div>

                      {/* Content - Right Side */}
                      <div className="flex w-[40%] h-full  flex-row md:flex-col justify-between ">
                        <h3 className="text-[#545454]  md:pt-[30px] text-[10px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-normal leading-tight line-clamp-2 font-touvlo">
                          {session.title || "Private Appointment"}
                        </h3>
                        <div className="flex-col gap-3   sm:gap-4 md:gap-[27px] flex">
                          {/* Arrow Button */}
                          <Link href="/services">
                            <button className="size-[18px] sm:size-[20px] md:size-[22px] rounded-full border-1 border-[#1C3163] flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors group">
                              <ArrowRight
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 hover:text-white"
                                strokeWidth={0.9}
                              />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            )}
            </div>
          </div>
        </section>
        )}

        {/* testimonials section  */}

        <section className="w-full md:py-[0px]  relative mt-[25px] ">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              What our Customers are saying
            </h2>
          </div>
          <div
            style={{
              backgroundImage: `url(${TestimonialIcon.src})`,
              backgroundSize: "contain",
              backgroundPosition: "left",
              height: "413px",
              backgroundRepeat: "no-repeat",
              opacity: 0.34,
            }}
            className="absolute md:block hidden inset-0 top-36 md:pointer-events-none"
          />
          <div className="max-w-6xl mx-auto px-4 relative z-10 mt-[25px]">
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${testimonialCurrentIndex * 100}%)`,
                  }}
                >
                  {TestimonialsData.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="min-w-full flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center"
                    >
                      {/* Right Side - Testimonial Card */}
                      <div className="flex-1 w-full border border-[#000000]  rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 flex flex-col justify-center h-[50px] sm:h-[250px] md:h-[200px] lg:h-[230px]">
                        <div className="animate-fadeIn">
                          <blockquote className="font-touvlo text-[#545454]  text-[12px] sm:text-[12px] md:text-[14px] lg:text-[14px] font-light leading-relaxed mb-6 md:mb-8 ">
                            &ldquo;{testimonial.testimonial}&rdquo;
                          </blockquote>

                          <p className="text-[#545454]  text-[14px] sm:text-[15px] md:text-[16px] font-light">
                            {testimonial.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              {TestimonialsData.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setTestimonialCurrentIndex((prev) =>
                        prev === 0 ? TestimonialsData.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10 hidden md:flex items-center justify-center"
                    aria-label="Previous testimonial"
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
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setTestimonialCurrentIndex((prev) =>
                        prev === TestimonialsData.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 z-10 hidden md:flex items-center justify-center"
                    aria-label="Next testimonial"
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
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}

              {/* Mobile Navigation Buttons */}
              {TestimonialsData.length > 1 && (
                <div className="flex md:hidden justify-center gap-4 mt-6">
                  <button
                    onClick={() =>
                      setTestimonialCurrentIndex((prev) =>
                        prev === 0 ? TestimonialsData.length - 1 : prev - 1,
                      )
                    }
                    className="bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300"
                    aria-label="Previous testimonial"
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
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setTestimonialCurrentIndex((prev) =>
                        prev === TestimonialsData.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300"
                    aria-label="Next testimonial"
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
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Dots Indicator */}
              {TestimonialsData.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {TestimonialsData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialCurrentIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === testimonialCurrentIndex
                          ? "bg-[#000000] w-8"
                          : "bg-[#000000]/30 w-2"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

     
      </div>
      <Footer />
    </div>
  );
};

export default Index;



