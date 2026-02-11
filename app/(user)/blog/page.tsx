"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { About1 } from "@/public/assets";

type ApiBlog = {
  _id: string;
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

const BlogPage = () => {
  const [blogsData, setBlogsData] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/blogs");
      const data = await response.json();

      if (data.success && data.data) {
        setBlogsData(data.data);
      } else {
        setBlogsData([]);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setBlogsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string): string | typeof About1 => {
    if (!imageUrl) return About1;
    if (imageUrl.startsWith("data:image")) return imageUrl;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  // Get excerpt from description (first ~150 characters)
  const getExcerpt = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  };

  return (
    <div className="bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen">
      <Navbar />
      <div className="w-full">
        {/* Hero/Header Image with Centered Text */}
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden ">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80)",
            }}
          />
          {/* Gradient Overlay */}
          {/* <div className="absolute inset-0 bg-gradient-to-br from-[#D5B584]/80 via-[#FEC1A2]/70 to-[#FDECE2]/80"></div> */}
          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center font-seasons">
            <h1 className="text-[#e6b884] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-normal text-center drop-shadow-lg font-seasons">
              Blog
            </h1>
          </div>
        </div>

        {/* Introductory Content Section */}
        {/* <section className="w-full px-4 sm:px-6 lg:px-8 mt-[25px]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-[25px]">
              <h2 className="text-[#1C3163] text-[30px] lg:text-[32px] font-seasons font-normal mb-[25px]">
                Insights on Sound Healing & Crystal Bowls
              </h2>
              <p className="text-[#545454] text-[16px] font-touvlo leading-relaxed max-w-3xl mx-auto">
                Explore our collection of articles, guides, and stories about
                the transformative power of crystal singing bowls, sound healing
                practices, and the ancient wisdom of vibrational therapy.
                Whether you're a beginner or an experienced practitioner, you'll
                find valuable insights to deepen your journey.
              </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[25px] mb-[25px]">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D5B584]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#D5B584]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-[#1C3163] text-[30px] lg:text-[32px] font-seasons font-medium mb-[25px]">
                  Healing Wisdom
                </h3>
                <p className="text-[#545454] text-[16px] font-touvlo">
                  Ancient practices meet modern science in our comprehensive
                  guides
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D5B584]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#D5B584]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-[#1C3163] text-[30px] lg:text-[32px] font-seasons font-medium mb-[25px]">
                  Expert Insights
                </h3>
                <p className="text-[#545454] text-[16px] font-touvlo">
                  Learn from experienced practitioners and sound healing experts
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-[#D5B584]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#D5B584]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-[#1C3163] text-[30px] lg:text-[32px] font-seasons font-medium mb-[25px]">
                  Practical Tips
                </h3>
                <p className="text-[#545454] text-[16px] font-touvlo">
                  Step-by-step tutorials to enhance your sound healing practice
                </p>
              </div>
            </div>
          </div>
        </section> */}

        <section className="w-full px-4 sm:px-6 lg:px-8 font-touvlo">
          <div className="max-w-6xl mx-auto">
            {/* Blog Grid */}
            {loading ? (
              <div className="text-center py-12 text-[#1C3163]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
                <p>Loading blogs...</p>
              </div>
            ) : blogsData.length === 0 ? (
              <div className="text-center py-12 text-[#1C3163]">
                No blogs available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {blogsData.map((blog) => {
                  const imageUrl = getImageUrl(blog.imageUrl);
                  const excerpt = getExcerpt(blog.description);

                  return (
                    <article key={blog._id} className="flex flex-col mt-[50px]">
                      <Link
                        href={`/blog/${blog._id}`}
                        className="group flex flex-col h-full"
                      >
                        {/* Blog Image - Smaller Height */}
                        <div className="w-full mb-4 overflow-hidden flex-shrink-0">
                          <div className="relative w-full aspect-[5/6] overflow-hidden w-[500px] h-[250px]  ">
                            {typeof imageUrl === "string" ? (
                              <img
                                src={imageUrl}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <Image
                                src={imageUrl}
                                alt={blog.title}
                                fill
                                className="object-contain group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                          </div>
                        </div>

                        {/* Blog Content */}
                        <div className="flex flex-col flex-1">
                          {/* Title */}
                          <h2 className="text-[#1C3163] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-seasons font-normal leading-tight group-hover:text-[#545454] transition-colors duration-200">
                            {blog.title}
                          </h2>

                          {/* Description with Read More aligned to right */}
                          <div className="flex items-start justify-between gap-2 ">
                            <p className="text-[#545454] text-[14px] sm:text-[15px] text-[#1C3163] font-medium] md:text-[16px] leading-relaxed flex-1 text-[#545454] font-touvlo">
                              {excerpt}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <div className="flex justify-start mt-[10px]">
                        <Link
                          href={`/blog/${blog._id}`}
                          className="underline hover:text-[#545454] transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-[#1C3163] font-touvlo"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read More
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
