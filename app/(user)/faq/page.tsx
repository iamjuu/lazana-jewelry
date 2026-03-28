"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { Plus, Minus } from "lucide-react";
import Bowlsize from "@/public/assets/images/productdesc/bowlsize2.jpeg";

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(-1); // Third item open by default

  const faqs = [
    {
      id: 1,
      question: "What sizes do your pieces come in?",
      answer: (
        <>
          <p>
            Lazana Jewelry offers a range of sizes and fits across necklaces,
            rings, and bracelets. Need help choosing? Book a styling call{" "}
            <Link href="/discoveryappointment" className="text-[#1C3163] underline hover:opacity-80 transition-opacity">
              here
            </Link>
            .
          </p>
          <Image src={Bowlsize} alt="Sizing reference" className=" sm:w-[50%] md:w-[50%] h-auto mt-4 rounded-lg" />
        </>
      )
    },
    {
      id: 2,
      question: "What metals and finishes do you offer?",
      answer: "Materials vary by collection—see each product page for metal type, plating, and finish. Many pieces are designed to layer together so you can mix metals intentionally.",
    },
    {
      id: 3,
      question: "How do I care for my jewelry?",
      answer: "Store pieces separately, avoid harsh chemicals and prolonged water exposure, and polish with a soft cloth. Details are included with your order and on the product page.",
    },
    {
      id: 4,
      question: "Do you ship internationally?",
      answer: "Yes. Shipping options and timelines are shown at checkout. International orders may be subject to duties and taxes payable on delivery.",
    },
    {
      id: 5,
      question: "Can you help me choose a piece?",
      answer: (
        <>
          Of course! We&apos;re here to help you find Lazana Jewelry that fits your style. Reach out via our contact form, email, or book a discovery call{" "}
          <Link href="/discoveryappointment" className="text-[#1C3163] pl-2 underline hover:opacity-80 transition-opacity">
             here
          </Link>
          .
        </>
      )
    },
    {
      id: 6,
      question: "Can I request a custom or personalised piece?",
      answer: "Depending on the collection, customisation may be available. Leave a note at checkout or contact us with your request and we will confirm what is possible.",
    },
    {
      id: 7,
      question: "What are your pieces made from?",
      answer: "Each Lazana Jewelry listing describes the metals, stones, and materials used. We focus on quality craftsmanship and clear product information.",
    },
    {
      id: 8,
      question: "Do orders include packaging?",
      answer: "Yes. Pieces are packaged with care for safe delivery. Gift-friendly packaging may be available—ask our team if you need something special.",
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />

      <section className="w-full mt-[25px]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-[6px] items-start">
            <h2 className="text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] font-normal font-seasons leading-none">
              FAQs
            </h2>
            {/* <p className="text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light max-w-md">
              Lorem ipsum dolor sit amet consectetur. Vitae eu venenatis amet hendrerit elementum arcu tempor nisl.
            </p> */}
          </div>

          {/* FAQ Items */}
          <div className="flex flex-col gap-0">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              
              return (
                <div key={faq.id} className="border-b border-[#1C3163]/20 last:border-b-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full py-6 md:py-8 flex items-center justify-between gap-4 text-left hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-[#1C3163] text-[19px]  font-normal flex-1 font-seasons">
                      {faq.question}
                    </h3>
                    <div className="shrink-0">
                      {isOpen ? (
                        <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-[#1C3163]" strokeWidth={1.5} />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#1C3163]" strokeWidth={1.5} />
                      )}
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="pb-6 md:pb-8 animate-fadeIn">
                      <div className="text-[#545454] text-[14px] font-light leading-relaxed pr-12 sm:pr-16 font-touvlo">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;

