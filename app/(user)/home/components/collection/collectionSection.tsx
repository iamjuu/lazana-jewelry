import React from "react";

// Fonts are now defined in globals.css as font-seasons and font-touvlo

interface CollectionSectionProps {
  categories?: unknown[];
  loading?: boolean;
}

const CollectionSection: React.FC<CollectionSectionProps> = () => {
  return (
    <section className="w-full z-0 py-[20px] md:py-[0px] ">
      <div className="max-w-6xl   gap-[25px] md:py-0 items-center flex  flex-col mx-auto px-4  mt-[12px]  md:mt-[25px]">
        <div className="">
          <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            Jewelry for real life, styled with ease
          </h1>
          <p className="mt-[25px] font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose">
            Discover Lazana Jewelry curated for daily wear, gifting, and
            standout occasions.
          </p>
        </div>
        <div>
          <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            We curate Lazana Jewelry for every occasion
          </h1>
          <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose mt-[25px]">
            Thoughtfully curated pieces for work, evenings out, travel, and
            meaningful gifting.
            <br />
            Crafted with quality materials and timeless design.
            <br />
            Lightweight, easy to layer, and designed for everyday use.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CollectionSection;
