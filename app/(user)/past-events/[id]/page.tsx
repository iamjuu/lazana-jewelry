'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { About1 } from '@/public/assets'
import { ArrowLeft } from 'lucide-react'

type ApiPastEvent = {
  _id: string;
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  description: string;
  thumbnailImage: string;
  photos?: string[];
  videos?: string[];
  createdAt: string;
  updatedAt: string;
}

const PastEventDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [pastEvent, setPastEvent] = useState<ApiPastEvent | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to get image URL
  const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  useEffect(() => {
    const fetchPastEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/past-events/${eventId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setPastEvent(data.data);
        } else {
          router.push("/events");
        }
      } catch (error) {
        console.error("Failed to fetch past event:", error);
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchPastEvent();
    }
  }, [eventId, router]);

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

  if (!pastEvent) {
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

  const eventDate = new Date(pastEvent.date);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[eventDate.getMonth()];
  const dayNumber = eventDate.getDate();
  const year = eventDate.getFullYear();
  const formattedDate = `${monthName} ${dayNumber}, ${year}`;

  const photos = pastEvent.photos || [];
  const videos = pastEvent.videos || [];
  const thumbnailUrl = getImageUrl(pastEvent.thumbnailImage);

  return (
    <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen w-full overflow-x-hidden'>
      <Navbar />
      
      <div className="w-full py-[30px] sm:py-[35px] md:py-[40px] lg:py-[50px]">
        <div className="w-full min-w-0 px-4 sm:px-5 md:px-6 lg:px-8 xl:max-w-7xl xl:mx-auto">
          {/* Back Button */}
          <Link 
            href="/events"
            className="inline-flex items-center gap-2 text-[#1C3163] hover:text-[#D5B584] mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Events</span>
          </Link>

           {/* Event Header */}
           <div className="mb-3 sm:mb-4">
             {/* Title and Details - Side by Side on Desktop (950px+) */}
             <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 xl:gap-8 mb-3 sm:mb-4">
               {/* Title - Left Side */}
               <h1 className="text-[#D5B584] text-[32px] sm:text-[36px] md:text-[40px] lg:text-[48px] font-normal leading-tight xl:flex-1 xl:min-w-0 break-words">
               {pastEvent.title}
             </h1>
             
             {/* Date and Time Details - Right Aligned */}
               <div className="flex justify-end xl:justify-end xl:flex-shrink-0">
               <div className="space-y-2 text-right">
                   <p className="text-[#1C3163] text-[16px] md:text-[18px] font-normal whitespace-nowrap">
                   {pastEvent.location}
                 </p>
                   <p className="text-[#1C3163] text-[16px] md:text-[18px] font-light whitespace-nowrap">
                   {formattedDate}
                 </p>
                   <p className="text-[#1C3163] text-[16px] md:text-[18px] font-light whitespace-nowrap">
                   {pastEvent.day} {pastEvent.time}
                 </p>
                 </div>
               </div>
             </div>
           </div>

           {/* Main Thumbnail Image */}
           {thumbnailUrl && (
             <div className="mb-6 sm:mb-8 md:mb-10">
               <div className="relative w-full aspect-[7/3] overflow-hidden">
                 <img
                   src={thumbnailUrl}
                   alt={pastEvent.title}
                   className="w-full h-full object-contain"
                 />
               </div>
             </div>
           )}

          {/* Content with Flexible Layout */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <div className="text-[#6B5D4F] text-[16px] md:text-[18px] font-light leading-relaxed whitespace-pre-line">
                {pastEvent.description}
              </div>
            </div>

            {/* Media Gallery - Unified Grid Layout */}
            {(photos.length > 0 || videos.length > 0) && (
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {/* Unified Grid: Photos and Videos together */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Render Photos */}
                     {photos.map((photo, index) => {
                       const photoUrl = getImageUrl(photo);
                       return (
                      <div key={`photo-${index}`} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                           <img
                             src={photoUrl}
                             alt={`${pastEvent.title} - Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                           />
                         </div>
                       );
                     })}
                  
                  {/* Render Videos */}
                  {videos.map((video, index) => {
                    const isYouTube = video.includes('youtube.com') || video.includes('youtu.be');
                         return (
                      <div key={`video-${index}`} className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
                        {isYouTube ? (() => {
                             let videoId = '';
                             if (video.includes('youtube.com/watch?v=')) {
                               videoId = video.split('v=')[1]?.split('&')[0] || '';
                             } else if (video.includes('youtu.be/')) {
                               videoId = video.split('youtu.be/')[1]?.split('?')[0] || '';
                             }
                             
                             if (videoId) {
                               return (
                                 <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
                                title={`${pastEvent.title} - Video ${index + 1}`}
                                   className="w-full h-full"
                                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                   allowFullScreen
                                 />
                               );
                             }
                          return null;
                        })() : (
                             <video
                               src={video}
                            autoPlay
                            muted
                            loop
                            playsInline
                               controls
                            className="w-full h-full object-cover"
                             >
                               Your browser does not support the video tag.
                             </video>
                        )}
                               </div>
                             );
                           })}
                         </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default PastEventDetailPage

