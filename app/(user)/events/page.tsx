"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { About1, Yoga1 } from "@/public/assets";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type ApiEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  endDate?: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type DisplayEvent = {
  id: string;
  date: {
    month: string;
    day: string;
  };
  image: string | typeof About1;
  title: string;
  location: string;
  time: string;
  formattedDate: string;
  description: string;
};

type ApiPastEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  endDate?: string;
  description: string;
  thumbnailImage: string;
  photos?: string[];
  videos?: string[];
  createdAt: string;
  updatedAt: string;
};

const EventsPage = () => {
  const [eventsData, setEventsData] = useState<DisplayEvent[]>([]);
  const [pastEventsData, setPastEventsData] = useState<DisplayEvent[]>([]);
  const [pastEventsFromAPI, setPastEventsFromAPI] = useState<ApiPastEvent[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [pastEventsLoading, setPastEventsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set(),
  );
  // Responsive: 1 per page on mobile (so prev/next buttons show and work), 4 on desktop
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const MAX_DESCRIPTION_LENGTH = 450; // Maximum characters to show before truncation

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 4);
    };
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Helper function to parse date and extract month and day
  const parseEventDate = (
    dateString: string,
    endDateString?: string,
  ): { month: string; day: string } => {
    try {
      const startDate = new Date(dateString);
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const startMonth = months[startDate.getMonth()] || "Unknown";
      const startDay = startDate.getDate().toString().padStart(2, "0");

      if (endDateString) {
        const endDate = new Date(endDateString);
        const endMonth = months[endDate.getMonth()] || "Unknown";
        const endDay = endDate.getDate().toString().padStart(2, "0");

        if (
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getFullYear() === endDate.getFullYear()
        ) {
          // Same month: "January", "10-12"
          return {
            month: startMonth,
            day: `${startDate.getDate()}-${endDate.getDate()}`,
          };
        } else {
          // Different month: "Jan - Feb", "28 - 02"
          const shortStartMonth = startMonth.substring(0, 3);
          const shortEndMonth = endMonth.substring(0, 3);
          return {
            month: `${shortStartMonth} - ${shortEndMonth}`,
            day: `${startDay} - ${endDay}`,
          };
        }
      }

      return {
        month: startMonth,
        day: startDay,
      };
    } catch {
      // Fallback if date parsing fails
      return { month: "Unknown", day: "01" };
    }
  };

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string): string | typeof About1 => {
    if (!imageUrl) return About1;
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  // Shorten "2:00 PM" to "2 PM" when minutes are zero (same as home page)
  const shortenTime = (t: string): string =>
    t.replace(/:00\s*(?=AM|PM)/gi, " ");

  // Helper function to format time with day/date
  const formatTime = (
    day: string,
    time: string,
    dateString: string,
    endDateString?: string,
  ): string => {
    // If no endDate, fallback to standard "Day, Time"
    if (!endDateString) {
      return `${day} ${shortenTime(time)}`;
    }

    // Try to split time into start and end
    // Expected format: "9:00 AM - 5:00 PM"
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

    // Check if it's actually a multi-day event (different dates)
    const isMultiDay =
      startDate.getDate() !== endDate.getDate() ||
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear();

    if (endTime && isMultiDay) {
      return `${shortenTime(startTime)} - ${shortenTime(endTime)}`;
    }

    return `${day} ${shortenTime(time)}`;
  };

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");
      const data = await response.json();

      if (data.success && data.data) {
        const apiEvents: ApiEvent[] = data.data;

        // Transform API events to display format
        const transformedEvents: DisplayEvent[] = apiEvents.map((event) => {
          const dateObj = parseEventDate(event.date, event.endDate);
          // Helper to get simple formatted full date string for text display
          let fullDateStr = "";
          const startDate = new Date(event.date);
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
          const month = months[startDate.getMonth()];
          const day = startDate.getDate();
          const year = startDate.getFullYear();

          if (event.endDate) {
            const endDate = new Date(event.endDate);
            const endMonth = months[endDate.getMonth()];
            const endDay = endDate.getDate();
            const endYear = endDate.getFullYear();

            if (year === endYear) {
              if (startDate.getMonth() === endDate.getMonth()) {
                fullDateStr = `${month} ${day} - ${endDay}, ${year}`;
              } else {
                fullDateStr = `${month} ${day} - ${endMonth} ${endDay}, ${year}`;
              }
            } else {
              fullDateStr = `${month} ${day}, ${year} - ${endMonth} ${endDay}, ${endYear}`;
            }
          } else {
            fullDateStr = `${month} ${day}, ${year}`;
          }

          return {
            id: event._id,
            date: dateObj,
            image: getImageUrl(event.imageUrl),
            title: event.title,
            location: event.location,
            time: formatTime(event.day, event.time, event.date, event.endDate),
            formattedDate: fullDateStr,
            description: event.description,
          };
        });

        // Separate into upcoming and past events
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = transformedEvents.filter((event) => {
          try {
            const apiEvent = apiEvents.find((e) => e._id === event.id);
            // Use endDate if available for checking if event is past
            const checkDateStr = apiEvent?.endDate || apiEvent?.date || "";
            const eventDate = new Date(checkDateStr);
            eventDate.setHours(0, 0, 0, 0);

            // If it has an endDate, it's upcoming if endDate >= today
            // If single date, it's upcoming if date >= today
            return eventDate >= today;
          } catch {
            return true; // Include if date parsing fails
          }
        });

        const past = transformedEvents.filter((event) => {
          try {
            const apiEvent = apiEvents.find((e) => e._id === event.id);
            const checkDateStr = apiEvent?.endDate || apiEvent?.date || "";
            const eventDate = new Date(checkDateStr);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate < today;
          } catch {
            return false;
          }
        });

        setEventsData(upcoming);
        setPastEventsData(past);
      } else {
        setEventsData([]);
        setPastEventsData([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEventsData([]);
      setPastEventsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch past events from PastEvent collection
  const fetchPastEvents = async () => {
    try {
      setPastEventsLoading(true);
      const response = await fetch("/api/past-events");
      const data = await response.json();

      if (data.success && data.data) {
        const apiPastEvents: ApiPastEvent[] = data.data;
        setPastEventsFromAPI(apiPastEvents);

        const transformedPastEvents: DisplayEvent[] = apiPastEvents.map(
          (event) => {
            const dateObj = parseEventDate(event.date, event.endDate);
            // Helper to get simple formatted full date string for text display
            let fullDateStr = "";
            const startDate = new Date(event.date);
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
            const month = months[startDate.getMonth()];
            const day = startDate.getDate();
            const year = startDate.getFullYear();

            if (event.endDate) {
              const endDate = new Date(event.endDate);
              const endMonth = months[endDate.getMonth()];
              const endDay = endDate.getDate();
              const endYear = endDate.getFullYear();

              if (year === endYear) {
                if (startDate.getMonth() === endDate.getMonth()) {
                  fullDateStr = `${month} ${day} - ${endDay}, ${year}`;
                } else {
                  fullDateStr = `${month} ${day} - ${endMonth} ${endDay}, ${year}`;
                }
              } else {
                fullDateStr = `${month} ${day}, ${year} - ${endMonth} ${endDay}, ${endYear}`;
              }
            } else {
              fullDateStr = `${month} ${day}, ${year}`;
            }

            return {
              id: event._id,
              date: dateObj,
              image: getImageUrl(event.thumbnailImage),
              title: event.title,
              location: event.location,
              time: formatTime(
                event.day,
                event.time,
                event.date,
                event.endDate,
              ),
              formattedDate: fullDateStr,
              description: event.description,
            };
          },
        );

        setPastEventsData(transformedPastEvents);
      } else {
        setPastEventsFromAPI([]);
        setPastEventsData([]);
      }
    } catch (error) {
      console.error("Failed to fetch past events:", error);
      setPastEventsFromAPI([]);
      setPastEventsData([]);
    } finally {
      setPastEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchPastEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate pagination for past events
  const totalPages = Math.ceil(pastEventsData.length / itemsPerPage);

  // Keep currentPage in bounds when itemsPerPage or data changes
  useEffect(() => {
    setCurrentPage((p) => (p >= totalPages && totalPages > 0 ? totalPages - 1 : p));
  }, [totalPages, itemsPerPage]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && scrollContainerRef.current) {
      const newPage = currentPage + 1;
      const container = scrollContainerRef.current;
      const scrollPosition = newPage * container.clientWidth;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
      setCurrentPage(newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && scrollContainerRef.current) {
      const newPage = currentPage - 1;
      const container = scrollContainerRef.current;
      const scrollPosition = newPage * container.clientWidth;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
      setCurrentPage(newPage);
    }
  };

  // Toggle description expansion
  const toggleDescription = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Get truncated description
  const getDisplayDescription = (
    description: string,
    eventId: string,
  ): string => {
    if (
      expandedDescriptions.has(eventId) ||
      description.length <= MAX_DESCRIPTION_LENGTH
    ) {
      return description;
    }
    return description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
  };

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen ">
      <Navbar />
      <div className="w-full mt-[25px] "> 
        <section className="w-full px-4  py-[0px] ">
          <div className="max-w-6xl flex flex-col  mx-auto">
            {/* Header Section */}
            <div className=" flex  gap-[48px]">
              <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                Events
              </h1>
              {/* <p className="text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] font-light max-w-md">
                Lorem ipsum dolor sit amet consectetur. Eu proin donec est ac
                velit massa et lobortis.
              </p> */}
            </div>

            {/* Events List */}
            {loading ? (
              <div className="text-center py-12 text-[#1C3163]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
                <p>Loading events...</p>
              </div>
            ) : eventsData.length === 0 ? (
              <div className="text-center py-12 text-[#1C3163]">
                No upcoming events
              </div>
            ) : (
              <div className=" mt-[25px]">
                {eventsData.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex py-[5px] border-b border-[#e6b884] flex-col lg:flex-row gap-8 lg:gap-12 hover:bg-white/10 transition-colors duration-300  px-4 -mx-4 block  "
                  >
                    {/* Date Section */}
                    <div className="lg:w-[150px] flex-shrink-0 ">
                      <div className="text-[#e6b884]">
                        <p className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
                          {event.date.month}
                        </p>
                        <p className="text-[25px] sm:text-[25px] md:text-[50px] lg:text-[50px] font-light font-seasons leading-none">
                          {event.date.day}
                        </p>
                      </div>
                    </div>

                    {/* Event Card */}
                    <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 group/card mb-4 ">
                      {/* Event Image */}
                      <div className="md:w-[45%] lg:w-[40%] flex-shrink-0 mt-1">
                        <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden group/image">
                          {typeof event.image === "string" ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500 ease-out"
                            />
                          ) : (
                            <Image
                              src={event.image}
                              alt={event.title}
                              fill
                              className="object-cover group-hover/image:scale-110 transition-transform duration-500 ease-out"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h2 className="text-[#1C3163] text-[26px] sm:text-[28px] md:text-[30px] lg:text-[32px] font-normal leading-tight group-hover/card:text-[#e6b884] transition-colors duration-300 font-seasons">
                            {event.title}
                          </h2>

                          <div className="font-touvlo mt-1">
                            <p className="text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] font-normal">
                              {event.location}
                            </p>
                            <p className="text-[#1C3163] sm:text-[15px]  text-[14px]  md:text-[16px] font-light">
                              {/* Show full date in text for clarity on mobile/simplified views */}
                              {event.formattedDate} · {event.time}
                            </p>
                          </div>

                          <div className="mt-[10px]">
                            <p className="text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-light leading-relaxed font-touvlo">
                              {getDisplayDescription(
                                event.description,
                                event.id,
                              )}
                            </p>
                            {/* {event.description.length > MAX_DESCRIPTION_LENGTH && (
                            <button
                              onClick={(e) => toggleDescription(event.id, e)}
                              className="text-[#D5B584] text-[14px] sm:text-[15px] md:text-[16px] font-normal mt-2 hover:underline focus:outline-none"
                            >
                              {expandedDescriptions.has(event.id) ? "Show Less" : "Read More"}
                            </button>
                          )} */}
                          </div>
                        </div>

                        {/* View Details Button */}
                        <div className="flex items-center gap-2 text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] font-normal hover:gap-3 transition-all duration-300 group w-fit font-touvlo">
                          View Event Details
                          <ArrowRight
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-6xl mx-auto px-4 mt-[25px]">
            {/* Header Section */}
            <div className="flex gap-[48px]">
              <h2 className="text-[#e6b884] text-[28px] sm:text-[18px] md:text-[30px] lg:text-[32px] font-normal font-seasons">
                Past Events
              </h2>
            </div>

            {/* Past Events - Horizontal Scroll with Pagination */}
            {pastEventsLoading ? (
              <div className="relative overflow-x-hidden">
                {/* Shimmer Loaders - Horizontal scroll layout */}
                <div className="flex gap-6 md:gap-8">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col group flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                    >
                      <div className="relative w-full aspect-[4/3] overflow-hidden mb-0 bg-gradient-to-r from-[#e6b884]/20 via-[#D5B584]/40 to-[#D5B584]/20 rounded-lg">
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                      <div className="px-4 py-5 md:px-5 md:py-6 -mt-2 relative z-10">
                        <div className="h-5 bg-[#8B6F47]/20 rounded mb-2 relative overflow-hidden">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </div>
                        <div className="h-4 bg-[#8B6F47]/20 rounded w-3/4 relative overflow-hidden">
                          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : pastEventsData.length === 0 ? (
              <div className="text-center py-12 text-[#1C3163]">
                <p className="text-[16px]">No past events available</p>
              </div>
            ) : (
              <div className="relative overflow-visible">
                {/* Mobile-only left/right nav buttons - horizontal scroll not reliable on mobile */}
                {totalPages > 1 && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-2 md:hidden">
                    <div className="pointer-events-auto">
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg transition-all duration-300 hover:bg-white disabled:pointer-events-none disabled:opacity-50"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#D5B584]" />
                      </button>
                    </div>
                    <div className="pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg transition-all duration-300 hover:bg-white disabled:pointer-events-none disabled:opacity-50"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-5 h-5 text-[#D5B584]" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Past Events - Horizontal Scroll Container */}
                <div
                  ref={scrollContainerRef}
                  className="relative overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const scrollLeft = container.scrollLeft;
                    const containerWidth = container.clientWidth;
                    const page = Math.round(scrollLeft / containerWidth);
                    if (page !== currentPage) {
                      setCurrentPage(page);
                    }
                  }}
                >
                  <div className="flex">
                    {Array.from({ length: totalPages }).map((_, pageIndex) => (
                      <div
                        key={pageIndex}
                        className="flex gap-6 md:gap-8 flex-shrink-0 snap-start w-full"
                      >
                        {pastEventsData
                          .slice(
                            pageIndex * itemsPerPage,
                            (pageIndex + 1) * itemsPerPage,
                          )
                          .map((event) => {
                            // Use transformed event date (supports endDate range) for badge and text
                            const badgeMonth =
                              event.date.month.length > 4
                                ? event.date.month.substring(0, 3)
                                : event.date.month;
                            const timeDisplay = event.time
                              ? event.time.startsWith(" · ")
                                ? event.time
                                : ` · ${event.time}`
                              : "";

                            return (
                              <div
                                key={event.id}
                                className="flex flex-col group flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] mt-[25px]"
                              >
                                <Link href={`/past-events/${event.id}`}>
                                  <div className="relative w-full aspect-[4/3] overflow-hidden mb-0 group-hover:shadow-2xl transition-all duration-500">
                                    {typeof event.image === "string" ? (
                                      <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out"
                                      />
                                    ) : (
                                      <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-110 transition-all duration-500 ease-out"
                                      />
                                    )}
                                    {/* Date Badge - Upper Right Corner (uses event.date with endDate support) */}
                                    <div className="absolute top-2 right-2 bg-white px-3 py-2 text-center shadow-lg">
                                      <div className="text-[#1C3163] text-[10px] sm:text-[11px] font-medium uppercase leading-tight">
                                        {badgeMonth}
                                      </div>
                                      <div className="text-[#1C3163] text-[18px] sm:text-[20px] md:text-[24px] font-semibold leading-tight">
                                        {event.date.day}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                                {/* Event Details - left-aligned with image (same as home Upcoming Events) */}
                                <div className="mt-2 relative z-0">
                                  <h3 className="font-seasons text-[#1C3163] text-[14px] sm:text-[15px] md:text-[18px] font-normal leading-tight mb-2 tracking-wide">
                                    {event.title}
                                  </h3>
                                  <p className="text-gray-700 text-[12px] sm:text-[13px] md:text-[14px] font-light text-[#545454] font-touvlo whitespace-nowrap ">
                                    {event.formattedDate}
                                    <span className="ml-[2px] whitespace-nowrap">
                                      {timeDisplay}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;
