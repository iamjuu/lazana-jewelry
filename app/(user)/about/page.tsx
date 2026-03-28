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
      para: "Each piece is finished with care—quality materials and details you can see and feel.",
    },

    {
      id: 2,
      image: UniqueToYou,
      title: "Light Weight",
      para: "Lightweight designs made for everyday wear—easy to layer and take with you.",
    },

    {
      id: 3,
      image: Crystal,
      title: "Made for You",
      para: "Each piece feels unique—choose finishes and styles that feel like you.",
    },
    {
      id: 4,
      image: Intention,
      title: "With Intention",
      para: "Designed with intention—pieces that complement your personal style and story.",
    },
  ];

  return (
    <div className=" bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen overflow-x-hidden">
      <div>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          {/* Left Side - Content */}
          <div className="">
            <h2 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Lazana Jewelry
            </h2>

            <div className=" text-[#545454] mt-[25px]">
              <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] leading-relaxed text-[#545454] text-left">
                Lazana Jewelry is a modern jewelry brand focused on timeless
                design, quality materials, and pieces you can wear every day.
                Our collections are curated to feel personal, versatile, and
                easy to style—whether you are building a capsule wardrobe or
                looking for a statement piece.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Each piece is designed with attention to comfort, finish, and
                how it layers with the rest of your collection. We believe
                jewelry should feel effortless—beautiful on its own and even
                better when mixed and matched.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                At Lazana Jewelry, we work with trusted makers and materials
                so you can shop with confidence. Product pages list metals,
                stones, and care notes—because details matter when you wear
                something every day.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                Craftsmanship means small variations that make handmade and
                finished jewelry feel unique.{" "}
                <span className="font-semibold">
                  No two pieces are exactly alike.
                </span>
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                Whether you are shopping for yourself or gifting someone
                special, Lazana Jewelry is here to help you find pieces that
                feel right for your story.
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
                  alt="Lazana Jewelry craftsmanship"
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
                  alt="Materials and detail"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col mt-[25px]">
          <div className=" pl:0 lg:pl-10">
          <div className="flex w-full  justify-start ">
            <h1 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none ">
              What makes our jewelry unique
            </h1>
          </div>
         
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 lg:gap-[54px] mt-[25px] ">
            {Icons.map((item) => (
              <div
                key={item.id}
                className="flex text-black flex-col items-center  hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative ">
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
                  <p className="text-center text-[14px] sm:text-[15px] md:text-[16px] font-light  sm:leading-[15px] md:leading-[22px] font-touvlo text-[#545454] mt-[25px]">
                    {item.para}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          {/* Left Side - Two Stacked Images (order-2 on mobile so content shows first) */}
          <div className="relative w-full flex flex-col justify-center items-center gap-4 sm:gap-6  lg:mt-[40px] order-2 lg:order-1">
            {/* First Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:mx-0 group">
              <div className="relative w-full overflow-hidden shadow-lg">
                <ImageWithShimmer
                  src="/assets/images/about/0A262EFA-9BED-4990-9C85-E0A80F1AD829_1_105_c.jpeg"
                  alt="Lazana Jewelry collection"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
            {/* Second Image */}
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] flex  justify-center group">
              <div className="relative w-[350] overflow-hidden shadow-lg max-h-[350px] lg:max-h-[400px]">
                <ImageWithShimmer
                  src="/assets/images/about/97FA431C-FA5F-4E86-B42D-2CD52185DB1B_1_105_c.jpeg"
                  alt="Lazana Jewelry styling"
                  width={500}
                  height={400}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Side - Content (order-1 on mobile so it shows first) */}
          <div className="order-1 lg:order-2">
            <h2 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              Craft & intention
            </h2>

            <div className="text-[#545454] mt-[25px]">
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left">
                Lazana Jewelry brings together thoughtful design, quality
                materials, and a calm, welcoming experience—whether you are
                shopping online or visiting for a private styling session.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Our founder&apos;s background in yoga and mindfulness informs how
                we talk about jewelry: not as a trend, but as something you
                reach for when you want to feel grounded, confident, or simply
                more like yourself.{" "}
                <span className="font-semibold">
                  Research in consumer psychology often links self-expression and
                  ritual with mood and stress regulation—ideas we take seriously
                  when we design and curate each collection.
                </span>
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                We focus on finishes that wear well, silhouettes that layer
                easily, and details you notice up close. If you are unsure where
                to start, our team can help you explore metals, stones, and
                proportions that suit your style and lifestyle.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Meaningful rituals can be small—like choosing a necklace you
                wear every day. At Lazana Jewelry, we care how pieces feel on the
                body and how they fit into your real life.
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
            <h2 className="font-seasons text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Our Founder
            </h2>

            <div className="space-y-4 text-black mt-[25px]">
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Lazana Jewelry was founded by Francesca Wong, whose work
                brings together international business experience and
                long-standing practice in Yoga and Sound Healing.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Before establishing Lazana Jewelry, Francesca spent over a
                decade working across global finance, e-commerce, and luxury
                beauty, with experience at KPMG, Citibank, Alibaba, and Estée
                Lauder. These environments shaped her understanding of
                structure, quality, design, and consumer experience, while also
                leading her toward a more grounded and meaningful way of service
                - one that aligned more closely with her values and lived
                experience.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Her journey into Yoga and Sound began in 2011, and deepened
                through years of study, practice, and teaching. Francesca
                trained extensively in India and Australia, spending over a year
                living and studying in Indian ashrams, in Rishikesh,
                Dharamshala, Bangalore, Delhi, and Varanasi.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Her approach is informed by classical yoga philosophy as well as
                broader healing traditions such as Ayurveda and Traditional
                Chinese Medicine. Rather than treating these systems as fixed
                doctrines, she approaches them as practical frameworks that
                support awareness, presence, and balance in everyday life.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Francesca&apos;s experience in consumer-facing industries reflects
                the way Lazana Jewelry approaches its products: craftsmanship,
                practicality, and wearability—creating jewelry that feels refined
                and approachable. The brand was created to make quality design
                more accessible, and <b>The Vision:</b>
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-center">
                <span className="font-semibold">
                  &quot;To make beautiful jewelry accessible, anywhere and
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
                  src="/assets/images/about/frankielogo.png"
                  alt="Background decoration"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Main Image */}
              <div className="relative w-full aspect-[2/3] max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[400px] rounded-[12px] sm:rounded-[15px] md:rounded-[18px] lg:rounded-[20px] overflow-hidden z-10">
                <ImageWithShimmer
                  src="/assets/images/about/EF61277E-CA8A-456C-A0F2-5B74558B59A8_1_201_a.jpeg"
                  alt="Francesca Wong, founder of Lazana Jewelry"
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
