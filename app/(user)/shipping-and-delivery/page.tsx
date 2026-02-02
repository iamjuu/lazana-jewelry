"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const ShippingAndDeliveryPage = () => {
  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />

      <section className="w-full mt-[25px]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="">
            <h2 className="text-[#D5B584] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal font-seasons">
              Shipping & Delivery
            </h2>
          </div>

          {/* Content Sections */}
          <div className="flex flex-col gap-8 md:gap-[25px] mt-[25px]">
            {/* Shipping Coverage */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Shipping Coverage
              </h3>
              <div className=" text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font-light leading-relaxed">
                <p>
                  We ship internationally to all countries worldwide, except Switzerland, Africa, South America, India.
                </p>
              </div>
            </div>

            {/* Shipping Rates */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Shipping Rates (Calculated at Checkout)
              </h3>
              <div className="text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font-light leading-relaxed">
                <p>
                  Shipping fees are based on the number of bowls in your order and will be automatically calculated at checkout.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#1C3163]/20 mt-4">
                    <thead>
                      <tr className="bg-[#D5B584]/20">
                        <th className="border border-[#1C3163]/20 px-4 py-3 text-left text-[#1C3163] font-normal">
                          Number of Bowls
                        </th>
                        <th className="border border-[#1C3163]/20 px-4 py-3 text-left text-[#1C3163] font-normal">
                          Shipping Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[#1C3163]/20 px-4 py-3">1 Bowl</td>
                        <td className="border border-[#1C3163]/20 px-4 py-3">USD $65</td>
                      </tr>
                      <tr className="bg-white/50">
                        <td className="border border-[#1C3163]/20 px-4 py-3">2–3 Bowls</td>
                        <td className="border border-[#1C3163]/20 px-4 py-3">USD $111</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1C3163]/20 px-4 py-3">4–7 Bowls</td>
                        <td className="border border-[#1C3163]/20 px-4 py-3">USD $155</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Additional Bowls */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Additional Bowls
              </h3>
              <div className="text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font-light leading-relaxed">
                <p>
                  For orders of more than 7 bowls, shipping fees will continue to increase according to the tiered structure above and will be calculated automatically at checkout.
                </p>
              </div>
            </div>

            {/* Customs & Duties */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Customs & Duties
              </h3>
              <div className="text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font-light leading-relaxed">
                <p>
                  International orders may be subject to customs duties, import taxes, or other fees depending on your country of residence.
                </p>
                <p>
                  These charges are the responsibility of the customer and are payable upon delivery. Crystal Bowl Studio has no control over these fees and cannot predict their amount.
                </p>
              </div>
            </div>

            {/* Production & Delivery Timeline */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Production & Delivery Timeline
              </h3>
              <div className="text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font -light leading-relaxed">
                <p>
                  All Crystal Bowl Studio bowls are custom made to order.
                </p>
                <p>
                  Please allow 25–28 business days from order confirmation to delivery.
                </p>
                <p>
                  This timeframe includes production, quality checks, and international shipping.
                </p>
              </div>
            </div>

            {/* Packaging & Insurance */}
            <div className="">
              <h3 className="text-[#1C3163] text-[20px] sm:text-[24px] md:text-[19px] font-normal font-seasons">
                Packaging & Insurance
              </h3>
              <div className="text-[#1C3163] md:text-[14px] sm:text-[16px] font-touvlo font-light leading-relaxed">
                <p>
                  Each bowl is carefully packaged using protective materials and includes its own padded crystal bowl travel case to ensure maximum safety during transit.
                </p>
                <p>
                  All shipments are fully insured for your peace of mind.
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

export default ShippingAndDeliveryPage;

