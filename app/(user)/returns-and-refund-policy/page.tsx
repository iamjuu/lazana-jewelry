"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const ReturnsAndRefundPolicyPage = () => {
  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />

      <section className="w-full py-[40px] md:py-[68px]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-[#D5B584] text-[28px] sm:text-[32px] md:text-[40px] font-normal mb-4">
              Return & Refund Policy
            </h2>
          </div>

          {/* Content Sections */}
          <div className="flex flex-col gap-8 md:gap-12">
            {/* Custom-Made to Order */}
            <div className="space-y-4">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[28px] font-normal">
                Custom-Made to Order
              </h3>
              <div className="space-y-4 text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light leading-relaxed">
                <p>
                  All Crystal Bowl Studio bowls are custom made to order. Due to the unique and handcrafted nature of each piece, we do not offer returns, exchanges, or refunds under any circumstances, including change of mind.
                </p>
              </div>
            </div>

            {/* Order Cancellations */}
            <div className="space-y-4">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[28px] font-normal">
                Order Cancellations
              </h3>
              <div className="space-y-4 text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light leading-relaxed">
                <p>
                  Once an order is placed and confirmed, it immediately enters our production process.
                </p>
                <p>
                  As a result, orders cannot be canceled, changed, or refunded after confirmation.
                </p>
                <p>
                  In some circumstances, we may be able to offer modifications (such as changing the tuning system or note). However, this cannot be guaranteed once production has begun.
                </p>
                <p>
                  If you wish to request a modification, please contact us as soon as possible at:
                </p>
                <p>
                  📧 <a href="mailto:hello@crystalbowlstudio.com" className="text-[#1C3163] hover:underline">hello@crystalbowlstudio.com</a>
                </p>
                <p>
                  We will do our best to accommodate your request.
                </p>
              </div>
            </div>

            {/* Damaged or Defective Items */}
            <div className="space-y-4">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[28px] font-normal">
                Damaged or Defective Items
              </h3>
              <div className="space-y-4 text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light leading-relaxed">
                <p>
                  We take great care in packaging each bowl to ensure safe delivery. If your order arrives damaged or defective, please:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Contact us within 24 hours of delivery</li>
                  <li>Provide clear photos of the damage and the original packaging</li>
                  <li>Email your request to <a href="mailto:hello@crystalbowlstudio.com" className="text-[#1C3163] hover:underline">hello@crystalbowlstudio.com</a></li>
                </ul>
                <p>
                  We will assess the situation and work with you to resolve it appropriately.
                </p>
              </div>
            </div>

            {/* Need Help */}
            <div className="space-y-4">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[28px] font-normal">
                Need Help?
              </h3>
              <div className="space-y-4 text-[#1C3163] text-[14px] sm:text-[16px] md:text-[18px] font-light leading-relaxed">
                <p>
                  If you have any questions about your order, shipping, or this policy, please don&apos;t hesitate to contact us at:
                </p>
                <p>
                  📧 <a href="mailto:hello@crystalbowlstudio.com" className="text-[#1C3163] hover:underline">hello@crystalbowlstudio.com</a>
                </p>
                <p>
                  We&apos;re here to help and ensure your experience with Crystal Bowl Studio is a positive one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReturnsAndRefundPolicyPage;

