'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { About1 } from '@/public/assets'
import { ArrowLeft } from 'lucide-react'
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
    const token = localStorage.getItem("userToken");
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
    }
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
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 text-[#1C3163] hover:text-[#D5B584] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Events</span>
          </Link>

          {/* Event Header */}
          <div className="mb-8 md:mb-12">
            {/* Title - Centered */}
            <h1 className="text-[#D5B584] text-[32px] sm:text-[36px] md:text-[40px] lg:text-[48px] font-normal mb-6 leading-tight text-center">
              {event.title}
            </h1>
            
            {/* Date and Time Details - Right Aligned */}
            <div className="flex justify-end">
              <div className="space-y-2 text-right">
                <p className="text-[#1C3163] text-[16px] md:text-[18px] font-normal">
                  {event.location}
                </p>
                <p className="text-[#1C3163] text-[16px] md:text-[18px] font-light">
                  {formattedDate}
                </p>
                <p className="text-[#1C3163] text-[16px] md:text-[18px] font-light">
                  {event.day} {event.time}
                </p>
              </div>
            </div>
          </div>

          {/* Main Image */}
          {imageUrl && (
            <div className="mb-8 md:mb-12">
              <div className="relative w-full aspect-[5/2] rounded-2xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Content with Description and Booking */}
          <div className="space-y-8 md:space-y-12">
            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <div className="text-[#6B5D4F] text-[16px] md:text-[18px] font-light leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {/* Booking Section */}
            <div className="border-t border-[#D5B584]/30 pt-8">
              <div className="max-w-md mx-auto">
                <div className="bg-white/50 rounded-lg p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <p className="text-[#1C3163] text-[18px] md:text-[20px] font-medium mb-2">
                      {isFullyBooked ? "Event Fully Booked" : `Available Slots: ${availableSlots}`}
                    </p>
                    {price > 0 && (
                      <p className="text-[#D5B584] text-[24px] md:text-[28px] font-semibold">
                        SGD ${price.toFixed(2)} <span className="text-[16px] font-normal text-[#6B5D4F]">per slot</span>
                      </p>
                    )}
                  </div>

                  {isFullyBooked ? (
                    <div className="text-center">
                      <p className="text-[#6B5D4F] text-[14px] md:text-[16px]">
                        This event has reached its capacity. Please check back for future events.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between">
                        <label className="text-[#1C3163] text-[14px] md:text-[16px] font-medium">
                          Number of Slots:
                        </label>
                        <div className="flex items-center border border-[#1C3163] rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                            className="px-3 py-2 hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-4 py-2 border-x border-[#1C3163] text-[#1C3163] font-medium min-w-[50px] text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= availableSlots}
                            className="px-3 py-2 hover:bg-[#1C3163] hover:text-white transition-colors text-[#1C3163] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1C3163]"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total Price */}
                      {price > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-[#D5B584]/30">
                          <span className="text-[#1C3163] text-[16px] md:text-[18px] font-medium">
                            Total:
                          </span>
                          <span className="text-[#D5B584] text-[20px] md:text-[24px] font-semibold">
                            SGD ${(price * quantity).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={handleBooking}
                        disabled={bookingLoading}
                        className="w-full bg-[#1C3163] text-white px-6 py-3 rounded-lg font-medium text-[16px] md:text-[18px] hover:bg-[#2a4a7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingLoading ? "Processing..." : "Reserve Your Spot"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default EventDetailPage

