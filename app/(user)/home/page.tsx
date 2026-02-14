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
    title: "Sound Healing & Yoga",
    description: "Personalized sessions for deep healing & alignment",
  },
  {
    id: 2,
    image: ServiceImage2,
    title: "Corporate Wellness Programs",
    description: "Stress management & mindfulness for teams",
  },
  {
    id: 3,
    image: ServiceImage3,
    title: "Moon Circles & Group Sound Journeys",
    description: "Community-based healing experiences",
  },
];

const CreativeJourneyData = [
  {
    id: 1,
    image: YogaSection1,
    title: "Explore the science of sound & its impact on energy",
    description: "",
  },
  {
    id: 2,
    image: YogaSection2,
    title: "Learn to integrate healing frequencies into music production",
    description: "",
  },
  {
    id: 3,
    image: YogaSection3,
    title: "Available for 1:1 coaching or group workshops",
    description: "",
  },
];

const TestimonialsData = [
  {
    id: 1,
    name: "Tanisha M.",
    testimonial:
      "If I were to think of someone who embodies the spirit of yoga, it will be Frankie. She is extremely knowledgeable, genuine and kind. Her classes are delightful, intense and insightful. She explains how each pose is linked to practices of mindfulness and how they promote a better lifestyle. Her cues and tricks to adjust your body to better feel a stretch or pose. She practices what she preaches and I truly think she is one of the best teachers I've ever come across. Thank for you imparting your knowledge",
  },
  {
    id: 2,
    name: "David V.",
    testimonial:
      "I would like to specifically thank Frankie for being such an amazing teacher. As a yogini, she not only has perfect mastery of the poses, but on top of that she has a good understanding of their physiological impact as well as deep knowledge of yogic philosophy. Then as a teacher, she is patient and willing to help, observant both of individual details and the group dynamic as a whole, and her natural enthusiasm and spontaneity are inspiring and turn every class into a wholesome experience. On top of that she teaches a wide range of classes; Hatha Foundation for students who just started their yoga journey, several advanced classes for those looking for a challenge and even sound classes which offer a moment of introspection. In short, Frankie is a world class yoga teacher!",
  },
  {
    id: 3,
    name: "Neeraj K.",
    testimonial:
      "Frankie you are Absolutely amazing and your specific impacts and voice calmness, strength and clarity are superb your teaching style distinctly clear, patient and inspiring. Your wisdom helps off the mat in life balance and mindfulness. Bravo",
  },
  {
    id: 4,
    name: "John V.",
    testimonial:
      "I have struggled with stress and anxiety my entire life, so I decided to give yoga a go this year. Frankie has shared so much knowledge, wisdom and has been an absolute inspiration to me. Frankie has given me the confidence I needed to consistently continue my practice, and I could not have continued without this guiding light. I have now completed more than fifty yoga sessions, so I joined Frankie's Yin, Gong and Crystal Bowl class and was absolutely blown away by this experience. Having struggled to calm my monkey mind and relax all throughout my life this class was incredible. We should all give ourselves this gift of retreat, rest and relaxation.",
  },
  {
    id: 5,
    name: "Peter H.",
    testimonial:
      "I am now regularly attending Hatha, Vinyasa Flo, Yin Yang and will most definitely continue Gong classes. Whilst there have certainly been considerable physical benefits after only a few months, its the mental health benefit that is truly life changing for me. I have struggled with depression, anxiety and sleeplessness for most of my life and with my daily yoga practice my mood has been positively lifted, my anxiety is kept in check, and I am sustaining longer and better-quality sleep.",
  },
  {
    id: 6,
    name: "Nipun M.",
    testimonial:
      'When the sound vibrations detached my body from the mental awareness and alertness, that\'s when I felt myself elevating from the weight of my duties, and responsibilities. The detachment brought a sense of peace in a tangible way. I felt oblivion to everything. I really went far and beyond to notice physically where I was. There was a conscious noticeable detachment of physical realm and mental awareness. It certainly works. We should bring this service to corporate professionals. Being under tremendous pressure takes away a lot. But this service felt like a "much needed magic potion" to feel my 100% again.',
  },
];

