'use client'

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WhatsAppIconSvg } from "@/public/assets";

const WhatsAppFloating = () => {
  const pathname = usePathname();
  const whatsappNumber = "6596381988";
  const whatsappText = encodeURIComponent("Hi");
  const [isBouncing, setIsBouncing] = useState(false);

  // Don't show WhatsApp button on admin pages and auth pages
  const shouldHideWhatsApp = 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/login') || 
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/register');

  // If should hide, don't render anything
  if (shouldHideWhatsApp) {
    return null;
  }

  // Normalize the WhatsApp number to international format without '+' or leading zeros
  const getWhatsAppLink = () => {
    const digitsOnly = String(whatsappNumber)
      .replace(/\D/g, "")
      .replace(/^0+/, "");
    // Use the number as-is since it already includes country code (65 for Singapore)
    return `https://api.whatsapp.com/send?phone=${digitsOnly}&text=${whatsappText}`;
  };

  return (
    <a
      href={getWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed z-50 bottom-20 right-1 size-24 flex justify-end rounded-full p-4 transition-all duration-300 hover:scale-110 ${
        isBouncing ? "animate-bounce" : ""
      }`}
    >
      <Image src={WhatsAppIconSvg} alt="WhatsApp" width={100} /> 
    </a>
  );
};

export default WhatsAppFloating;

