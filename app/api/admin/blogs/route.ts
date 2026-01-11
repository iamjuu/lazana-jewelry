import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const body = await req.json();
    const { name, title, description, imageUrl } = body;

    // Validation
    if (!name || !title || !description) {
      return NextResponse.json(
        { success: false, message: "Name, title, and description are required" },
        { status: 400 }
      );
    }

    // Handle image upload to S3 if provided
    let s3ImageUrl: string | undefined;
    if (imageUrl) {
      const imageStr = String(imageUrl).trim();
      
      // Check if it's already an S3 URL
      if (imageStr.startsWith('https://')) {
        s3ImageUrl = imageStr;
      } else {
        // Upload base64 image to S3 (will be converted to WebP)
        try {
          const filename = `blog-${Date.now()}.webp`;
          const result = await uploadToS3(imageStr, filename, 'images');
          s3ImageUrl = result.url;
          console.log(`✓ Uploaded blog image to S3 as WebP: ${result.url}`);
        } catch (uploadError) {
          console.error('Failed to upload blog image:', uploadError);
          return NextResponse.json(
            { success: false, message: 'Failed to upload blog image to S3' },
            { status: 500 }
          );
        }
      }
    }

    const blog = await Blog.create({
      name: String(name).trim(),
      title: String(title).trim(),
      description: String(description).trim(),
      imageUrl: s3ImageUrl,
    });

    return NextResponse.json(
      { success: true, data: blog },
      { status: 201 }
    );
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const query: any = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}
















