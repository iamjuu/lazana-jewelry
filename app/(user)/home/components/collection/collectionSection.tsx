import React from 'react';
import Link from "next/link";
import Image from 'next/image';
import { PremiumQuality, UniqueToYou, Intention, Crystal } from "@/public/assets";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

interface CollectionSectionProps {
  categories?: unknown[];
  loading?: boolean;
}

const Icons = [
  {
    id: 1,
    image: PremiumQuality,
    title: " Premium Craftsmanship",
    para: "Each piece is finished with care—quality materials and details you can see and feel."
  },

  {
    id: 2,
    image: UniqueToYou,
    title: "Light Weight",
    para: "Lightweight designs made for everyday wear—easy to layer and take with you."
  },

  {
    id: 3,
    image: Crystal,
    title: "Made for You",
    para: "Each piece feels unique—choose finishes and styles that feel like you."
  },
  {
    id: 4,
    image: Intention,
    title: "With Intention",
    para: "Each Bowl is precisely tuned, intentionally crafted with it’s own energy, so you can match with your unique energy and purpose. "
  }
];

const CollectionSection: React.FC<CollectionSectionProps> = () => {
  return (
    <section className="w-full z-0 py-[20px] md:py-[0px] ">


      <div className="max-w-6xl   gap-[25px] md:py-0 items-center flex  flex-col mx-auto px-4  mt-[12px]  md:mt-[25px]">
        <div className=''>
          <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            Stressed or overwhelmed, but no time?
          </h1>
          <p className="mt-[25px] font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose"> Discover Lazana Jewelry—curated for you. </p>
        </div>
        <div>

          <h1 className="font-seasons text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal leading-none">
            We curate Lazana Jewelry for every occasion</h1>
          <p className="font-touvlo sm:text-[15px]  text-[14px]  md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose mt-[25px]">Thoughtfully curated Lazana Jewelry for clarity, confidence, and modern living.
            <br />
            Crafted with quality materials and timeless design.
            <br />
            Lightweight, travel-friendly, and designed for everyday use.
          </p>
        </div>

      </div>
  
    </section>
  );
};

export default CollectionSection;
