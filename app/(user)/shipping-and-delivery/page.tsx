"use client";

import React from "react";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const ShippingAndDeliveryPage = () => {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="w-full mt-[25px]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="">
            <h2 className="text-[#000000] text-[28px] sm:text-[30px] md:text-[30px] lg:text-[32px] font-normal font-seasons">
              Shipping & Delivery
            </h2>
          </div>

          <div className="flex flex-col gap-8 md:gap-[25px] mt-[25px]">
            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Shipping Coverage
              </h3>
              <div className=" text-[#545454] text-[14px]  font-touvlo font-light leading-relaxed">
                <p>
                  We ship internationally to most countries worldwide, with
                  availability depending on courier coverage and local import
                  restrictions.
                </p>
              </div>
            </div>

            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Shipping Rates (Calculated at Checkout)
              </h3>
              <div className="text-[#545454] text-[14px] font-touvlo font-light leading-relaxed">
                <p>
                  Shipping fees are based on the size and item count of your
                  order and will be calculated automatically at checkout.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#1C3163]/20 mt-4">
                    <thead>
                      <tr className="bg-[#000000]/20">
                        <th className="border border-[#1C3163]/20 px-4 py-3 text-left text-[14px] sm:text-[14px] md:text-[14px] text-[#1C3163] font-normal">
                          Order Size
                        </th>
                        <th className="border border-[#1C3163]/20 px-4 py-3 text-left text-[14px] sm:text-[14px] md:text-[14px] text-[#1C3163] font-normal">
                          Shipping Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          1 Piece
                        </td>
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          USD $65
                        </td>
                      </tr>
                      <tr className="bg-white/50">
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          2-3 Pieces
                        </td>
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          USD $111
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          4-7 Pieces
                        </td>
                        <td className="border border-[#1C3163]/20 px-4 py-3 text-[14px] sm:text-[14px] md:text-[14px]">
                          USD $155
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Larger Orders
              </h3>
              <div className="text-[#545454] text-[14px]  font-touvlo font-light leading-relaxed">
                <p>
                  For larger orders, shipping fees continue to scale according
                  to package size, weight, and destination. Final pricing is
                  shown at checkout.
                </p>
              </div>
            </div>

            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Customs & Duties
              </h3>
              <div className="text-[#545454] text-[14px]  font-touvlo font-light leading-relaxed">
                <p>
                  International orders may be subject to customs duties, import
                  taxes, or other fees depending on your country of residence.
                </p>
                <p>
                  These charges are the responsibility of the customer and are
                  payable upon delivery. Lazana Jewelry has no control over
                  these fees and cannot predict their amount.
                </p>
              </div>
            </div>

            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Production & Delivery Timeline
              </h3>
              <div className="text-[#545454] text-[14px]  font-touvlo font-light leading-relaxed">
                <p>Many Lazana Jewelry pieces are made to order.</p>
                <p>
                  Please allow 25-28 business days from order confirmation to
                  delivery.
                </p>
                <p>
                  This timeframe includes production, quality checks, and
                  international shipping.
                </p>
              </div>
            </div>

            <div className="">
              <h3 className="text-[#1C3163] text-[19px]  font-normal font-seasons">
                Packaging & Insurance
              </h3>
              <div className="text-[#545454] text-[14px]  font-touvlo font-light leading-relaxed">
                <p>
                  Each order is carefully packaged using protective materials to
                  ensure your Lazana Jewelry arrives safely.
                </p>
                <p>All shipments are fully insured for your peace of mind.</p>
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

