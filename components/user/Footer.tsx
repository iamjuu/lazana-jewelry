"use client";

import {
  FooterIcon1,
  FooterIcon2,
  FooterIcon3,
  WhatsAppIcon,
  FacebookIcon,
  YouTubeIcon,
  InstagramIcon,
  LinkedIcon
} from "@/public/assets";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
// Fonts are now defined in globals.css as font-seasons and font-touvlo

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Successfully subscribed to our newsletter!");
        setEmail("");
      } else {
        toast.error(data.message || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-[40px] md:py-[8px] bg-gradient-to-b from-[#FEC1A2] to-[#FDECE2] text-touvlo">
      <div className="max-w-6xl border-b pb-[64px] border-black items-stretch flex flex-col md:flex-row justify-between mx-auto px-4 gap-6 md:gap-2 ">
        <div className="hidden md:flex items-start h-full">
          <Image
            src={FooterIcon1}
            alt="footer icon"
            className="w-[60px] lg:w-auto"
          />
        </div>

        <div className="flex flex-col gap-8 md:gap-[64px] items-center text-center ">
          <h3 className="font-seasons text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-[0px] text-[#1c3163] ">
            Ready To Begin Your
            <br className="hidden sm:block" /> Healing Journey?
          </h3>

          <div className="w-full max-w-[560px] flex flex-col gap-3 sm:gap-4">
            {/* Row 1 */}
            <div className="font-touvlo grid items-center grid-cols-[1fr_auto] gap-3 sm:gap-4">
              <Link
                href="/shop"
                className="font-touvlo w-full bg-white text-[#1C3163] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left text-[14px] sm:text-[16px] md:text-[18px] hover:bg-white/90 transition-colors"
              >
                Shop Crystal Bowls
              </Link>
              <Link
                href="/shop"
                className="size-[44px] sm:size-[52px] rounded-xl sm:rounded-2xl bg-white text-[#1C3163] flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                <ArrowRight
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  strokeWidth={1.5}
                />
              </Link>
            </div>

            {/* Row 2 */}
            <div className="grid items-center grid-cols-[1fr_auto] gap-3 sm:gap-4">
              <Link
                href="/book-a-session"
                className="font-touvlo w-full bg-white text-[#1C3163] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left text-[14px] sm:text-[16px] md:text-[18px] hover:bg-white/90 transition-colors"
              >
                Book a Call
              </Link>
              <Link
                href="/book-a-session"
                className="size-[44px] sm:size-[52px] rounded-xl sm:rounded-2xl bg-white text-[#1C3163] flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                <ArrowRight
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <Image
            src={FooterIcon2}
            alt="footer icon"
            className="w-[60px] lg:w-auto"
          />
        </div>
      </div>


<div>
<div className="max-w-6xl flex flex-col   md:flex-row py-[44px] mx-auto px-4 gap-8 md:gap-0">
<div className="w-full  flex flex-col items-center justify-center">
            <h2 className="font-seasons text-[#1c3163] font-[400] text-center text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] mb-3 sm:mb-4">
              Join our mailing list
            </h2>
            <p className="font-touvlo text-[#545454] text-center  text-[14px] sm:text-[15px] md:text-[16px] mb-6 sm:mb-8 max-w-[500px]">
              Be the first to know about special offers, new collections and stay up to date with all our magic!
            </p>
            <form onSubmit={handleSubscribe} className="w-full max-w-[500px] flex flex-col sm:flex-row gap-3 sm:gap-0">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 bg-white border border-[#d5b584]/30 rounded-xl sm:rounded-l-xl sm:rounded-r-none text-[#1C3163] placeholder:text-gray-400 focus:outline-none focus:border-[#d5b584] transition-colors text-[14px] sm:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[#e8d4b8] text-[#d5b584] rounded-xl sm:rounded-l-none sm:rounded-r-xl font-medium uppercase tracking-wide hover:bg-[#e0c9a8] transition-colors text-[13px] sm:text-[14px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>    
  </div>
</div>


      <div>
        <div className="max-w-6xl flex flex-col md:flex-row py-[0px] mx-auto px-4 gap-8 md:gap-0 relative">
          
          <div className="w-full md:w-[50%] flex justify-center items-center md:justify-start absolute inset-0 opacity-30 md:opacity-100 md:relative md:inset-auto z-0 md:z-auto md:pointer-events-none">
            <Image
              src={FooterIcon3}
              alt="footer icon"
              className="w-[180px] sm:w-[220px] md:w-auto"
            />
          </div>

 

          <div className="w-full md:w-[50%] font-montserrat font-[200] text-[14px] md:text-[16px] relative z-10 md:z-auto ">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-4">
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shop"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faq"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      FAQs
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/events"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Events
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/book-a-session"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Book a Call
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shipping-and-delivery"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/returns-and-refund-policy"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Returns & Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2">
                  <li>

                    
                    <span className="text-touvlo break-words text-[#545454] ">
                      Based in Singapore
                    </span>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@crystalbowlstudio.com"
                      className="text-[#545454] hover:text-[black] transition-colors text-touvlo"
                    >
                      hello@crystalbowlstudio.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>



        <div className="w-full font-touvlo ">
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              {/* Left Section - Social Icons and Text */}
              <div className="flex flex-col gap-4">
                {/* Social Media Icons */}
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label="Instagram"
                  >
                    <Image
                      src={InstagramIcon}
                      alt="Instagram"
                      className="w-5 h-5 brightness-0"
                    />
                  </a>
                  <a
                    href="#"
                    className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label="YouTube"
                  >
                    <Image
                      src={YouTubeIcon}
                      alt="YouTube"
                      className="w-5 h-5 brightness-0"
                    />
                  </a>
                  <a
                    href="#"
                    className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Image
                      src={LinkedIcon}
                      alt="LinkedIn"
                      className="w-5 h-5 brightness-0"
                    />
                  </a>
                </div>

                {/* Copyright and Links */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-black/80 text-[12px] sm:text-[14px] font-light">
                  <p>©{new Date().getFullYear()} — Copyright</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <a
                      href="#"
                      className="hover:text-[black] transition-colors"
                    >
                      Terms & Conditions
                    </a>
                    <a
                      href="#"
                      className="hover:text-[black] transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Section - Scroll to Top Button */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors self-end sm:self-auto"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-5 h-5 text-black" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Footer;
