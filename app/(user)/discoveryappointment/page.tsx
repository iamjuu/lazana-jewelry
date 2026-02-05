"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

type AvailableSlot = {
  _id: string;
  sessionType: string;
  month: string;
  date: string;
  time: string;
  isBooked: boolean;
};

const DiscoveryAppointmentPage = () => {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Ref for scrolling to form
  const formRef = useRef<HTMLDivElement>(null);

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // User data from database
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  // Bowl Discovery Form state
  const [hasCrystalBowls, setHasCrystalBowls] = useState<string | null>(null);
  const [notesAndAlchemies, setNotesAndAlchemies] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string[]>([]);
  const [mainIntention, setMainIntention] = useState<string[]>([]);
  const [soundOrEnergy, setSoundOrEnergy] = useState<string>("");

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token =
          sessionStorage.getItem("userToken") ||
          sessionStorage.getItem("token");
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });
        const data = await response.json();
        if (data.success && data.data) {
          setUserData({
            name: data.data.name,
            email: data.data.email,
            phone: data.data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // User might not be logged in, which is okay
      }
    };

    fetchUserData();
  }, []);

  // Fetch available slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const response = await fetch("/api/slots?sessionType=discovery");
        const data = await response.json();
        console.log("Slots API response:", data);
        if (data.success) {
          setAvailableSlots(data.data || []);

          // Auto-navigate to the earliest month with available slots
          if (data.data && data.data.length > 0) {
            // Parse dates without timezone issues
            const parsedDates = data.data.map((slot: AvailableSlot) => {
              const parsed = parseDateString(slot.date.trim());
              return { ...parsed, dateStr: slot.date.trim() };
            });

            console.log("Parsed dates for navigation:", parsedDates);

            // Find earliest date
            const earliest = parsedDates.reduce(
              (
                earliest: {
                  year: number;
                  month: number;
                  day: number;
                  dateStr: string;
                },
                current: {
                  year: number;
                  month: number;
                  day: number;
                  dateStr: string;
                },
              ) => {
                if (earliest.year !== current.year) {
                  return earliest.year < current.year ? earliest : current;
                }
                if (earliest.month !== current.month) {
                  return earliest.month < current.month ? earliest : current;
                }
                return earliest.day < current.day ? earliest : current;
              },
              parsedDates[0],
            );
            console.log("Earliest date found:", earliest);

            // AUTO-NAVIGATION REMOVED: Always stay on current month initially per user request
            // setCurrentMonth(earliest.month);
            // setCurrentYear(earliest.year);
          }
        } else {
          console.error("Failed to fetch slots:", data.message);
          toast.error("Failed to load available slots");
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Failed to load available slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, []);

  // Generate calendar days for current month
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

    type CalendarDay = { day: number; isCurrentMonth: boolean };
    const days: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // Add days from previous month
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push({
        day: prevMonthDays - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push({
        day,
        isCurrentMonth: true,
      });
      if (currentWeek.length === 7) {
        days.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add days from next month to fill the last week
    let nextMonthDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push({
        day: nextMonthDay,
        isCurrentMonth: false,
      });
      nextMonthDay++;
    }
    if (currentWeek.length > 0) {
      days.push(currentWeek);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateLocal = (
    year: number,
    month: number,
    day: number,
  ): string => {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  // Helper function to parse YYYY-MM-DD date string without timezone issues
  const parseDateString = (
    dateStr: string,
  ): { year: number; month: number; day: number } => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return { year, month: month - 1, day }; // month is 0-indexed in JS Date
  };

  // Get available dates from slots (dates that have at least one available time)
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    availableSlots.forEach((slot) => {
      // Trim and normalize date string to ensure exact matching
      const normalizedDate = slot.date.trim();
      dates.add(normalizedDate);
    });
    console.log("Available slots:", availableSlots);
    console.log("Available dates (Set):", Array.from(dates));
    console.log("Current month/year:", currentMonth + 1, currentYear);
    return dates;
  }, [availableSlots, currentMonth, currentYear]);

  // Get available time slots for the selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const selectedDateStr = formatDateLocal(
      currentYear,
      currentMonth,
      selectedDate,
    );

    const slots = availableSlots
      .filter((slot) => slot.date === selectedDateStr && !slot.isBooked)
      .map((slot) => ({
        time: slot.time,
        available: true,
        _id: slot._id,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return slots;
  }, [selectedDate, availableSlots, currentMonth, currentYear]);

  // Get selected slot ID
  const selectedSlotId = useMemo(() => {
    if (!selectedTime) return null;
    const slot = timeSlots.find((s) => s.time === selectedTime);
    return slot?._id || null;
  }, [selectedTime, timeSlots]);

  // Check if a date has available slots
  const isDateAvailable = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;

    const dateStr = formatDateLocal(currentYear, currentMonth, day);
    const normalizedDateStr = dateStr.trim();

    // Check if date exists in available dates
    let isAvailable = availableDates.has(normalizedDateStr);

    // Also check if any slot matches this date (fallback check)
    if (!isAvailable) {
      isAvailable = availableSlots.some(
        (slot) => slot.date.trim() === normalizedDateStr,
      );
    }

    // Debug logging for specific dates
    if (day === 6 || day === 7 || day === 10) {
      console.log(
        `Checking date ${day}: formatted="${normalizedDateStr}", available=${isAvailable}`,
      );
      console.log(
        `  availableDates.has: ${availableDates.has(normalizedDateStr)}`,
      );
      console.log(
        `  availableSlots check: ${availableSlots.some((slot) => slot.date.trim() === normalizedDateStr)}`,
      );
      console.log(`  All available dates:`, Array.from(availableDates));
    }

    return isAvailable;
  };

  // Convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDateClick = (day: number | null, isCurrentMonth: boolean) => {
    if (day !== null && isCurrentMonth) {
      const today = new Date();
      const selectedDateObj = new Date(currentYear, currentMonth, day);
      const todayDateObj = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      // Only allow selection of today or future dates AND dates with available slots
      if (
        selectedDateObj >= todayDateObj &&
        isDateAvailable(day, isCurrentMonth)
      ) {
        setSelectedDate(day);
        // Reset selected time when date changes
        setSelectedTime(null);
      }
    }
  };

  const handleTimeClick = (time: string, available: boolean) => {
    if (available) {
      setSelectedTime(time);

      // Smooth scroll to form with animation after a short delay
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 300);
    }
  };

  const handleExperienceLevelChange = (value: string) => {
    setExperienceLevel((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleMainIntentionChange = (value: string) => {
    setMainIntention((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate calendar selection (REQUIRED)
    if (!selectedDate || !selectedTime || !selectedSlotId) {
      toast.error(
        "Please select both date and time before proceeding to payment",
      );
      return;
    }

    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to book a discovery session");
      return;
    }

    // Check if user data is available
    if (!userData) {
      toast.error(
        "Unable to retrieve your user information. Please try logging in again.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create Stripe checkout session for discovery session
      const response = await fetch("/api/payment/create-discovery-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSlotId,
          formData: {
            hasCrystalBowls,
            notesAndAlchemies,
            experienceLevel,
            mainIntention,
            soundOrEnergy,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.data.url;
      } else {
        toast.error(
          data.message || "Failed to initiate payment. Please try again.",
        );
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 mt-[25px]">
          <div className="max-w-6xl  mx-auto">
            {/* Header */}
            <div className="mb-[25px]">
              <h1 className="text-[32px] text-[#D5B584] font-seasons leading-tight mb-[25px]">
                Schedule Your Call
              </h1>
              <p className="text-[16px] text-[#545454] font-touvlo">
                Check Out Our Availability And Book The Date And Time That Works
                For You
              </p>
            </div>

            {/* Combined Form */}
            <form onSubmit={handleFormSubmit}>
              {/* Calendar and Time Selection Container */}
              <div className="rounded-[24px] p-6 md:p-8 lg:p-10 border">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                  {/* Left side - Calendar */}
                  <div className="w-full lg:w-1/2">
                    <h3 className="text-[18px] sm:text-[20px] md:text-[22px] text-[#5B7C99] font-normal mb-6">
                      Select Date & Time
                    </h3>

                    <div className=" border-2 border-[#E5E7EB] rounded-[16px] p-4">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentMonth === 0) {
                              setCurrentMonth(11);
                              setCurrentYear(currentYear - 1);
                            } else {
                              setCurrentMonth(currentMonth - 1);
                            }
                          }}
                          disabled={
                            currentMonth === new Date().getMonth() &&
                            currentYear === new Date().getFullYear()
                          }
                          className={`px-3 py-1 transition-colors ${
                            currentMonth === new Date().getMonth() &&
                            currentYear === new Date().getFullYear()
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-[#5B7C99] hover:text-[#1E3A8A]"
                          }`}
                          aria-label="Previous month"
                        >
                          ←
                        </button>
                        <h4 className="text-[16px] sm:text-[18px] text-[#5B7C99] font-medium">
                          {new Date(
                            currentYear,
                            currentMonth,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentMonth === 11) {
                              setCurrentMonth(0);
                              setCurrentYear(currentYear + 1);
                            } else {
                              setCurrentMonth(currentMonth + 1);
                            }
                          }}
                          className="px-3 py-1 text-[#5B7C99] hover:text-[#1E3A8A] transition-colors"
                          aria-label="Next month"
                        >
                          →
                        </button>
                      </div>

                      {/* Days of Week Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map((day) => (
                          <div
                            key={day}
                            className="text-center text-[12px] sm:text-[14px] text-[#6B7280] font-medium py-2"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="flex flex-col gap-1">
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-8">
                            <p className="text-[#6B7280] text-sm">
                              Loading available dates...
                            </p>
                          </div>
                        ) : (
                          calendarDays.map((week, weekIndex) => (
                            <div
                              key={weekIndex}
                              className="grid grid-cols-7 gap-1"
                            >
                              {week.map((calendarDay, dayIndex) => {
                                const today = new Date();
                                const { day, isCurrentMonth } = calendarDay;

                                // Check if date is in the past
                                let isPastDate = false;
                                if (isCurrentMonth) {
                                  const selectedDateObj = new Date(
                                    currentYear,
                                    currentMonth,
                                    day,
                                  );
                                  const todayDateObj = new Date(
                                    today.getFullYear(),
                                    today.getMonth(),
                                    today.getDate(),
                                  );
                                  isPastDate = selectedDateObj < todayDateObj;
                                }

                                // Check if date has available slots
                                const hasSlots =
                                  isCurrentMonth &&
                                  isDateAvailable(day, isCurrentMonth);
                                const isSelected =
                                  selectedDate === day && isCurrentMonth;
                                const isDisabled =
                                  !isCurrentMonth || isPastDate || !hasSlots;

                                return (
                                  <button
                                    type="button"
                                    key={dayIndex}
                                    onClick={() =>
                                      handleDateClick(day, isCurrentMonth)
                                    }
                                    disabled={isDisabled}
                                    className={`
                                    aspect-square rounded-lg text-[14px] sm:text-[16px] font-medium
                                    transition-all duration-200
                                    ${
                                      isSelected
                                        ? "bg-[#EF4444] text-white"
                                        : isCurrentMonth &&
                                            !isPastDate &&
                                            hasSlots
                                          ? "bg-[#1E3A8A] text-white hover:bg-[#1E40AF]"
                                          : "bg-[#374151] text-[#9CA3AF] cursor-not-allowed opacity-50"
                                    }
                                  `}
                                    title={
                                      !isCurrentMonth
                                        ? "Not in current month"
                                        : isPastDate
                                          ? "Past date"
                                          : !hasSlots
                                            ? "No available slots"
                                            : "Click to select"
                                    }
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Time Slots */}
                  <div className="w-full lg:w-1/2">
                    <h3 className="text-[18px] sm:text-[20px] md:text-[22px] text-[#5B7C99] font-normal mb-6">
                      Time Zone: Singapore Standard Time (SMT +8)
                    </h3>

                    {/* Time Slots Grid */}
                    {!selectedDate ? (
                      <div className="flex items-center justify-center py-12 px-4 bg-zinc-100 rounded-lg">
                        <p className="text-[#6B7280] text-center">
                          Please select a date first to see available time slots
                        </p>
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="flex items-center justify-center py-12 px-4 bg-zinc-100 rounded-lg">
                        <p className="text-[#6B7280] text-center">
                          No available time slots for this date
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                        {timeSlots.map((slot, index) => {
                          const isSelected = selectedTime === slot.time;

                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() =>
                                handleTimeClick(slot.time, slot.available)
                              }
                              disabled={!slot.available}
                              className={`
                              py-4 px-6 rounded-lg text-[16px] sm:text-[18px] font-medium
                              transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-[#EF4444] text-white"
                                  : slot.available
                                    ? "bg-[#1E3A8A] text-white hover:bg-[#EF4444]"
                                    : "bg-[#9CA3AF] text-white cursor-not-allowed opacity-60"
                              }
                            `}
                            >
                              {formatTime12Hour(slot.time)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bowl Discovery Form */}
              <div
                ref={formRef}
                className="mt-12 transition-all duration-700 ease-out opacity-100 translate-y-0 scale-100"
              >
                <div className="rounded-[24px] p-6 md:p-8 lg:p-10 bg-white shadow-lg transition-shadow duration-500 hover:shadow-2xl">
                  <h2 className="text-[32px] text-[#D5B584] font-seasons leading-tight mb-[25px]">
                    Discovery Form
                  </h2>
                  <p className="text-[16px] text-[#545454] font-touvlo mb-2">
                    Here are a few questions for you to fill out so we can
                    better support you in finding your right bowl family.
                  </p>
                  <p className="text-[14px] text-[#545454] font-touvlo mb-8 italic">
                    You can skip this section and submit your appointment with
                    just the date and time selection.
                  </p>

                  <div className="space-y-8">
                    {/* Question 1: Do You Have Any Crystal Bowls? */}
                    <div>
                      <label className="block text-[16px] sm:text-[18px] text-[#1C3163] font-normal mb-4">
                        Do you have any crystal bowls?
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="hasCrystalBowls"
                            value="yes"
                            checked={hasCrystalBowls === "yes"}
                            onChange={(e) => setHasCrystalBowls(e.target.value)}
                            className="w-5 h-5 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2"
                          />
                          <span className="ml-2 text-[16px] text-[#545454]">
                            Yes
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="hasCrystalBowls"
                            value="no"
                            checked={hasCrystalBowls === "no"}
                            onChange={(e) => setHasCrystalBowls(e.target.value)}
                            className="w-5 h-5 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2"
                          />
                          <span className="ml-2 text-[16px] text-[#545454]">
                            No
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Question 2: If Yes - Notes and Alchemies */}
                    {hasCrystalBowls === "yes" && (
                      <div>
                        <label className="block text-[16px] sm:text-[18px] text-[#1C3163] font-normal mb-4">
                          If yes: Please list the notes and alchemies (if
                          known):
                        </label>
                        <textarea
                          value={notesAndAlchemies}
                          onChange={(e) => setNotesAndAlchemies(e.target.value)}
                          className="w-full px-4 py-3 border border-[#1C3163] rounded-lg text-[16px] text-[#545454] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#1C3163] resize-none"
                          rows={3}
                          placeholder="Enter notes and alchemies here..."
                        />
                      </div>
                    )}

                    {/* Question 3: Experience Level */}
                    <div>
                      <label className="block text-[16px] sm:text-[18px] text-[#1C3163] font-normal mb-4">
                        How would you describe your experience level?{" "}
                        <span className="text-[#545454] text-[14px]">
                          (Optional)
                        </span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={experienceLevel.includes("beginner")}
                            onChange={() =>
                              handleExperienceLevelChange("beginner")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            Beginner - I&apos;m new to crystal bowls studio
                          </span>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={experienceLevel.includes(
                              "some-experience",
                            )}
                            onChange={() =>
                              handleExperienceLevelChange("some-experience")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            Some experience - I&apos;ve played or attended
                            sessions
                          </span>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={experienceLevel.includes("experienced")}
                            onChange={() =>
                              handleExperienceLevelChange("experienced")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            Experienced - I own/play bowls regularly
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Question 4: Main Intention */}
                    <div>
                      <label className="block text-[16px] sm:text-[18px] text-[#1C3163] font-normal mb-4">
                        What is your main intention for your discovery session?{" "}
                        <span className="text-[#545454] text-[14px]">
                          (Optional)
                        </span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mainIntention.includes("specific-note")}
                            onChange={() =>
                              handleMainIntentionChange("specific-note")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            I&apos;m looking for a specific note/crystal studio
                          </span>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mainIntention.includes("complete-set")}
                            onChange={() =>
                              handleMainIntentionChange("complete-set")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-[#1C3163] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            I want to complete or expand a set
                          </span>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mainIntention.includes("ready-purchase")}
                            onChange={() =>
                              handleMainIntentionChange("ready-purchase")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            I am ready to purchase if I find the right bowl
                          </span>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mainIntention.includes(
                              "gathering-inspiration",
                            )}
                            onChange={() =>
                              handleMainIntentionChange("gathering-inspiration")
                            }
                            className="mt-1 w-5 h-5 mr-0 text-[#D5B584] focus:ring-2 rounded"
                          />
                          <span className="ml-3 text-[16px] text-[#545454]">
                            I am gathering inspiration
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Question 5: Sound or Energy */}
                    <div>
                      <label className="block text-[16px] sm:text-[18px] text-[#1C3163] font-normal mb-4">
                        What kind of sound or energy are you looking for? (e.g.
                        grounding, heart-opening, masculine/feminine balance..){" "}
                        <span className="text-[#545454] text-[14px]">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        value={soundOrEnergy}
                        onChange={(e) => setSoundOrEnergy(e.target.value)}
                        className="w-full px-4 py-3 border border-[#1C3163] rounded-lg text-[16px] text-[#545454] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#1C3163] resize-none"
                        rows={6}
                        placeholder="Describe the kind of sound or energy you are looking for..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-start pt-4 mt-8">
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !selectedDate || !selectedTime || !userData
                  }
                  className="bg-[#1C3163] text-white px-12 py-4 rounded-lg text-[16px] font-touvlo font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Redirecting to Payment..."
                    : !selectedDate || !selectedTime
                      ? "Select Date & Time First"
                      : !userData
                        ? "Loading user data..."
                        : "Proceed to Payment"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default DiscoveryAppointmentPage;
