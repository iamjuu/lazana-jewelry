"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";

const CorporateSessionPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Section 1: Contact Details
    fullName: "",
    workEmail: "",
    companyName: "",
    jobTitle: "",
    phone: "",
    cityCountry: "",
    // Section 2: Company Information
    industry: "",
    companySize: "",
    // Section 3: Enquiry Type
    enquiryTypes: [] as string[],
    // Section 4: Session Details
    preferredDates: "",
    preferredLocation: "",
    estimatedParticipants: "",
    preferredDuration: "",
    // Section 5: Session Objective
    sessionObjectives: [] as string[],
    // Section 6: Additional Information
    comment: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (
    name: "enquiryTypes" | "sessionObjectives",
    value: string,
  ) => {
    setFormData((prev) => {
      const currentArray = prev[name] || [];
      const isChecked = currentArray.includes(value);
      return {
        ...prev,
        [name]: isChecked
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    });
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const sessionType = "corporate";
    const services = "Corporate Session";

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: formData.workEmail, // Use workEmail as email for API
          services,
          sessionType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Thank you for submitting! We will respond within 2-3 business days.",
        );
        // Reset form
        setFormData({
          fullName: "",
          workEmail: "",
          companyName: "",
          jobTitle: "",
          phone: "",
          cityCountry: "",
          industry: "",
          companySize: "",
          enquiryTypes: [],
          preferredDates: "",
          preferredLocation: "",
          estimatedParticipants: "",
          preferredDuration: "",
          sessionObjectives: [],
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
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 mt-[25px]">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-[25px]">
              <h1 className="text-[32px] text-[#D5B584] font-seasons leading-tight mb-[25px]">
                Corporate Session
              </h1>
              <p className="text-[16px] text-[#545454] font-touvlo leading-relaxed max-w-2xl">
                Fill out the form below and we&apos;ll respond within 2-3
                business days.
              </p>
            </div>

            {/* Form */}
            <div className="bg-white/50 rounded-lg p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Contact Details */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    1. Contact Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Full Name*
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Work Email*
                      </label>
                      <input
                        type="email"
                        name="workEmail"
                        value={formData.workEmail}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Company Name*
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Job Title / Role*
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        City & Country*
                      </label>
                      <input
                        type="text"
                        name="cityCountry"
                        value={formData.cityCountry}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Company Information */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    2. Company Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      >
                        <option value="">Select Industry</option>
                        <option value="Finance">Finance</option>
                        <option value="Technology">Technology</option>
                        <option value="FMCG">FMCG</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Education">Education</option>
                        <option value="Professional Services">
                          Professional Services
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Company Size
                      </label>
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      >
                        <option value="">Select Company Size</option>
                        <option value="1-50">1-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-1,000">201-1,000</option>
                        <option value="1,000+">1,000+</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Enquiry Type */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    3. Enquiry Type
                  </h2>
                  <div>
                    <label className="block text-[#545454] text-[14px] mb-3 font-touvlo">
                      What are you enquiring about?*
                    </label>
                    <div className="space-y-2">
                      {[
                        "Corporate Sound Healing Sessions",
                        "Wellness Workshops or Retreats",
                        "Ongoing Corporate Wellness Partners",
                        "Private Event or Brand Activation",
                        "Other",
                      ].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.enquiryTypes.includes(option)}
                            onChange={() =>
                              handleCheckboxChange("enquiryTypes", option)
                            }
                            className="w-4 h-4 text-[#D5B584] border-[#5B7C99] rounded focus:ring-[#D5B584]"
                          />
                          <span className="text-[#545454] text-[14px] font-touvlo">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4: Session Details */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    4. Session Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Preferred Date(s)
                      </label>
                      <input
                        type="text"
                        name="preferredDates"
                        value={formData.preferredDates}
                        onChange={handleChange}
                        placeholder="DD-MM-YYYY"
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-3 font-touvlo">
                        Preferred Location
                      </label>
                      <div className="space-y-2">
                        {["On-site", "Off-site", "Virtual / Hybrid"].map(
                          (option) => (
                            <label
                              key={option}
                              className="flex items-center space-x-3 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="preferredLocation"
                                value={option}
                                checked={formData.preferredLocation === option}
                                onChange={() =>
                                  handleRadioChange("preferredLocation", option)
                                }
                                className="w-4 h-4 text-[#D5B584] border-[#5B7C99] focus:ring-[#D5B584]"
                              />
                              <span className="text-[#545454] text-[14px] font-touvlo">
                                {option}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Estimated Number of Participants
                      </label>
                      <input
                        type="number"
                        name="estimatedParticipants"
                        value={formData.estimatedParticipants}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                        Preferred Session Duration
                      </label>
                      <select
                        name="preferredDuration"
                        value={formData.preferredDuration}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                      >
                        <option value="">Select Duration</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="45 minutes">45 minutes</option>
                        <option value="60 minutes">60 minutes</option>
                        <option value="90 minutes">90 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 5: Session Objective */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    5. Session Objective
                  </h2>
                  <div>
                    <label className="block text-[#545454] text-[14px] mb-3 font-touvlo">
                      What is the main intention of this session?
                    </label>
                    <div className="space-y-2">
                      {[
                        "Stress reduction & relaxation",
                        "Team bonding",
                        "Focus & mental clarity",
                        "Leadership or high-performance support",
                        "Employee wellbeing initiative",
                        "Other",
                      ].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.sessionObjectives.includes(
                              option,
                            )}
                            onChange={() =>
                              handleCheckboxChange("sessionObjectives", option)
                            }
                            className="w-4 h-4 text-[#D5B584] border-[#5B7C99] rounded focus:ring-[#D5B584]"
                          />
                          <span className="text-[#545454] text-[14px] font-touvlo">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 6: Additional Information */}
                <div>
                  <h2 className="text-[#1C3163] text-[18px] font-seasons font-medium mb-4">
                    6. Additional Information
                  </h2>
                  <div>
                    <label className="block text-[#545454] text-[14px] mb-2 font-touvlo">
                      Message / Additional Notes
                    </label>
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-6 py-4 bg-white/20 border-2 border-[#5B7C99] rounded-lg text-[#545454] placeholder-[#545454] text-[16px] font-touvlo focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all resize-none"
                      placeholder="Any additional information you'd like to share..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#1C3163] text-white px-12 py-4 rounded-lg text-[16px] font-touvlo font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CorporateSessionPage;
