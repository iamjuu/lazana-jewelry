'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type ApiEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  description: string;
  imageUrl?: string;
  totalSeats?: number;
  bookedSeats?: number;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

const EventDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<ApiEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    couponId: string;
  } | null>(null)
  const [couponError, setCouponError] = useState("")

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string): string => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
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
      toast.error(`Only ${availableSlots} slot${availableSlots > 1 ? 's' : ''} available`);
      return;
    }

    setBookingLoading(true);

    try {
      // Create Stripe checkout session
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

      if (data.success && data.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.data.url;
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
        toast.success(data.data.coupon?.couponName || "Coupon applied successfully!");
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
      <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
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
      <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <p className="mb-4">Event not found</p>
            <Link href="/events" className="text-[#D5B584] hover:underline">
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[eventDate.getMonth()];
  const dayNumber = eventDate.getDate();
  const year = eventDate.getFullYear();
  const formattedDate = `${monthName} ${dayNumber}, ${year}`;

  const imageUrl = event.imageUrl ? getImageUrl(event.imageUrl) : "";
  const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
  const isFullyBooked = availableSlots <= 0;
  const price = event.price || 0;

  return (
    <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
      <Navbar />
      
      <div className="w-full py-[40px] md:py-[68px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 text-[#1C3163] hover:text-[#D5B584] mb-8 transition-colors text-[14px] md:text-[16px]"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Back to All Events</span>
          </Link>

          {/* Top Section: Image and Booking Info Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-16 mb-12">
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
              <div className="space-y-2 mt-4">
                {/* Event Title */}
                <h1 className="text-[#1C3163] text-[22px] md:text-[24px] lg:text-[26px] font-light leading-tight">
                  {event.title}
                </h1>

                {/* Event Details */}
                <div className="space-y-1.5 text-[#1C3163] text-[13px] md:text-[14px]">
                  <p className="font-normal">{event.day}, {formattedDate}</p>
                  <p className="font-light">{event.time}</p>
                  <p className="font-light">{event.location}</p>
                </div>

                {/* Booking Card */}
                {isFullyBooked ? (
                  <div className="bg-white/50 rounded-lg p-4 text-center mt-4">
                    <p className="text-[#6B5D4F] text-[14px] font-light">
                      This event has reached its capacity. Please check back for future events.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {/* Price */}
                    {price > 0 && (
                      <div className="pb-2">
                        <p className="text-[#1C3163] text-[20px] md:text-[22px] font-light">
                          SGD {price.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-[#1C3163] w-fit">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] text-[18px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-4 border-x border-[#1C3163] h-10 flex items-center justify-center text-[#1C3163] text-[16px] font-medium min-w-[50px]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= availableSlots}
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] text-[18px] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-1.5">
                      {appliedCoupon ? (
                        <div className="p-2.5 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-700 text-[12px] font-medium">
                                {appliedCoupon.code} - {appliedCoupon.discountPercent || 'Fixed'} off
                              </p>
                              <p className="text-green-600 text-[11px]">
                                Save ${appliedCoupon.discountAmount.toFixed(2)}
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
                            className="flex-1 border border-[#1C3163] px-3 py-2 text-[13px] text-[#1C3163] focus:border-[#D5B584] focus:ring-1 focus:ring-[#D5B584] outline-none transition-all"
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
                        <p className="text-red-600 text-[11px]">Invalid coupon</p>
                      )}
                    </div>

                    {/* Price Summary */}
                    {price > 0 && appliedCoupon && (
                      <div className="space-y-1 text-[13px] pt-2 border-t border-[#1C3163]/10">
                        <div className="flex justify-between">
                          <span className="text-[#6B5D4F]">Subtotal:</span>
                          <span className="text-[#1C3163]">${(price * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Discount:</span>
                          <span className="text-green-600">-${appliedCoupon.discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[#1C3163]/10">
                          <span className="text-[#1C3163] font-medium">Total:</span>
                          <span className="text-[#1C3163] font-medium">
                            ${Math.max(0, (price * quantity) - appliedCoupon.discountAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reserve Button */}
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full bg-[#8B6F47] text-white px-6 py-2.5 text-[13px] md:text-[14px] font-medium uppercase tracking-wider hover:bg-[#7a5f3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? "Processing..." : "Reserve Your Spot"}
                    </button>

                    {/* Availability Info */}
                    <p className="text-[#6B5D4F] text-[12px] font-light">
                      {availableSlots} spot{availableSlots !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section - Full Width Below Image */}
          <div className="max-w-4xl">
            <div className="text-[#1C3163] text-[15px] md:text-[16px] font-light leading-[1.75] whitespace-pre-line">
              {event.description}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default EventDetailPage

