"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/user/Navbar";
import Footer from "@/components/user/Footer";
import { About2 } from "@/public/assets";

type ApiBlog = {
  _id: string;
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

const BlogDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const blogId = params.id as string;
  const [blog, setBlog] = useState<ApiBlog | null>(null);
  const [allBlogs, setAllBlogs] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Format date like "Nov 14, 2025"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blogs/${blogId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setBlog(data.data);
        } else {
          router.push("/blog");
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        router.push("/blog");
      } finally {
        setLoading(false);
      }
    };

    const fetchAllBlogs = async () => {
      try {
        const response = await fetch("/api/blogs");
        const data = await response.json();

        if (data.success && data.data) {
          const blogs = data.data;
          setAllBlogs(blogs);
          // Find current blog index
          const index = blogs.findIndex((b: ApiBlog) => b._id === blogId);
          setCurrentIndex(index);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      }
    };

    if (blogId) {
      fetchBlog();
      fetchAllBlogs();
    }
  }, [blogId, router]);

  // Get next and previous blogs
  const nextBlog =
    currentIndex >= 0 && currentIndex < allBlogs.length - 1
      ? allBlogs[currentIndex + 1]
      : null;
  const prevBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p>Loading blog...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <p>Blog not found</p>
            <Link
              href="/blog"
              className="text-[#000000] hover:underline mt-4 inline-block"
            >
              Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = formatDate(blog.createdAt);

  // Split description into paragraphs for better formatting
  const paragraphs = blog.description.split("\n\n").filter((p) => p.trim());

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="w-full">
        <article className="w-full px-4 sm:px-6 mt-[45px]">
          <div className="max-w-4xl mx-auto">
            {/* Date */}
            <div className="">
              <p className="text-[#1C3163] text-sm md:text-[16px] font-touvlo">
                {formattedDate}
              </p>
            </div>

            {/* Title */}
            <h1 className="text-[#1C3163] text-[28px] sm:text-[32px] md:text-[30px] lg:text-[32px] font-seasons  font-normal leading-relaxed">
              {blog.title}
            </h1>

            {/* Author with Picture */}
            <div className="mb-8 md:mb-12">
              <Link href="/about" className="flex items-center gap-4 group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#000000]/30 group-hover:ring-[#000000] transition-all">
                  <Image
                    src={About2}
                    alt={blog.name || "Francesca Wong"}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[#1C3163] text-[14px] md:text-[16px] font-touvlo">
                    Written By{" "}
                    <span className="text-[#000000] font-600 group-hover:underline font-touvlo">
                      {"Francesca Wong"}
                    </span>
                  </p>
                </div>
              </Link>
            </div>

            {/* Feature Image */}
            {blog.imageUrl && (
              <div className="w-full relative h-[300px] sm:h-[400px] md:h-[500px] mb-8 md:mb-6  overflow-hidden shadow-md">
                <Image
                  src={blog.imageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-[#1C3163] text-[14px] sm:text-[16px] md:text-[16px] lg:text-[16px] leading-relaxed space-y-4">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line font-touvlo text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] lg:text-[16px]">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-line text-[#545454] font-touvlo text-[14px] sm:text-[16px] md:text-[16px] lg:text-[16px]">
                    {blog.description}
                  </p>
                )}
              </div>
            </div>

            {/* Author Signature - fewer asterisks on mobile so it fits */}
            <div className="mt-[25px] md:pt-[25px] border-[#1C3163]/20">
              <p className="text-[#545454] text-base md:text-lg font-medium text-center">
                <span className="md:hidden">***  {blog.name || "Francesca Wong"}  ***</span>
                <span className="hidden md:inline">*******************  {blog.name || "Francesca Wong"} *******************</span>
              </p>
            </div>

            {/* Navigation to Next/Previous Blog */}
            {(nextBlog || prevBlog) && (
              <div className="mt-[25px] md:mt-[25px] pt-[25px] md:pt-[25px] border-t border-[#1C3163]/20 pt-[25px]">
                <div className="flex flex-col sm:flex-row justify-between gap-6">
                  {prevBlog ? (
                    <Link
                      href={`/blog/${prevBlog._id}`}
                      className="group flex-1"
                    >
                      <p className="text-[#1C3163] text-sm mb-2 md:text-[16px] font-touvlo">Previous</p>
                      <p className="text-[#1C3163] text-lg md:text-[18px] font-medium group-hover:text-[#000000] transition-colors duration-200 font-seasons">
                        {prevBlog.title}
                      </p>
                    </Link>
                  ) : (
                    <div className="flex-1"></div>
                  )}

                  {nextBlog && (
                    <Link
                      href={`/blog/${nextBlog._id}`}
                      className="group flex-1 text-right sm:text-left sm:ml-auto"
                    >
                      <p className="text-[#1C3163] text-sm mb-2">Next</p>
                      <p className="text-[#1C3163] text-lg md:text-xl font-medium group-hover:text-[#000000] transition-colors duration-200">
                        {nextBlog.title}
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;


