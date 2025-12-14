import React from 'react';
import Link from "next/link";
import Image from 'next/image';
import { ArrowRight } from "lucide-react";
import { PremiumQuality, UniqueToYou, LightWeight, Intention } from "@/public/assets";

type Product = {
  _id: string;
  name: string;
  price: number;
  createdAt: string;
  description?: string;
  imageUrl?: string[];
  videoUrl?: string;
};

interface CollectionSectionProps {
  products: Product[];
}

const Icons = [
  {
    id: 1,
    image: PremiumQuality,
    title: "Exquisite Purity",
    para: "Each bowl is masterfully created from 99.9% pure clear quartz, harmonised with rare crystals and precious elements. This fusion produces a sound of remarkable depth and celestial resonance, inviting you into a higher realm of healing."
  },

  {
    id: 2,
    image: UniqueToYou,
    title: "Crafted for Your Soul",
    para: "No two bowls are ever the same. Every piece can be attuned to your chakra, note, frequency, and design, allowing you to summon the bowl that mirrors your inner essence—your true energetic signature."
  },

  {
    id: 3,
    image: LightWeight,
    title: "Gracefully Lightweight",
    para: "Elegant yet enduring, our bowls are crafted to be light in the hand and effortless to carry. Paired with our luxury protective cases, they become the perfect companion for healers who travel between worlds."
  },
  {
    id: 4,
    image: Intention,
    title: "Intention Woven Within",
    para: "Each bowl is imbued with its own sacred purpose and healing vibration, waiting to align with the energy of the healer who chooses it. These bowls do more than sound—they speak to your journey, your intention, your awakening."
  }
];
// Helper to convert base64 string to data URL if needed
const normalizeImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:image")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `data:image/jpeg;base64,${url}`;
};

const CollectionSection: React.FC<CollectionSectionProps> = ({ products }) => {
  return (
    <section className="w-full py-[40px] md:py-[68px] ">
      <div className="max-w-6xl items-center flex flex-col mx-auto px-4">
        <div className="flex w-full items-center justify-between mb-8 md:mb-0">
          <h2 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-6 text-[#D5B584] font-normal">
            Collections
          </h2>
          <Link
            href="/shop"
            className="text-[#D5B584] flex gap-2 text-[14px] sm:text-[16px] md:text-[18px]"
          >
            View All
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#D5B584]" />
          </Link>
        </div>
        <div className="flex flex-col gap-12 md:gap-16 lg:gap-[80px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-[18px] w-full">
            {products.map((item) => (
              <div key={item._id} className="text-black group">
                <Link href={`/shop/${item._id}`}>
                  <div className="relative w-full aspect-square group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                    <Image 
                      src={item.imageUrl?.[0] ? normalizeImageUrl(item.imageUrl[0]) : "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </Link>
                <div className="leading-5">
                  <p className="pt-4 sm:pt-6 md:pt-[28px] text-[14px] sm:text-[16px] md:text-[18px]">{item.name}</p>
                  {/* <p className="text-[12px] sm:text-[13px] md:text-[14px]">{item.description}</p> */}
                  <p className="pt-3 sm:pt-4 md:pt-[18px] text-[10px] sm:text-[11px] md:text-[12px]">₹{item.price}</p>
                </div>
              </div>
            ))}
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
                <p className="text-center text-[9px] sm:text-[9.5px] md:text-[10px] font-light leading-[14px] sm:leading-[15px] md:leading-[16px]">
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
