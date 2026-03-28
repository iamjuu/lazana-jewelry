"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const FreeStudioVisitPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    comment: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const sessionType = "freeStudioVisit";
    const services = "Free Studio Visit";

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, services, sessionType }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Thank you for submitting! We will contact you soon.");
        // Reset form
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          comment: "",
        });
      } else {
        toast.error(
          data.message || "Failed to submit enquiry. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 mt-[25px]">
          <div className="max-w-4xl  mx-auto">
            {/* Header */}
            <div className="mb-[25px]">
              <h1 className="font-seasons text-black text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] leading-tight mb-[25px]">
                Free Studio Visit
              </h1>
              <p className="sm:text-[15px]  text-[14px]  md:text-[16px] text-[#545454] font-touvlo leading-relaxed max-w-2xl">
                Schedule a complimentary visit to our studio and experience
                Lazana Jewelry in person. Fill out the form below and we&apos;ll
                get back to you to arrange your visit.
              </p>
            </div>

   {/* Form */}
<div className="bg-white/50 rounded-lg p-5 sm:p-6 md:p-8">
  <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
    
    {/* Full Name */}
    <div>
      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={handleChange}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
        required
      />
    </div>

    {/* Phone and Email */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div>
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
          required
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
          required
        />
      </div>
    </div>

    {/* Comment Section */}
    <div className="pt-3 sm:pt-4">
      <textarea
        name="comment"
        placeholder="Write your comment here"
        value={formData.comment}
        onChange={handleChange}
        rows={6}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/20 border-2 border-[#5B7C99] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all resize-none"
      />
    </div>

    {/* Submit Button */}
    <div className="pt-2">
      <button
        type="submit"
        disabled={submitting}
        className="w-full md:w-auto bg-[#1C3163] text-white px-6 sm:px-10 md:px-12 py-3 sm:py-4 rounded-lg text-[14px] sm:text-[15px] md:text-[16px] font-touvlo font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>

  </form>
</div>

          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default FreeStudioVisitPage;



