"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { About1, About2, About3, HeroImage, UpcomingEvent1, AboutNew1, AboutNew2 } from "@/public/assets";
import { AboutSkeleton, ImageWithShimmer } from "./components";

const AboutPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const Data = [
    {
      id: 1,
      image: About1
    },
    {
      id: 2,
      image: About2
    },
    {
      id: 3,
      image: About3
    }
  ];

  // Show skeleton while loading
  if (isLoading) {
    return (
      <>
        {/* <Navbar /> */}
        <AboutSkeleton />
        <Footer />
      </>
    );
  }

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <div>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        {/* Image floats right, text wraps around it */}
        <div className="relative">
          {/* Floating Image on Right */}
          <div className="float-right ml-6 mb-4 lg:ml-12 lg:mb-6 w-[280px] sm:w-[320px] md:w-[380px] group">
            <div className="relative w-full aspect-[4/3] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden shadow-lg">
              <ImageWithShimmer
                src={AboutNew1}
                alt="Crystal singing bowl"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                priority
              />
            </div>
          </div>

          {/* Text content that wraps around the image */}
          <h2 className="text-[#D5B584] text-[32px] sm:text-[40px] font-normal font-serif mb-4">
            Crystal Singing Bowls
          </h2>

          <p className="text-[15px] sm:text-[16px] md:text-[22px]  font-[300] leading-relaxed text-black">
            Crystal Singing Bowls are instruments of sound and vibration widely used in meditation, sound healing, yoga, and mindfulness practices. Unlike traditional metal singing bowls, which have centuries-old roots in the Himalayas, Crystal Singing Bowls are a more recent development. They emerged in the late twentieth century, drawing on advances in quartz crystal manufacturing and were later adopted by wellness practitioners for their clear, sustained tones and simplicity. Crystal singing bowls are made from quartz crystal, a material known for its stability and acoustic properties. When played, they produce long-lasting tones that fill a space evenly, creating a focused and immersive sound. Compared to metal bowls, which often generate layered and overtone-rich sounds, quartz crystal bowls are valued for their clarity and singular tone, supporting relaxation, mental focus, and a deeper sense of presence. At Crystal Bowl Studio, our bowls are crafted with close attention to sound quality, material purity, and thoughtful design. Each bowl is crafted from 99.9% pure quartz crystal sourced from North Carolina, a region known for exceptionally high-quality quartz. This level of purity contributes to consistency in resonance and tonal clarity, allowing the sound to remain steady and balanced over time. The production process involves extremely high temperatures, reaching approximately 2,200 degrees celsius, during which the quartz crystal is shaped and tuned with precision. Because this process combines technical control with hands-on craftsmanship, subtle variations arise naturally in each bowl&apos;s tone, surface, and form. No two bowls are exactly alike. Each develops its own character through the process and the skilled hands involved. The specialised production facility and experienced team ensure consistent quality, while their craftsmanship also makes it possible to customise bowls to suit individual preferences or professional needs. Designed to be both a sound healing instrument and a mindful companion, our crystal bowls are created to support personal practice, group sessions, or quiet moments of reflection.
          </p>

          {/* Clear float */}
          <div className="clear-both"></div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        {/* Image floats right, text wraps around it */}
        <div className="relative">
          {/* Floating Image on Right */}
          <div className="float-right ml-6 mb-4 lg:ml-12 lg:mb-6 w-[280px] sm:w-[320px] md:w-[380px] group">
            <div className="relative w-full aspect-[4/3] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden shadow-lg">
              <ImageWithShimmer
                src={AboutNew2}
                alt="Sound healing session"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                priority
              />
            </div>
          </div>

          {/* Text content that wraps around the image */}
          <h2 className="text-[#D5B584] text-[32px] sm:text-[40px] font-normal font-serif mb-4">
            About Sound Healing
          </h2>

          <p className="text-[15px] sm:text-[16px] md:text-[22px] leading-relaxed font-[300] text-black">
            Sound Healing refers to a range of practices that use sound and vibration to support relaxation, focus, and overall well-being. These practices may include sound baths, sound meditation, and vibroacoustic therapy, and music-based mindfulness. Instruments such as singing bowls, gongs, tuning forks, and bells are commonly used to create sustained tones and gentle vibrations that creates a symphony of synchronising vibrations, orchestrating a resonance that permeates every cell and fibre of our being and quietens mental noise. From a scientific perspective, Sound Healing is most often discussed in relation to its effects on the nervous system, attention, and stress regulation. Research in psychology and neuroscience suggests that slow, continuous sounds can help reduce stress-related arousal by engaging the parasympathetic nervous system, which is the part of the nervous system responsible for rest, recovery, and regulation. Studies examining sound meditation and sound bath experiences have observed changes in breathing patterns, heart rate, and perceived tension, all of which are commonly associated with relaxation responses. Beyond these physiological effects, sound-based practices are also closely linked to mindfulness. Sustained sounds can act as a simple, non-verbal focal point for attention, helping to reduce mental distractions and support present-moment awareness. Research on music and sound-based interventions has reported associations with reduced perceived stress, improved mood, and greater emotional regulation. In addition to their effects on the nervous system and attention, vibration also plays an important role in many sound healing approaches. Lower-frequency sound waves can be felt physically as well as heard, particularly when instruments such as singing bowls are played nearby. Sound Healing is best understood as a complementary practice, supporting well-being alongside meditation, movement, and therapeutic care. Its growing presence across wellness, clinical, and contemplative settings reflects a broader interest in how sound and attentive listening can support regulation, focus, and rest. At Crystal Bowl Studio, approaches sound healing with this understanding, we design our bowls to offer clear, sustained sound and gentle vibration, supporting practices of listening, presence, and restorative calm in everyday modern life.
          </p>

          {/* Clear float */}
          <div className="clear-both"></div>
        </div>
      </div>


      <div className="max-w-7xl border-b border-[#D5B584] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid pt-[30px] sm:pt-[40px] md:pt-[54px] grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start pb-[40px]">
          {/* Left Side - Content */}
          <div className="w-full">
            <h1 className="">
              <span className="text-[#D5B584] italic text-[18px] sm:text-[22px] md:text-[30px] ">
                Crystal Bowl Studio
              </span>{" "}
              <span className="text-black text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px]">
                is created and designed by master sound and energy healer
                Francesca Wong, fulfilling her dream to create a range of
                crystal bowls that are beautifully designed, with premium
                crystal quality and sound, with a powerful resonance and energy.
                at a more affordable price to make sound healing more accessible
                to healers all over the world.
              </span>
            </h1>
    
          </div>

          {/* Right Side - Images */}
          <div className="w-full">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {Data.map((item) => (
                <div key={item.id} className="relative group overflow-hidden">
                  <ImageWithShimmer
                    src={item.image}
                    alt={`About ${item.id}`}
                    width={500}
                    height={500}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

 
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-[#D5B584] text-[32px] sm:text-[40px]  font-normal font-serif">
              Meet Frankie
            </h2>

            <div className="space-y-4 text-black]">
              <p className="text-[15px] sm:text-[16px] md:text-[22px] leading-relaxed">
                <span className="font-medium">Frankie</span> Yogi & music healer
                inspired by ancient traditions & modern well-being. ✨ Find
                Balance. Heal Through Yoga & Sound. Awaken Your True Self.
                Discover the power of sound healing, yoga, and meditation to
                restore harmony within. Whether you&apos;re seeking relaxation,
                stress relief, emotional release, or deep transformation,
                Frankie guides you through immersive experiences that reconnect
                you to your essence. Frankie is a certified yoga teacher
                (e-RYT500), sound healer, and transformational guide. With over
                15 years of experience and deep training in India and Australia,
                she blends ancient philosophy with modern well-being practices.
              </p>

              <p className="text-[14px] sm:text-[15px] md:text-[16px] font-[300] leading-relaxed italic text-black">
                Her mission? To help individuals and teams manage stress,
                activate inner healing, and find balance through yoga, sound
                baths, and energy work.
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full flex justify-center lg:justify-end py-8 sm:py-12 md:py-16">
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-[300px] group">
              {/* Decorative Cards - Plus Icon Pattern */}
              {/* Vertical Card - Same dimensions as image, slightly offset */}
              {/* <div className="absolute top-1/2 left-1/2 w-full aspect-[3/4] bg-[#1C3163] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] -translate-x-[45%] -translate-y-1/2 rotate-[8deg] shadow-lg"></div> */}

              {/* Horizontal Card - Rotated 90 degrees */}
              <div className="absolute top-1/2 left-1/2 w-full aspect-[3/4] bg-[#1C3163] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] -translate-x-[50%] -translate-y-1/2 rotate-90 group-hover:rotate-60 transition-transform duration-300 ease-out shadow-lg"></div>

              {/* Main Image */}
              <div className="relative w-full aspect-[3/4] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden  z-10">
                <ImageWithShimmer
                  src={UpcomingEvent1}
                  alt="Frankie in meditation pose"
                  fill
                  className="object-cover group-hover:rotate-3 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
