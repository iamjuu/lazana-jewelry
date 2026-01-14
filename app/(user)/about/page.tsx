"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { About1, About2, About3, HeroImage, UpcomingEvent1, AboutIMG6097, AboutCrystal } from "@/public/assets";
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

  // // Show skeleton while loading
  // if (isLoading) {
  //   return (
  //     <>
  //       {/* <Navbar /> */}
  //       <AboutSkeleton />
  //       <Footer />
  //     </>
  //   );
  // }

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <div>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <h2 className="text-[#D5B584] text-[32px] sm:text-[40px] font-normal ">
              About Crystal Singing Bowls
            </h2>

            <div className="space-y-4 text-black">
              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Crystal Singing Bowls are instruments of sound and vibration widely used in meditation, sound healing, yoga, and mindfulness practices. Unlike traditional metal singing bowls, which have centuries-old roots in the Himalayas, Crystal Singing Bowls are a more recent development. They emerged in the late twentieth century, drawing on advances in quartz crystal manufacturing and were later adopted by wellness practitioners for their clear, sustained tones and simplicity.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Crystal singing bowls are made from quartz crystal, a material known for its stability and acoustic properties. When played, they produce long-lasting tones that fill a space evenly, creating a focused and immersive sound. Compared to metal bowls, which often generate layered and overtone-rich sounds, quartz crystal bowls are valued for their clarity and singular tone, supporting relaxation, mental focus, and a deeper sense of presence.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                At Crystal Bowl Studio, our bowls are crafted with close attention to sound quality, material purity, and thoughtful design. Each bowl is crafted from 99.9% pure quartz crystal sourced from North Carolina, a region known for exceptionally high-quality quartz. This level of purity contributes to consistency in resonance and tonal clarity, allowing the sound to remain steady and balanced over time.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                The production process involves extremely high temperatures, reaching approximately 2,200 degrees celsius, during which the quartz crystal is shaped and tuned with precision. Because this process combines technical control with hands-on craftsmanship, subtle variations arise naturally in each bowl&apos;s tone, surface, and form. No two bowls are exactly alike. Each develops its own character through the process and the skilled hands involved. The specialised production facility and experienced team ensure consistent quality, while their craftsmanship also makes it possible to customise bowls to suit individual preferences or professional needs.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Designed to be both a sound healing instrument and a mindful companion, our crystal bowls are created to support personal practice, group sessions, or quiet moments of reflection.
              </p>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative w-full flex justify-center lg:justify-end py-8 sm:py-12 md:py-16">
            <div className="relative w-full max-w-[400px] sm:max-w-[450px] md:max-w-[500px] group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src={AboutIMG6097}
                  alt="Crystal singing bowl"
                  width={500}
                  height={750}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <h2 className="text-[#D5B584] text-[32px] sm:text-[40px] font-normal ">
              About Sound Healing
            </h2>

            <div className="space-y-4 text-black">
              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Sound Healing refers to a range of practices that use sound and vibration to support relaxation, focus, and overall well-being. These practices may include sound baths, sound meditation, and vibroacoustic therapy, and music-based mindfulness. Instruments such as singing bowls, gongs, tuning forks, and bells are commonly used to create sustained tones and gentle vibrations that creates a symphony of synchronising vibrations, orchestrating a resonance that permeates every cell and fibre of our being and quietens mental noise.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                From a scientific perspective, Sound Healing is most often discussed in relation to its effects on the nervous system, attention, and stress regulation. Research in psychology and neuroscience suggests that slow, continuous sounds can help reduce stress-related arousal by engaging the parasympathetic nervous system, which is the part of the nervous system responsible for rest, recovery, and regulation. Studies examining sound meditation and sound bath experiences have observed changes in breathing patterns, heart rate, and perceived tension, all of which are commonly associated with relaxation responses.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Beyond these physiological effects, sound-based practices are also closely linked to mindfulness. Sustained sounds can act as a simple, non-verbal focal point for attention, helping to reduce mental distractions and support present-moment awareness. Research on music and sound-based interventions has reported associations with reduced perceived stress, improved mood, and greater emotional regulation.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                In addition to their effects on the nervous system and attention, vibration also plays an important role in many sound healing approaches. Lower-frequency sound waves can be felt physically as well as heard, particularly when instruments such as singing bowls are played nearby. Sound Healing is best understood as a complementary practice, supporting well-being alongside meditation, movement, and therapeutic care.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Its growing presence across wellness, clinical, and contemplative settings reflects a broader interest in how sound and attentive listening can support regulation, focus, and rest. At Crystal Bowl Studio, approaches sound healing with this understanding, we design our bowls to offer clear, sustained sound and gentle vibration, supporting practices of listening, presence, and restorative calm in everyday modern life.
              </p>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative w-full flex justify-center lg:justify-end py-8 sm:py-12 md:py-16">
            <div className="relative w-full max-w-[400px] sm:max-w-[450px] md:max-w-[500px] group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src={AboutCrystal}
                  alt="Sound healing session"
                  width={500}
                  height={750}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Our Founder Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] sm:py-[80px] md:py-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-[#D5B584] text-[32px] sm:text-[40px] font-normal ">
              About Our Founder
            </h2>

            <div className="space-y-4 text-black">
              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Crystal Bowl Studio was founded by Francesca Wong, whose work brings together
                international business experience and long-standing practice in yoga and sound healing.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-black">
                Before establishing Crystal Bowl Studio, Francesca spent over a decade working across global
                finance, e-commerce, and luxury beauty, with experience at KPMG, Citibank, Alibaba, and
                Estée Lauder. While these international environments shaped her understanding of structure,
                quality, design, and a strong understanding of consumers and products, she was drawn
                towards a more grounded and meaningful way of service - one that aligned more closely with
                her values and lived experience.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-black">
                Her journey into yoga and sound began in 2011 and gradually deepened through years of
                study, practice, and teaching. Francesca trained extensively in India and Australia, spending
                over a year living and studying in Indian ashrams, in Rishikesh, Dharamshala, Bangalore, Delhi,
                and Varanasi. She is a certified e-RYT500 yoga teacher and sound healer. Her approach is
                informed by classical yoga philosophy as well as broader healing traditions such as Ayurveda
                and Traditional Chinese Medicine. Rather than treating these systems as fixed doctrines, she
                approaches them as practical frameworks that support awareness, presence, and balance in
                everyday life.
              </p>

              <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300]">
                Francesca&apos;s experience in consumer-facing industries reflects the way Crystal Bowl Studio
                approaches its products, the integration of craftsmanship, practicality and usability, creating
                sound healing instruments that are refined, approachable. The Studio was created with the
                aim of making sound healing practical and accessible to support modern life.
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full flex justify-center lg:justify-end py-8 sm:py-12 md:py-16">
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-[400px] group ">
              {/* Horizontal Card - Rotated 90 degrees */}
              <div className="absolute top-1/2 left-1/2 w-full aspect-[3/4] bg-[#D5B584] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] -translate-x-[50%] -translate-y-1/2 rotate-90 group-hover:rotate-60 transition-transform duration-300 ease-out shadow-lg"></div>

              {/* Main Image */}
              <div className="relative w-[400px] h-[600px] rounded-[15px] sm:rounded-[18px] md:rounded-[20px] overflow-hidden z-10">
                <ImageWithShimmer
                  src={UpcomingEvent1}
                  alt="Francesca Wong, founder of Crystal Bowl Studio"
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
 