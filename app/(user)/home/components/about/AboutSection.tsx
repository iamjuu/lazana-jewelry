import React from "react";
import Image from "next/image";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

// Use public/ asset path (recommended) so Next serves it correctly
const founderImageSrc = "/assets/images/about/founder.jpg";
const AboutSectionComponent = () => {
  return (
    <section className="w-full mt-[25px]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex   flex-col w-full ">
          {/* Section Title */}
          <h2 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            Founder's Note
          </h2>

          {/* Content Container */}
          <div className="flex  flex-col lg:flex-row w-full gap-8 md:gap-10 lg:gap-12 mt-[25px]">
            {/* Left side - Text Content */}
            <div className="w-full lg:w-[65%] xl:w-[60%]">
              <div className="flex flex-col   text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-black leading-relaxed sm:leading-relaxed md:leading-loose">
                <p className="font-touvlo text-[#545454] text-[14px] sm:text-[15px] md:text-[16px]">
                  Welcome to Lazana Jewelry.
                </p>
                <p className="font-touvlo text-[#545454]  text-[14px] sm:text-[15px]  md:text-[16px]">
                  Lazana Jewelry was founded by Francesca Wong, a former
                  Corporate Executive with experience at KPMG, Citibank,
                  Alibaba, and Estée Lauder. After over a decade in global
                  finance, e-commerce, and luxury beauty, she embarked on a
                  vision:
                </p>

                <p
                  className="font-touvlo text-[#545454] text-center font-semibold mt-2 mb-2"
                  style={{ fontWeight: 600 }}
                >
                  "To make Sound Healing accessible, anywhere and anytime."
                </p>

                <p className="font-touvlo  text-[14px] sm:text-[15px] md:text-[16px] text-[#545454]">
                  Her mission is to make the power of Sound Healing accessible
                  all over the world, anywhere anytime. Lazana Jewelry was
                  born from the belief that healing tools should be
                  well-crafted, intentional, and accessible. Each bowl is
                  designed to aesthetically sound exquisite, and feel purposeful
                  in the hands of the person using it. This work is an offering
                  to practitioners and seekers around the world, who wish to
                  experience and share the power of Sound Healing with ease,
                  simplicity, beauty, and integrity.
                </p>

                <p className="font-touvlo text-[#545454]">
                  May these bowls be a bridge to your best self. - Francesca
                </p>
                <a
                  href="/about"
                  className="font-seasons  inline-flex items-center gap-4 text-[14px] sm:text-[14px] md:text-[16px] lg:text-[16px] font-normal hover:opacity-80 transition-opacity text-[#1c3163] mt-[25px]"
                >
                  Read Our Story →
                </a>
              </div>
            </div>

            {/* Right side - Abstract Graphics */}
            <div className="relative w-full lg:w-[35%] xl:w-[40%] flex flex-row sm:flex-row  gap-2 ">
              <div className="w-full h-full lg:max-w-none">
                <Image
                  src={founderImageSrc}
                  alt="about"
                  width={900}
                  height={1200}
                  className="w-full h-full max-h-[400px] lg:max-h-[500px] object-contain"
                />
              </div>
              {/* <div className=" lg:max-w-none">
                <Image
                  src={AboutNew2}
                  alt="about"
                  className="w-full h-auto object-contain"
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionComponent;
