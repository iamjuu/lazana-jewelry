"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const ReturnsAndRefundPolicyPage = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="w-full mt-[25px]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="font-seasons">
            <h2 className="text-[#000000] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal ">
              Return & Refund Policy
            </h2>
          </div>

          <div className="flex flex-col gap-[1px]">
            <div className="mt-[25px]">
              <h3 className="text-[#1C3163] text-[16px] sm:text-[19px] md:text-[19px] font-normal font-seasons">
                Made to Order & Limited Pieces
              </h3>
              <div className="text-[#5A5A5A] text-[14px] sm:text-[16px] md:text-[14px] font-light leading-relaxed font-touvlo">
                <p>
                  Many Lazana Jewelry pieces are made to order or prepared in
                  limited quantities. Due to the handcrafted and small-batch
                  nature of our products, we do not offer returns, exchanges,
                  or refunds for change of mind.
                </p>
              </div>
            </div>

            <div className="mt-[25px]">
              <h3 className="text-[#1C3163] text-[16px] sm:text-[19px] md:text-[19px] font-normal font-seasons">
                Order Cancellations
              </h3>
              <div className=" text-[#5A5A5A] text-[14px] sm:text-[16px] md:text-[14px] font-light leading-relaxed font-touvlo">
                <p>
                  Once an order is placed and confirmed, it enters our
                  processing workflow immediately.
                </p>
                <p>
                  As a result, orders cannot be canceled, changed, or refunded
                  after confirmation.
                </p>
                <p>
                  In some circumstances, we may be able to accommodate small
                  adjustments such as size, finish, or delivery notes before
                  processing begins. This cannot be guaranteed once production
                  or packing has started.
                </p>
                <p>
                  If you wish to request a modification, please contact us as
                  soon as possible at:
                </p>
                <p>
                  <a
                    href="mailto:hello@lazana-jewelry.com"
                    className="text-[#1C3163] hover:underline"
                  >
                    hello@lazana-jewelry.com
                  </a>
                </p>
                <p>We will do our best to accommodate your request.</p>
              </div>
            </div>

            <div className="mt-[25px]">
              <h3 className="text-[#1C3163] text-[16px] sm:text-[19px] md:text-[19px] font-normal font-seasons">
                Damaged or Defective Items
              </h3>
              <div className=" text-[#5A5A5A] text-[14px] sm:text-[16px] md:text-[14px] font-light leading-relaxed font-touvlo">
                <p>
                  We take great care in packaging each order to ensure safe
                  delivery. If your order arrives damaged or defective, please:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Contact us within 24 hours of delivery</li>
                  <li>
                    Provide clear photos of the damage and the original
                    packaging
                  </li>
                  <li>
                    Email your request to{" "}
                    <a
                      href="mailto:hello@lazana-jewelry.com"
                      className="text-[#1C3163] hover:underline"
                    >
                      hello@lazana-jewelry.com
                    </a>
                  </li>
                </ul>
                <p>
                  We will assess the situation and work with you to resolve it
                  appropriately.
                </p>
              </div>
            </div>

            <div className="mt-[25px]">
              <h3 className="text-[#1C3163] text-[16px] sm:text-[19px] md:text-[19px] font-normal font-seasons">
                Need Help?
              </h3>
              <div className=" text-[#5A5A5A] text-[14px] sm:text-[16px] md:text-[14px] font-light leading-relaxed font-touvlo">
                <p>
                  If you have any questions about your order, shipping, or this
                  policy, please do not hesitate to contact us at:
                </p>
                <p>
                  <a
                    href="mailto:hello@lazana-jewelry.com"
                    className="text-[#1C3163] hover:underline"
                  >
                    hello@lazana-jewelry.com
                  </a>
                </p>
                <p>
                  We&apos;re here to help and ensure your experience with Lazana
                  Jewelry is a positive one.
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

