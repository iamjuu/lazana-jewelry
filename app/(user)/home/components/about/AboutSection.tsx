import React from "react";
import Image from "next/image";
import { AboutSection, AboutSection1, ServiceImage1, ServiceImage2, ServiceImage3 } from "@/public/assets";
import { ArrowRight } from "lucide-react";

const AboutSectionComponent = () => {
  return (
    <section className="w-full  px-4 md:px-0 py-[68px]">
      <div className="max-w-6xl mx-auto">
  
        <div className="flex   flex-col w-full">
          {/* Section Title */}
          <h2 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-6 text-[#D5B584] font-normal">
            About
          </h2>

          {/* Content Container */}
          <div className="flex  flex-col lg:flex-row w-full gap-8 md:gap-10 lg:gap-12">
            {/* Left side - Text Content */}
            <div className="w-full lg:w-[65%] xl:w-[60%]">
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#6B5D4F] leading-relaxed sm:leading-relaxed md:leading-loose">
                <p>
                  Crystal Bowl Studio is created and designed by master sound
                  and energy healer Francesca Wong, fulfilling her dream to
                  create a range of crystal bowls that are beautifully designed,
                  with premium crystal quality and sound, with a powerful
                  resonance and energy, at a more affordable price to make sound
                  healing more accessible to healers all over the world.
                </p>

                <p>
                  Our Crystal Bowls are 100% clear quartz crystal, with some of
                  our premium designs infused with other crystals, metals and
                  earth elements. They are lightweight and come in the most
                  magical designs and colors to really make your practice
                  unique. Take them with you on your Travels!
                </p>

                <p>
                  Each bowl carries its own unique energy and intention so you
                  can choose yours to match your own unique intentions, energy
                  and aesthetic as a healer.
                </p>
              </div>
            </div>

            {/* Right side - Abstract Graphics */}
            <div className="relative w-full lg:w-[35%] xl:w-[40%] flex flex-row sm:flex-row  gap-2 ">
              <div className=" lg:max-w-none">
                <Image
                  src={ServiceImage1}
                  alt="about"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className=" lg:max-w-none">
                <Image
                  src={ServiceImage3}
                  alt="about"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
          <div className="">
            {/* Read More Link */}
            <div className="flex pt-6 sm:pt-7 md:pt-8 lg:pt-9 items-center">
              <a
                href="/about"
                className="inline-flex text-[#D5B584] items-center gap-2 text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-medium hover:opacity-80 transition-opacity"
              >
                Read More
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#D5B584]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionComponent;
