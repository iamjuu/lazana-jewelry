import React from 'react';
import Link from "next/link";
import Image from 'next/image';
import { ArrowRight } from "lucide-react";
import { PremiumQuality, UniqueToYou, LightWeight, Intention, NewBowl, Crystal } from "@/public/assets";

type Category = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isFeatured?: boolean;
};

interface CollectionSectionProps {
  categories: Category[];
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
// Helper to convert base64 string to data URL if needed
const normalizeImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:image")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `data:image/jpeg;base64,${url}`;
};

const CollectionSection: React.FC<CollectionSectionProps> = ({ categories, loading }) => {
  return (
    <section className="w-full py-[40px] md:py-[10px] ">


<div className="max-w-6xl items-center flex  flex-col mx-auto px-4">
<div>
          <h1  className='text-[24px] sm:text-[28px] md:text-[36px] lg:text-[32px] xl:text-[32px] pb-4 sm:pb-5 md:pb-0 text-[#e6b884] font-normal'> 
            Stressed or overwhelmed, but no time?
          </h1>
          <p className='text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose'> Let Crystal Sound clear your mind in 1 minute. </p>
        </div>
        <div>
        <h1  className='text-[24px] sm:text-[28px] md:text-[36px] lg:text-[32px] xl:text-[32px] pb-4 sm:pb-5 md:pb-0 text-[#e6b884] font-normal'> 
        We make Crystal Singing Bowls for Sound Healing & Meditation</h1>
          <p className='text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px] font-light text-[#545454] leading-relaxed sm:leading-relaxed  text-center md:leading-loose'>Thoughtfully crafted Crystal Singing Bowls for clarity, relaxation, and modern mindful living.
            <br />
            Made from 99.9% pure clear quartz crystal.
            <br />
            Lightweight, travel-friendly, and designed for everyday use.
          </p>
        </div>

      </div>
      <div className="max-w-6xl items-center flex flex-col mx-auto px-4">
        <div className="flex w-full items-center justify-between mb-8 md:mb-0">
          <h2 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-6 text-[#e6b884]  font-normal">
            Shop Collection          </h2>
          <Link
            href="/shop?category=all"
            className="text-[#1C3163] flex gap-2 text-[14px] sm:text-[16px] md:text-[18px]"
          >
            View All
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#1C3163]" />
          </Link>
        </div>
        <div className="flex flex-col gap-12 md:gap-16 lg:gap-[80px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-[18px] w-full">
            {loading ? (
              <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12 text-[#1C3163]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#D5B584] mx-auto mb-4"></div>
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12 text-[#1C3163]">
                <p>No featured categories available</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="text-black group">
                  <Link href={`/shop?category=${category.slug}`}>
                    <div className="relative w-full aspect-square group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                      {category.imageUrl ? (
                        <Image
                          src={normalizeImageUrl(category.imageUrl)}
                          alt={category.name}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#D5B584] to-[#FEC1A2] flex items-center justify-center">
                          <p className="text-white text-lg font-semibold">{category.name}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="leading-5">
                    <p className="pt-4 sm:pt-6 md:pt-[28px] text-center text-[14px] sm:text-[16px] md:text-[18px]">
                      {category.name}
                    </p>

                  </div>
                </div>
              ))
            )}
          </div>

          <div className="w-full pt-12 md:pt-16 lg:pt-[80px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 lg:gap-[54px] border-t border-black">
            {Icons.map((item) => (
              <Link
                key={item.id}
                href="/shop"
                className="flex text-black flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="leading-5">
                  <p className="pt-4 sm:pt-6 md:pt-[28px] text-center font-normal text-[14px] sm:text-[16px] md:text-[18px] pb-4 sm:pb-6 md:pb-8">
                    {item.title}
                  </p>
                  <p className="text-center text-[9px] sm:text-[9.5px] md:text-[16px] font-light leading-[14px] sm:leading-[15px] md:leading-[22px]">
                    {item.para}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionSection;
