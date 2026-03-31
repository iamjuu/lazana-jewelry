"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

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
  totalSeats?: number;
  bookedSeats?: number;
  price?: number;
  createdAt: string;
  updatedAt: string;
};

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    couponId: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string): string => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setEvent(data.data);
          setQuantity(1); // Reset quantity when event changes
        } else {
          router.push("/events");
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, router]);

  const handleBooking = async () => {
    // Check if user is logged in
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to book this event");
      router.push("/login");
      return;
    }

    if (!event) return;

    // Check if event has available slots
    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (availableSlots <= 0) {
      toast.error("This event is fully booked");
      return;
    }

    // Validate quantity
    if (quantity <= 0) {
      toast.error("Please select at least 1 slot");
      return;
    }

    if (quantity > availableSlots) {
      toast.error(
        `Only ${availableSlots} slot${availableSlots > 1 ? "s" : ""} available`,
      );
      return;
    }

    setBookingLoading(true);

    try {
      // Create Razorpay order
      const response = await fetch("/api/payment/create-event-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event._id,
          quantity: quantity,
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?.couponId,
          discountAmount: appliedCoupon?.discountAmount,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.razorpayOrderId) {
        openRazorpayCheckout({
          key: data.data.key,
          amount: data.data.amount,
          currency: data.data.currency,
          orderId: data.data.razorpayOrderId,
          name: "Lazana Jewelry",
          description: data.data.description,
          prefill: data.data.prefill,
          notes: {
            sessionType: "event",
            eventId: event._id,
          },
          onSuccess: (paymentResponse) => {
            router.push(
              `/events/${event._id}/success?razorpay_payment_id=${paymentResponse.razorpay_payment_id}&razorpay_order_id=${paymentResponse.razorpay_order_id}&razorpay_signature=${paymentResponse.razorpay_signature}`,
            );
          },
          onError: (message) => {
            toast.error(message);
            setBookingLoading(false);
          },
          onDismiss: () => {
            setBookingLoading(false);
          },
        });
      } else {
        toast.error(data.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to process booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!event) return;
    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (newQuantity >= 1 && newQuantity <= availableSlots) {
      setQuantity(newQuantity);
      // Re-validate coupon with new quantity if coupon is applied
      if (appliedCoupon) {
        applyCoupon(appliedCoupon.code, newQuantity);
      }
    }
  };

  const applyCoupon = async (code: string, qty: number = quantity) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      toast.error("Please login to use coupon");
      return;
    }

    if (!code.trim()) {
      setCouponError("Invalid coupon");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupons/validate-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponCode: code.trim().toUpperCase(),
          eventId: event?._id,
          quantity: qty,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setAppliedCoupon({
          code: code.trim().toUpperCase(),
          discountPercent: data.data.discountPercent,
          discountAmount: data.data.discountAmount,
          couponId: data.data.coupon._id,
        });
        setCouponCode("");
        toast.success(
          data.data.coupon?.couponName || "Coupon applied successfully!",
        );
      } else {
        setCouponError("Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponError("Invalid coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p>Loading event...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <p className="mb-4 font-touvlo md:text-[16px]">Event not found</p>
            <Link
              href="/events"
              className="text-[#1C3163] hover:underline font-touvlo md:text-[32px]"
            >
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const monthNames = [
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
  const monthName = monthNames[eventDate.getMonth()];
  const dayNumber = eventDate.getDate();
  const year = eventDate.getFullYear();

  let formattedDate = `${monthName} ${dayNumber}, ${year}`;

  if (event.endDate) {
    const endDate = new Date(event.endDate);
    const endMonthName = monthNames[endDate.getMonth()];
    const endDayNumber = endDate.getDate();
    const endYear = endDate.getFullYear();

    if (year === endYear) {
      if (eventDate.getMonth() === endDate.getMonth()) {
        // Same month: "February 10 - 12, 2025"
        formattedDate = `${monthName} ${dayNumber} - ${endDayNumber}, ${year}`;
      } else {
        // Different month: "February 28 - March 02, 2025"
        formattedDate = `${monthName} ${dayNumber} - ${endMonthName} ${endDayNumber}, ${year}`;
      }
    } else {
      // Different year: "December 30, 2025 - January 02, 2026"
      formattedDate = `${monthName} ${dayNumber}, ${year} - ${endMonthName} ${endDayNumber}, ${endYear}`;
    }
  }

  const imageUrl = event.imageUrl ? getImageUrl(event.imageUrl) : "";
  const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
  const isFullyBooked = availableSlots <= 0;
  const price = event.price || 0;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.round(p * 100) / 100);

  const formatTimeWithDate = (
    day: string,
    time: string,
    dateString: string,
    endDateString?: string,
  ): string => {
    if (!endDateString) {
      return time; // Just show time for single day as date is shown above
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

    const isMultiDay =
      startDate.getDate() !== endDate.getDate() ||
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear();

    if (endTime && isMultiDay) {
      return `${startTime} - ${endTime}`;
    }

    return time;
  };

  return (
    <div className="bg-white min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Navbar />

      <div className="w-full] lg:py-[0px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[#1C3163] hover:text-[#000000] mb-6 sm:mb-8 transition-colors text-[13px] sm:text-[14px] md:text-[16px] mt-[25px]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 font-seasons text-[16px]" />
            <span className="font-seasons text-[16px]">Back to All Events</span>
          </Link>

          {/* Top Section: Image and Booking Info Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 sm:gap-8 lg:gap-16 mb-8 sm:mb-10 md:mb-12">
            {/* Left Column - Main Image */}
            <div className="order-1">
              {imageUrl && (
                <div className="w-full aspect-[4/3] lg:aspect-auto lg:h-[450px] overflow-hidden ">
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Event Info & Booking */}
            <div className="order-2">
              <div className="space-y-2 sm:space-y-3 mt-0 sm:mt-4">
                {/* Event Title */}
                <h1 className="text-[#1C3163] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-light leading-tight font-seasons">
                  {event.title}
                </h1>

                {/* Event Details */}
                <div className="space-y-1 sm:space-y-1.5 text-[#1C3163] text-[12px] sm:text-[13px] md:text-[14px] font-touvlo">
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-touvlo text-[#1C3163] ">
                    {event.day}, {formattedDate}
                  </p>
                  <p className=" text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-touvlo">
                    {formatTimeWithDate(
                      event.day,
                      event.time,
                      event.date,
                      event.endDate,
                    )}
                  </p>
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-touvlo">{event.location}</p>
                </div>

                {/* Booking Card */}
                {isFullyBooked ? (
                  <div className="bg-white/50 rounded-lg p-3 sm:p-4 text-center mt-4 sm:mt-6">
                    <p className="text-[#6B5D4F] text-[13px] sm:text-[14px] font-light">
                      This event has reached its capacity. Please check back for
                      future events.
                    </p>
                  </div>
                ) : (
                  <div className="mt-[25px]">
                    {/* Price */}
                    {price > 0 && (
                      <div className="">
                        <p className="text-[#1C3163] text-[16px] sm:text-[18px] md:text-[18px] font-light font-touvlo">
                          {formatPrice(price)}
                        </p>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#1C3163] w-fit mt-[25px]">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] text-[16px] sm:text-[18px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-3 sm:px-4 border-x border-[#1C3163] h-9 sm:h-10 flex items-center justify-center text-[#1C3163] text-[14px] sm:text-[16px] font-medium min-w-[45px] sm:min-w-[50px] font-touvlo">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= availableSlots}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] text-[16px] sm:text-[18px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-1.5 mt-[10px]">
                      {appliedCoupon ? (
                        <div className="p-2.5 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-700 text-[12px] font-medium">
                                {appliedCoupon.code} -{" "}
                                {appliedCoupon.discountPercent || "Fixed"} off
                              </p>
                              <p className="text-green-600 text-[11px]">
                                Save {formatPrice(appliedCoupon.discountAmount)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeCoupon}
                              className="text-green-700 text-[11px] underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            placeholder="Coupon code"
                            className="flex-1 border border-[#1C3163] px-3 py-2 text-[13px] text-[#1C3163] focus:border-black focus:ring-[#1C3163] focus:ring-1  outline-none transition-all"
                            disabled={couponLoading}
                          />
                          <button
                            type="button"
                            onClick={() => applyCoupon(couponCode)}
                            disabled={couponLoading || !couponCode.trim()}
                            className={`px-4 py-2 text-white text-[13px] font-medium transition-all ${
                              couponCode.trim() && !couponLoading
                                ? "bg-[#1C3163] hover:bg-[#2a4a7a] shadow-md"
                                : "bg-[#1C3163]/50 opacity-50 cursor-not-allowed"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {couponLoading ? "..." : "Apply"}
                          </button>
                        </div>
                      )}
                      {couponError && (
                        <p className="text-red-600 text-[11px]">
                          Invalid coupon
                        </p>
                      )}
                    </div>

                    {/* Price Summary */}
                    {price > 0 && appliedCoupon && (
                      <div className="space-y-1 text-[13px] pt-2 border-t border-[#1C3163]/10">
                        <div className="flex justify-between">
                          <span className="text-[#6B5D4F]">Subtotal:</span>
                          <span className="text-[#1C3163]">
                            {formatPrice(price * quantity)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Discount:</span>
                          <span className="text-green-600">
                            -{formatPrice(appliedCoupon.discountAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[#1C3163]">
                          <span className="text-[#1C3163] font-medium">
                            Total:
                          </span>
                          <span className="text-[#1C3163] font-medium">
                            {formatPrice(
                              Math.max(
                                0,
                                price * quantity - appliedCoupon.discountAmount,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reserve Button */}
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className=" mt-[12px] w-full bg-[#1C3163] text-white px-5 sm:px-6 py-2.5 text-[12px] sm:text-[13px] md:text-[14px] font-medium uppercase tracking-wider hover:bg-[#000000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? "Processing..." : "Reserve Your Spot"}
                    </button>

                    {/* Availability Info */}
                    <p className="text-[#1C3163] md:text-[16px] sm:text-[12px] font-light text-touvlo mt-[12px]">
                      {availableSlots} spot{availableSlots !== 1 ? "s" : ""}{" "}
                      remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section - Full Width Below Image */}
          <div className="max-w-4xl font-touvlo">
            <div className="text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] font-light leading-[1.7] sm:leading-[1.75] whitespace-pre-line text-[#545454]">
              {event.description}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetailPage;


