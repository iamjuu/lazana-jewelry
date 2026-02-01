'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { About1 } from '@/public/assets'

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
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `data:image/jpeg;base64,${imageUrl}`;
  };

  // Get excerpt from description (first ~150 characters)
  const getExcerpt = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  };

  return (
    <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
      <Navbar />
      <div className="w-full">
        {/* Hero/Header Image with Centered Text */}
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden mt-[15px]">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80)'
            }}
          />
          {/* Gradient Overlay */}
          {/* <div className="absolute inset-0 bg-gradient-to-br from-[#D5B584]/80 via-[#FEC1A2]/70 to-[#FDECE2]/80"></div> */}
          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center font-seasons">
            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-normal text-center drop-shadow-lg">
              Blog
            </h1>
          </div>
        </div>

        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 font-touvlo">
          <div className="max-w-6xl mx-auto">
            {/* Blog Grid */}
            {loading ? (
              <div className="text-center py-12 text-[#1C3163]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
                <p>Loading blogs...</p>
              </div>
            ) : blogsData.length === 0 ? (
              <div className="text-center py-12 text-[#1C3163]">No blogs available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {blogsData.map((blog) => {
                  const imageUrl = getImageUrl(blog.imageUrl);
                  const excerpt = getExcerpt(blog.description);
                  
                  return (
                    <article key={blog._id} className="flex flex-col">
                      <Link href={`/blog/${blog._id}`} className="group flex flex-col h-full">
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
                          <h2 className="text-[#1C3163] text-xl md:text-2xl font-bold mb-3 leading-tight group-hover:text-[#545454] transition-colors duration-200 font-seasons">
                            {blog.title}
                          </h2>

                          {/* Description with Read More aligned to right */}
                          <div className="flex items-start justify-between gap-2 ">
                            <p className="text-[#545454] text-sm md:text-base leading-relaxed flex-1 text-[#545454] font-touvlo">
                              {excerpt}
                            </p>
                          
                          </div>
                       
                        </div>
                      </Link>
                      <div className='flex justify-start'>
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
  )
}

export default BlogPage
