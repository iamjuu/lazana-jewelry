import React from "react";
import Image from "next/image";
import { jewleries1 } from "@/public/assets";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

const AboutSectionComponent = () => {
  return (
    <section className="w-full mt-[25px]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex   flex-col w-full ">
          <h2 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            Founder's Note
          </h2>

          <div className="flex  flex-col lg:flex-row w-full gap-8 md:gap-10 lg:gap-12 mt-[25px]">
            <div className="w-full lg:w-[65%] xl:w-[60%]">
              <div className="flex flex-col   text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-black leading-relaxed sm:leading-relaxed md:leading-loose">
                <p className="font-touvlo text-[#545454] text-[14px] sm:text-[15px] md:text-[16px]">
                  Welcome to Lazana Jewelry.
                </p>
                <p className="font-touvlo text-[#545454]  text-[14px] sm:text-[15px]  md:text-[16px]">
                  Lazana Jewelry was founded by Francesca Wong, whose
                  background spans KPMG, Citibank, Alibaba, and Estee Lauder.
                  After more than a decade in global finance, e-commerce, and
                  luxury beauty, she set out to build a jewelry brand shaped by
                  quality, clarity, and modern femininity.
                </p>

                <p
                  className="font-touvlo text-[#545454] text-center font-semibold mt-2 mb-2"
                  style={{ fontWeight: 600 }}
                >
                  "To create jewelry that feels effortless, elevated, and
                  personal."
                </p>

                <p className="font-touvlo  text-[14px] sm:text-[15px] md:text-[16px] text-[#545454]">
                  Lazana Jewelry was born from the belief that everyday pieces
                  should be beautifully made, easy to wear, and expressive
                  without feeling overdone. Each design is chosen with
                  attention to finish, comfort, proportion, and the way it
                  layers into real life. This is jewelry made to feel polished,
                  versatile, and distinctly yours.
                </p>

                <p className="font-touvlo text-[#545454]">
                  May these pieces become part of your everyday story. -
                  Francesca
                </p>
                <a
                  href="/about"
                  className="font-seasons  inline-flex items-center gap-4 text-[14px] sm:text-[14px] md:text-[16px] lg:text-[16px] font-normal hover:opacity-80 transition-opacity text-[#1c3163] mt-[25px]"
                >
                  Read Our Story -&gt;
                </a>
              </div>
            </div>

            <div className="relative w-full lg:w-[35%] xl:w-[40%] flex flex-row sm:flex-row  gap-2 ">
              <div className="w-full h-full lg:max-w-none">
                <Image
                  src={jewleries1}
                  alt="about"
                  width={900}
                  height={1200}
                  className="w-full h-full max-h-[400px] lg:max-h-[500px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionComponent;
