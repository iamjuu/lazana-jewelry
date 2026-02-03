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
    para: "Each piece is precision-crafted, made from 100% pure clear quartz, our bowls produce quality sound and long-lasting resonance."
  },

  {
    id: 2,
    image: UniqueToYou,
    title: "Light Weight",
    para: "Our bowls are light, durable, designed for travel-ready, portable anywhere, anytime in our protective cases"
  },

  {
    id: 3,
    image: Crystal,
    title: "Made for You",
    para: "Each bowl is unique and can be customised by chakra, note, frequency, colour, and design to make it uniquely yours."
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
    <section className="w-full py-[40px] md:py-[0px] ">


      <div className="max-w-6xl  py-10 gap-[25px] md:py-0 items-center flex  flex-col mx-auto px-4 mt-[25px]">
        <div className=''>
          <h1 className="font-seasons text-[24px] sm:text-[28px] md:text-[30px] lg:text-[30px] xl:text-[32px]  text-[#e6b884] font-normal  ">
            Stressed or overwhelmed, but no time?
          </h1>
          <p className="mt-[25px] font-touvlo text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose"> Let Crystal Sound clear your mind in 1 minute. </p>
        </div>
        <div>

          <h1 className="font-seasons text-[24px] sm:text-[28px] md:text-[30px] lg:text-[30px] xl:text-[32px]  text-[#e6b884] font-normal ">
            We make Crystal Singing Bowls for Sound Healing & Meditation</h1>
          <p className="font-touvlo text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose mt-[25px]">Thoughtfully crafted Crystal Singing Bowls for clarity, relaxation, and modern mindful living.
            <br />
            Made from 99.9% pure clear quartz crystal.
            <br />
            Lightweight, travel-friendly, and designed for everyday use.
          </p>
        </div>

      </div>
  
    </section>
  );
};

export default CollectionSection;
