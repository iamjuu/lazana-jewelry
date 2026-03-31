"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import {
  PremiumQuality,
  UniqueToYou,
  Crystal,
  Intention,
  jewleries1,
  jewleries2,
} from "@/public/assets";

const AboutPage = () => {
  const Icons = [
    {
      id: 1,
      image: PremiumQuality,
      title: "Premium Craftsmanship",
      para: "Each piece is finished with care using quality materials and thoughtful details you can see and feel.",
    },
    {
      id: 2,
      image: UniqueToYou,
      title: "Light Weight",
      para: "Designed for everyday wear, layering, and ease so your jewelry feels natural from morning to night.",
    },
    {
      id: 3,
      image: Crystal,
      title: "Made for You",
      para: "Versatile silhouettes, wearable proportions, and styling that feels personal rather than overworked.",
    },
    {
      id: 4,
      image: Intention,
      title: "With Intention",
      para: "Every collection is curated with longevity in mind so your pieces stay relevant beyond a single season.",
    },
  ];

  return (
    <div className=" bg-white min-h-screen overflow-x-hidden">
      <div>
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          <div className="">
            <h2 className="font-seasons text-[#000000] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Lazana Jewelry
            </h2>

            <div className=" text-[#545454] mt-[25px]">
              <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] leading-relaxed text-[#545454] text-left">
                Lazana Jewelry is a modern jewelry brand focused on timeless
                design, quality materials, and pieces you can wear every day.
                Our collections are curated to feel personal, versatile, and
                easy to style, whether you are building a capsule wardrobe or
                looking for a statement piece.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Each piece is designed with attention to comfort, finish, and
                how it layers with the rest of your collection. We believe
                jewelry should feel effortless, beautiful on its own and even
                better when mixed and matched.
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-left mt-4">
                At Lazana Jewelry, we work with trusted makers and materials so
                you can shop with confidence. Product pages list metals,
                finishes, and care notes because details matter when you wear
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

          <div className="relative w-full flex flex-col gap-4 sm:gap-6 md-[75px] lg:mt-[85px]">
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:ml-auto lg:mr-0 group">
              <div className="relative w-full aspect-[5/4] overflow-hidden shadow-lg">
                <Image
                  src={jewleries2}
                  alt="Lazana Jewelry craftsmanship"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
        
          </div>
        </div>

        {/* <div className="w-full flex flex-col py-16 mt-[25px]">
          <div className=" pl:0 lg:pl-10">
            <div className="flex w-full  justify-start ">
              <h1 className="font-seasons text-[#000000] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none ">
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
        </div> */}
      </div>

      <div className="max-w-7xl py-12 mx-auto px-4 sm:px-6 mt-[25px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          <div className="relative w-full flex flex-col justify-center items-center gap-4 sm:gap-6  lg:mt-[40px] order-2 lg:order-1">
            <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] mx-auto lg:mx-0 group">
              <div className="relative w-full aspect-[5/4] overflow-hidden shadow-lg">
                <Image
                  src={jewleries2}
                  alt="Lazana Jewelry collection"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  priority
                />
              </div>
            </div>
    
          </div>

          <div className="order-1   lg:order-2">
            <h2 className="font-seasons text-[#000000] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              Craft & intention
            </h2>

            <div className="text-[#545454] mt-[25px]">
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left">
                Lazana Jewelry brings together thoughtful design, quality
                materials, and a calm, welcoming experience, whether you are
                shopping online or visiting for a private styling session.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Our point of view is simple: jewelry should not just look good
                in a product photo, it should feel right when worn. We care
                about scale, balance, finish, and how pieces move with real
                wardrobes and real routines.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                We focus on finishes that wear well, silhouettes that layer
                easily, and details you notice up close. If you are unsure
                where to start, our team can help you explore metals, stones,
                and proportions that suit your style and lifestyle.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                Meaningful style choices can be small, like the necklace you
                reach for every day or the ring you never want to take off. At
                Lazana Jewelry, we care how pieces feel on the body and how
                they fit into real life.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#545454] text-left mt-4">
                If you need help choosing, our appointments page makes it easy
                to book a discovery call, arrange a studio visit, or speak with
                us about gifting.
              </p>

              <Link
                href="/book-a-session"
                className="inline-flex mt-4 font-seasons text-[#1C3163] hover:opacity-80 transition-opacity"
              >
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 mt-[25px] ">
        <div className="grid grid-cols-1  gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="">
            <h2 className="font-seasons text-[#000000] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
              About Our Founder
            </h2>

            <div className="space-y-4 text-black mt-[25px]">
              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Lazana Jewelry was founded by Francesca Wong, whose experience
                spans global finance, e-commerce, luxury beauty, and
                customer-facing brand building.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Before establishing Lazana Jewelry, Francesca spent over a
                decade working across KPMG, Citibank, Alibaba, and Estee
                Lauder. These environments shaped her understanding of
                structure, quality, design, and consumer experience.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Over time, she developed a clearer point of view around what
                modern customers want from jewelry: pieces that feel refined,
                wearable, and intentionally made rather than overly
                trend-driven.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Her approach combines a luxury eye for detail with a practical
                understanding of how women shop, style, and live. The result is
                a brand built around elegance, versatility, and ease.
              </p>

              <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed font-[300] text-[#545454]">
                Francesca&apos;s experience in consumer-facing industries reflects
                the way Lazana Jewelry approaches its products: craftsmanship,
                practicality, and wearability, creating jewelry that feels
                refined and approachable. The brand was created to make quality
                design more accessible, and <b>The Vision:</b>
              </p>

              <p className="font-touvlo text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed font-[300] text-[#545454] text-center">
                <span className="font-semibold">
                  &quot;To make beautiful jewelry accessible, anywhere and
                  anytime.&quot;
                </span>
              </p>
            </div>
          </div>

      
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