const UpcomingEventsData = [
  {
    id: 1,
    image: UpcomingEvent1,
    date: "07 Monday",
    title: "Full Moon Sound Healing Journey",
  },
  {
    id: 2,
    image: UpcomingEvent2,
    date: "10 Thursday",
    title: "Corporate Mindfulness & Stress Release Workshop",
  },
  {
    id: 3,
    image: UpcomingEvent3,
    date: "17 Friday",
    title: "1:1 Sound Healing Availability",
  },
  {
    id: 4,
    image: UpcomingEvent4,
    date: "07 Monday",
    title: "Full Moon Sound Healing Journey",
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

  const Icons = [
    {
      id: 1,
      image: PremiumQuality,
      title: " Premium Craftsmanship",
      para: "Each piece is precision-crafted, made from 99.9% pure clear quartz, our bowls produce quality sound and long-lasting resonance.",
    },

    {
      id: 2,
      image: UniqueToYou,
      title: "Light Weight",
      para: "Our bowls are light, durable, designed for travel-ready, portable anywhere, anytime in our protective cases",
    },

    {
      id: 3,
      image: Crystal,
      title: "Made for You",
      para: "Each bowl is unique and can be customised by chakra, note, frequency, colour, and design to make it uniquely yours.",
    },
    {
      id: 4,
      image: Intention,
      title: "With Intention",
      para: "Each Bowl is precisely tuned, intentionally crafted with it’s own energy, so you can match with your unique energy and purpose. ",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen w-full min-w-0 relative">
      {/* Navbar moved outside overflow-hidden so it stays visible on mobile after scroll (iOS fix) */}
      <Navbar />
      <div className="relative z-10 h-screen w-full overflow-hidden mt-3 sm:mt-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => console.error("Video error:", e)}
          onLoadedData={() => console.log("Video loaded successfully")}
        >
          <source
            src="https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com/videos/1768043688349-ttt.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 h-full flex flex-col justify-between w-full">
          <div className="min-h-[64px] md:min-h-[84px]" />

          <div className="relative">
            <h1 className="font-seasons text-center pb-[60px] sm:pb-[80px] md:pb-[100px] lg:pb-[120px] px-4 text-[#D5B584] text-[28px] sm:text-[32px] md:text-[40px] lg:text-[50px]  leading-tight">
              Crystal Singing Bowls for
              <br /> Sound Healing{" "}
              <span style={{ fontFamily: "var(--font-montserrat)" }}>
                {"&"}
              </span>{" "}
              Meditation.
            </h1>

            {/* Mute/Unmute Button */}
            <button
              onClick={toggleMute}
              className="fixed z-50 bottom-20 left-1 size-18 flex justify-center items-center rounded-full p-4 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all duration-300 border border-[#D5B584]/30"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6  text-[#D5B584]" />
              ) : (
                <Volume2 className="w-6 h-6 sm:w-6 sm:h-6 text-[#D5B584]" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="w-full relative z-0">
        {/* about section  */}

        {/* collection section  */}

        <CollectionSection categories={categories} loading={loading} />

        {/* Shop Crystal Bowls - design from screenshot */}
        <section className="w-full  md:py-0  mt-[25px]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex w-full items-center justify-between mb-6">
              <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Shop Crystal Bowls
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
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D5B584] border-t-transparent" />
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
                          <Image
                            src={normalizeImageUrl(category.imageUrl)}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#D5B584] to-[#FEC1A2] flex items-center justify-center">
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
              <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                About Crystal Bowl Studio
              </h2>
              {/* Wrapped in a fragment to replace the div but keep structure clean if needed, or just standard p tags */}
              <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] leading-[1.9] text-[#545454] mt-[25px]">
                Crystal Bowl Studio is designed for modern, conscious living,
                rooted in ancient traditions and wisdom. Each bowl is made from
                99.9% pure clear quartz crystal, carefully handcrafted and
                quality-checked, to produce clarity, rich, ethereal vibrations
                that supports meditation, relaxation, healing and
                transformational work.{" "}
                <span className="font-semibold">
                  Our bowls are lightweight, travel-friendly,
                </span>{" "}
                and designed in the most{" "}
                <span className="font-semibold">
                  elegant and luminous colours
                </span>{" "}
                to make your practice available and accessible, anywhere and
                anytime.{" "}
                <span className="font-semibold">
                  Take them with you on your travels! No two bowls are ever the
                  same.
                </span>
              </p>
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-[1.9] text-[#545454]">
                Each Singing Bowl is crafted with its own unique energy and
                intention, so you can choose one that matches your purpose, and
                aesthetic. Crystal Bowl Studio designs beautifully crafted sound
                healing tools that are easy to use and made to support and
                enhance modern life.
              </p>
            </div>
          </section>

          <div className="max-w-6xl flex flex-col mx-auto px-4 mt-[25px] ">
            <div className="flex w-full ">
              <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none ">
                What makes our Singing Bowls unique
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
                className={`font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none`}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#D5B584] border-t-transparent" />
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
                          <Image
                            src={normalizeImageUrl(product.imageUrl[0])}
                            alt={product.name || "Product"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#D5B584] to-[#FEC1A2] flex items-center justify-center">
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
              <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
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
              <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                What is Sound Healing?
              </h1>
              <p className="text-[#545454] sm:text-[15px]  text-[14px]  md:text-[16px] leading-relaxed font-light font-touvlo">
                Sound healing uses sound and vibration to support relaxation,
                focus, and balance. From a scientific perspective, sound healing
                is most often discussed in relation to its effects on the
                nervous system and stress regulation. Research in psychology and
                neuroscience shows that slow, continuous sounds can help reduce
                stress-related arousal by engaging the parasympathetic nervous
                system, which is the part of the nervous system responsible for
                rest, recovery, and regulation.
              </p>
              <p className="text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-light font-touvlo">
                Singing bowls can significantly reduce tension, anxiety,
                fatigue, and depressed mood after a single session of sound
                meditation. <br />
                <span className="italic font-touvlo">
                  {" "}
                  – National Library of Medicine
                </span>
              </p>
              <div className="">
                <Link
                  href="/about"
                  className="font-seasons inline-flex items-center gap-2 text-[14px] sm:text-[16px] md:text-[16px] text-[#1C3163] hover:opacity-80 transition-opacity"
                >
                  Learn more about Sound Healing
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
                <h2 className="text-[#e6b884] text-[28px] sm:text-[30px] md:text-[32px] font-normal font-seasons">
                  Services
                </h2>
                <p className="text-[#545454] text-[16px] mt-3 sm:text-[16px] md:text-[16px] font-light flex items-center justify-center font-touvlo">
                  Private Sessions & Corporate Wellness
                </p>
              </div>
              <Link
                href="/services"
                className="font-seasons text-[#1C3163] inline-flex items-center gap-1 text-[14px] sm:text-[16px] md:text-[16px] font-normal hover:opacity-80 transition-opacity"
              >
                <span>Explore our Services</span>
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
                        <Image
                          src={imageUrl}
                          alt={session.title || "Corporate Session"}
                          fill
                          className="object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-500 ease-out"
                        />
                      </div>

                      {/* Content - Right Side */}
                      <div className="flex w-[40%] h-full  justify-between   flex-row md:flex-col">
                        <h3 className="text-[#545454] pt-4 sm:pt-6 md:pt-[30px] text-[10px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-normal leading-tight line-clamp-2">
                          {session.title || "Corporate Session"}
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
                        <Image
                          src={imageUrl}
                          alt={session.title || "Private Session"}
                          fill
                          className="object-cover group-hover:scale-125 group-hover:rotate-2 group-hover:opacity-90 transition-all duration-700 ease-in-out"
                        />
                      </div>

                      {/* Content - Right Side */}
                      <div className="flex w-[40%] h-full  flex-row md:flex-col justify-between ">
                        <h3 className="text-[#545454]  md:pt-[30px] text-[10px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-normal leading-tight line-clamp-2 font-touvlo">
                          {session.title || "Private Session"}
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
            <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              What our Clients are saying
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
                      <div className="flex-1 w-full border border-[#D5B584]  rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 flex flex-col justify-center h-[50px] sm:h-[250px] md:h-[200px] lg:h-[230px]">
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
                        stroke="#D5B584"
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
                        stroke="#D5B584"
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
                        stroke="#D5B584"
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
                        stroke="#D5B584"
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
                          ? "bg-[#D5B584] w-8"
                          : "bg-[#D5B584]/30 w-2"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Upcoming Events section */}

        <section className="w-full  mt-[25px]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex w-full  justify-between items-center">
              <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Upcoming Events
              </h2>
              <Link
                href="/services"
                className="font-seasons text-[#1C3163] inline-flex items-center gap-1 text-[14px] sm:text-[15px] md:text-[16px] font-normal"
              >
                <span>Explore our Services</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#1C3163]" />
              </Link>
            </div>
            {/* Events Grid */}
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-[#1C3163]">
                <p className="text-[16px]">No upcoming events at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 md:mt-[25px]">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const monthNames = [
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
                  let monthAbbr = monthNames[eventDate.getMonth()];
                  let dayDisplay = eventDate.getDate().toString();

                  // Handle date range display for the badge
                  if (event.endDate) {
                    const endDate = new Date(event.endDate);
                    const endMonthAbbr = monthNames[endDate.getMonth()];
                    const endDay = endDate.getDate();

                    if (
                      eventDate.getMonth() === endDate.getMonth() &&
                      eventDate.getFullYear() === endDate.getFullYear()
                    ) {
                      // Same month: Feb 10-12
                      dayDisplay = `${eventDate.getDate()}-${endDay}`;
                    } else {
                      // Diff month: Feb-Mar / 28-02
                      monthAbbr = `${monthAbbr}-${endMonthAbbr}`;
                      dayDisplay = `${eventDate.getDate()}-${endDay}`;
                    }
                  }

                  // Format date for display: "Nov 7, 2025" or "Feb 10 - 12, 2025"
                  const year = eventDate.getFullYear();
                  let formattedFullDate = `${monthAbbr} ${dayDisplay}, ${year}`;

                  if (event.endDate) {
                    // For text display, use a cleaner full format if desired, or reuse the logic above
                    // Reusing logic above to keep consistent with badge for now, but formatted nicely
                    const endDate = new Date(event.endDate);
                    const endMonthAbbr = monthNames[endDate.getMonth()];
                    const endDay = endDate.getDate();
                    const endYear = endDate.getFullYear();

                    if (year === endYear) {
                      if (eventDate.getMonth() === endDate.getMonth()) {
                        formattedFullDate = `${monthNames[eventDate.getMonth()]} ${eventDate.getDate()} - ${endDay}, ${year}`;
                      } else {
                        formattedFullDate = `${monthNames[eventDate.getMonth()]} ${eventDate.getDate()} - ${endMonthAbbr} ${endDay}, ${year}`;
                      }
                    } else {
                      formattedFullDate = `${monthAbbr} ${eventDate.getDate()}, ${year} - ${endMonthAbbr} ${endDay}, ${endYear}`;
                    }
                  } else {
                    // Single day full format
                    formattedFullDate = `${monthNames[eventDate.getMonth()]} ${eventDate.getDate()}, ${year}`;
                  }

                  // Format time if available
                  const timeDisplay = event.time
                    ? formatTime(
                        event.day,
                        event.time,
                        event.date,
                        event.endDate,
                      )
                    : "";

                  const imageUrl = event.imageUrl
                    ? event.imageUrl.startsWith("data:") ||
                      event.imageUrl.startsWith("http")
                      ? event.imageUrl
                      : `data:image/jpeg;base64,${event.imageUrl}`
                    : Yoga1;

                  return (
                    <div key={event._id} className="flex flex-col group ">
                      <Link href={`/events/${event._id}`}>
                        <div className="relative w-full aspect-[4/3]  overflow-hidden mb-0 group-hover:shadow-2xl transition-all duration-500">
                          <Image
                            src={imageUrl}
                            alt={getEventDisplayTitle(event)}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-all duration-500 ease-out"
                          />
                          {/* Date Badge - Upper Right Corner */}
                          <div className="absolute top-2 right-2 bg-white   px-3 py-2 text-center shadow-lg">
                            <div className="text-[#1C3163] text-[10px] sm:text-[11px] font-medium uppercase leading-tight">
                              {monthAbbr}
                            </div>
                            <div className="text-[#1C3163] text-[18px] sm:text-[20px] md:text-[24px] font-semibold leading-tight">
                              {dayDisplay}
                            </div>
                          </div>
                        </div>
                      </Link>
                      {/* Event Details - Light Beige Background */}
                      <div className="mt-2 relative z-0">
                        <h3 className="font-seasons text-[#1C3163] text-[14px] sm:text-[15px] md:text-[18px] font-normal leading-tight mb-2 tracking-wide">
                          {getEventDisplayTitle(event)}
                        </h3>
                        <p className="text-gray-700 text-[12px] sm:text-[13px] md:text-[14px] font-light text-[#545454] font-touvlo whitespace-nowrap ">
                          {formattedFullDate}
                          <span className="ml-[2px] whitespace-nowrap">
                            {timeDisplay}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
