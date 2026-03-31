"use client";

import {
  FooterIcon1,
  FooterIcon2,
  FooterIcon3,
  WhatsAppIcon,
  InstagramIcon,
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
        toast.success(
          data.message || "Successfully subscribed to our newsletter!",
        );
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
    <section className="w-full  z-[-9999px] py-[40px] md:py-[8px] text-touvlo mt-[35px] overflow-x-hidden">
      <div className="max-w-6xl border-b pb-[64px] border-black items-stretch flex flex-col md:flex-row justify-between mx-auto px-4 gap-6 md:gap-2 min-w-0">
        <div className="hidden md:flex items-start h-full">
          <Image
            src={FooterIcon1}
            alt="footer icon"
            className="w-[60px] lg:w-auto"
          />
        </div>

        <div className="flex flex-col gap-8 md:gap-[64px] items-center text-center ">
          <h3 className="font-seasons text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] pb-4 sm:pb-5 md:pb-[0px] text-[#1c3163] ">
            Ready To Find Your
            <br className="hidden sm:block" /> Next Signature Piece?
          </h3>

          <div className="w-full max-w-[560px] flex flex-col gap-3 sm:gap-4">
            {/* Row 1 */}
            <div className="font-touvlo grid items-center grid-cols-[1fr_auto] gap-3 sm:gap-4">
              <Link
                href="/shop"
                className="font-touvlo w-full bg-white text-[#1C3163] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left text-[14px] sm:text-[16px] md:text-[18px] hover:bg-white/90 transition-colors"
              >
                Shop Lazana Jewelry
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
              Be the first to know about new arrivals, limited drops, styling
              notes, and special offers.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="w-full max-w-[500px] flex flex-col sm:flex-row gap-3 sm:gap-0"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 bg-white border border-[#000000]/30 rounded-xl sm:rounded-l-xl sm:rounded-r-none text-[#1C3163] placeholder:text-gray-400 focus:outline-none focus:border-[#000000] transition-colors text-[14px] sm:text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[#e8d4b8] text-[#000000] rounded-xl sm:rounded-l-none sm:rounded-r-xl font-medium uppercase tracking-wide hover:bg-[#e0c9a8] transition-colors text-[13px] sm:text-[14px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <div className="max-w-6xl flex flex-col md:flex-row py-[0px] mx-auto px-4 gap-8 md:gap-0 relative">
          <div className="w-full md:w-[30%] flex justify-center items-center md:justify-start absolute inset-0 opacity-30 md:opacity-100 md:relative md:inset-auto z-0 md:z-auto md:pointer-events-none">
            <Image
              src={FooterIcon3}
              alt="footer icon"
              className="w-[180px] sm:w-[220px] md:w-auto"
            />
          </div>

          <div className="w-full md:w-[70%] font-montserrat font-[200] text-[14px] md:text-[16px] relative z-10 md:z-auto min-w-0 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-4 min-w-0">
              <div className="min-w-0">
                <ul className="space-y-2 min-w-0">
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
                 
                  {/* <li>
                    <Link
                      href="/faq"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      FAQs
                    </Link>
                  </li> */}
                </ul>
              </div>
              <div className="min-w-0">
                <ul className="space-y-2 min-w-0">
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
                      href="/blog"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Blog
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      href="/book-a-session"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Book a Styling Call
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      href="/shipping-and-delivery"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Shipping & Delivery
                    </Link>
                  </li> */}
                  {/* <li>
                    <Link
                      href="/returns-and-refund-policy"
                      className="text-touvlo hover:text-[black] transition-colors text-[#545454] "
                    >
                      Returns & Refund Policy
                    </Link>
                  </li> */}
                </ul>
              </div>
              <div className="min-w-0 overflow-hidden sm:overflow-visible">
                <ul className="space-y-2 min-w-0">
                  <li>
                    <span className="text-touvlo text-[#545454] block">
                      Based in Singapore
                    </span>
                  </li>
                  <li className="min-w-0 max-w-[15rem] sm:max-w-[15rem] md:max-w-none">
                    <a
                      href="mailto:lazanajewels@gmail.com"
                      className="text-[#545454] hover:text-[black] transition-colors text-touvlo block w-full min-w-0 whitespace-normal break-all sm:break-words lg:whitespace-nowrap"
                    >
                      lazanajewels@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full font-touvlo min-w-0">
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-6 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 min-w-0">
              {/* Left Section - Social Icons and Text */}
              <div className="flex flex-col gap-4 min-w-0 flex-1 sm:flex-initial">
                {/* Social Media Icons */}
                <div className="flex gap-3">
                  <a
                    href="https://instagram.com/lazana.jewelry"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    href="https://api.whatsapp.com/send?phone=918089844007&text=അജു ഒരു കില്ലാഡി തന്നെ 😹"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <Image
                      src={WhatsAppIcon}
                      alt="WhatsApp"
                      className="w-5 h-5 brightness-0"
                    />
                  </a>
                  {/* <a
                    href="https://www.linkedin.com/in/francesca-wong-17506a58?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-12 rounded-full border border-black flex items-center justify-center hover:bg-black/10 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Image
                      src={LinkedIcon}
                      alt="LinkedIn"
                      className="w-5 h-5 brightness-0"
                    />
                  </a> */}
                </div>

                {/* Copyright and Links */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-black/80 text-[12px] sm:text-[14px] font-light min-w-0 flex-wrap">
                  <p className="min-w-0 shrink-0">
                    (c) {new Date().getFullYear()} Copyright
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Link
                      href="/terms-and-conditions"
                      className="hover:text-[black] transition-colors"
                    >
                      Terms & Conditions
                    </Link>
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
