"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import {
  About1,
  About2,
  About3,
  HeroImage,
  UpcomingEvent1,
  AboutIMG6097,
  AboutCrystal,
  PremiumQuality,
  UniqueToYou,
  Crystal,
  Intention,
  FooterIcon3,
} from "@/public/assets";
import { AboutSkeleton, ImageWithShimmer } from "./components";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

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
      image: About1,
    },
    {
      id: 2,
      image: About2,
    },
    {
      id: 3,
      image: About3,
    },
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

  const Icons = [
    {
      id: 1,
      image: PremiumQuality,
      title: " Premium Craftsmanship",
      para: "Each piece is precision-crafted, made from 100% pure clear quartz, our bowls produce quality sound and long-lasting resonance.",
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
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <div>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          {/* Left Side - Content */}
          <div className="">
            <h2 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Crystal Singing Bowls
            </h2>

            <div className=" text-[#545454] mt-[25px]">
              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left">
                Crystal Singing Bowls are instruments of sound and vibration
                widely used in meditation, sound healing, yoga, and mindfulness
                practices. Unlike traditional metal singing bowls, which have
                centuries-old roots in the Himalayas, Crystal Singing Bowls are
                a more recent development. They emerged in the late twentieth
                century, drawing on advances in quartz crystal manufacturing and
                were later adopted by wellness practitioners for their clear,
                sustained tones and simplicity.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Crystal singing bowls are made from quartz crystal, a material
                known for its stability and acoustic properties. When played,
                they produce long-lasting tones that fill a space evenly,
                creating a focused and immersive sound. Compared to metal bowls,
                which often generate layered and overtone-rich sounds, quartz
                crystal bowls are valued for their clarity and singular tone,
                supporting relaxation, mental focus, and a deeper sense of
                presence.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                At Crystal Bowl Studio, our bowls are crafted with close
                attention to sound quality, material purity, and thoughtful
                design. Each bowl is crafted from{" "}
                <span className="font-semibold">
                  99.9% pure quartz crystal sourced from North Carolina
                </span>
                , a region known for exceptionally high-quality quartz. This
                level of purity contributes to consistency in resonance and
                tonal clarity, allowing the sound to remain steady and balanced
                over time.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                The production process involves extremely high temperatures,
                reaching approximately 2,200 degrees celsius, during which the
                quartz crystal is shaped and tuned with precision. Because this
                process combines technical control with hands-on craftsmanship,
                subtle variations arise naturally in each bowl&apos;s tone,
                surface, and form.{" "}
                <span className="font-semibold">
                  No two bowls are exactly alike.
                </span>{" "}
                Each develops its own character through the process and the
                skilled hands involved. The specialised production facility and
                experienced team ensure consistent quality, while their
                craftsmanship also makes it possible to customise bowls to suit
                individual preferences or professional needs.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                Designed to be both a sound healing instrument and a mindful
                companion, our crystal bowls are created to support personal
                practice, group sessions, or quiet moments of reflection.
              </p>
            </div>
          </div>

          {/* Right Side - Two Stacked Images */}
          <div className="relative w-full flex flex-col gap-4 sm:gap-6 md-[75px] lg:mt-[85px]">
            {/* First Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:ml-auto lg:mr-0 group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src="/assets/images/about/IMG_6097.jpeg"
                  alt="Crystal bowl production process"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
            {/* Second Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:ml-auto lg:mr-0 group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src="/assets/images/about/s-l1600 (1) 2.jpeg"
                  alt="Pure quartz crystal material"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col mt-[25px] ml-[45px]">
          <div className="flex w-full  justify-start ">
            <h1 className="font-seasons text-[16px] sm:text-[18px] md:text-[30px] lg:text-[32px] text-[#e6b884] font-normal text-left leading-none ">
              What makes our Singing Bowls unique
            </h1>
          </div>
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-[25px]">
            {Icons.map((item) => (
              <Link
                key={item.id}
                href="/shop"
                className="flex text-black flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative mb-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="leading-snug">
                  <p className="font-seasons text-center font-normal text-[16px] md:text-[18px] pb-2 text-[#1c3163]">
                    {item.title}
                  </p>
                  <p className="text-center text-[12px] sm:text-[13px] md:text-[16px] font-light leading-relaxed font-touvlo text-[#545454]">
                    {item.para}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          {/* Left Side - Two Stacked Images */}
          <div className="relative w-full flex flex-col gap-4 sm:gap-6 mt-[40px] lg:mt-[40px]">
            {/* First Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:mx-0 group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src="/assets/images/about/0A262EFA-9BED-4990-9C85-E0A80F1AD829_1_105_c.jpeg"
                  alt="Crystal singing bowls collection"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
            {/* Second Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto group">
              <div className="relative w-[350] overflow-hidden shadow-lg max-h-[350px] lg:max-h-[400px]">
                <ImageWithShimmer
                  src="/assets/images/about/97FA431C-FA5F-4E86-B42D-2CD52185DB1B_1_105_c.jpeg"
                  alt="Crystal singing bowls with mallet"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="">
            <h2 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Sound Healing
            </h2>

            <div className="text-[#545454] mt-[25px]">
              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left">
                Sound Healing refers to a range of practices that use sound and
                vibration to support relaxation, focus, and overall well-being.
                These practices may include sound baths, sound meditation, and
                vibroacoustic therapy, and music-based mindfulness, using
                instruments such as singing bowls, gongs, tuning forks, and
                bells.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                From a scientific perspective, Sound Healing is often discussed
                in relation to its effects on the nervous system and stress
                regulation.{" "}
                <span className="font-semibold">
                  Research in psychology and neuroscience shows that long,
                  sustained, continuous sounds can help activate the
                  parasympathetic nervous system, which is the part of the
                  nervous system responsible for rest, recovery, and regulation.
                </span>
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Beyond these physiological effects, sound-based practices are
                also closely linked to mindfulness. The sound waves provides a
                simple, non-verbal focal point for attention, helping to reduce
                mental distractions and support present-moment awareness.{" "}
                <span className="font-semibold">
                  Research on music and sound-based interventions has reported
                  associations with reduced stress, improved mood, and greater
                  emotional regulation.
                </span>
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                In addition, vibration also plays an important role in many
                sound healing approaches. Lower-frequency sound waves can be
                felt physically and heard, particularly when instruments such as
                singing bowls are played nearby. Studies of Sound Meditation and
                Sound Bath experiences have observed changes in breathing
                patterns, heart rate, and tension, all commonly associated with
                relaxation responses.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Sound Healing is best understood as a complementary practice,
                supporting well-being alongside meditation, movement, and
                therapeutic care. At Crystal Bowl Studio, we approach Sound
                Healing with this understanding, designing bowls that offer
                clear, sustained sound and gentle vibration to support
                listening, presence, and restorative calm in everyday modern
                life.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Our Founder Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px] ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="">
            <h2 className="font-seasons text-[#D5B584] text-[16px] sm:text-[14px] md:text-[30px] lg:text-[32px] font-normal leading-tight">
              About Our Founder
            </h2>

            <div className="space-y-4 text-black mt-[25px]">
              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Crystal Bowl Studio was founded by Francesca Wong, whose work
                brings together international business experience and
                long-standing practice in Yoga and Sound Healing.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Before establishing Crystal Bowl Studio, Francesca spent over a
                decade working across global finance, e-commerce, and luxury
                beauty, with experience at KPMG, Citibank, Alibaba, and Estée
                Lauder. While these international environments shaped her
                understanding of structure, quality, design, and consumer
                experience, she was drawn towards a more grounded and meaningful
                way of service.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Her journey into Yoga and Sound began in 2011 and gradually
                deepened through years of study, practice, and teaching.
                Francesca trained extensively in India and Australia, spending
                over a year living and studying in Indian ashrams, in Rishikesh,
                Dharamshala, Bangalore, Delhi, and Varanasi.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Her approach is informed by classical yoga philosophy as well as
                broader healing traditions such as Ayurveda and Traditional
                Chinese Medicine. Rather than treating these systems as fixed
                doctrines, she approaches them as practical frameworks that
                support awareness, presence, and balance in everyday life.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Francesca&apos;s experience in consumer-facing industries
                reflects the way Crystal Bowl Studio approaches its products,
                the integration of craftsmanship, practicality and usability,
                creating sound healing instruments that are refined,
                approachable. The Studio was created with the aim of making
                Sound Healing practical and accessible to support and enhance
                modern life and The Vision:
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-center">
                <span className="font-semibold">
                  &quot;To make Sound Healing accessible, anywhere and
                  anytime.&quot;
                </span>
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full flex justify-center lg:justify-end pt-6 sm:pt-8 md:pt-12 lg:pt-16">
            <div className="relative w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[400px] group">
              {/* Background Image - Rotated with FooterIcon3 */}
              <div className="absolute top-1/2 left-1/2 w-[170%] h-[170%] -translate-x-[50%] -translate-y-1/2 rotate-90 group-hover:rotate-60 transition-transform duration-300 ease-out z-0 mt-10">
                <Image
                  src={FooterIcon3}
                  alt="Background decoration"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Main Image */}
              <div className="relative w-full aspect-[2/3] max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[400px] rounded-[12px] sm:rounded-[15px] md:rounded-[18px] lg:rounded-[20px] overflow-hidden z-10">
                <ImageWithShimmer
                  src="/assets/images/about/EF61277E-CA8A-456C-A0F2-5B74558B59A8_1_201_a.jpeg"
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
