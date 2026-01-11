import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();
    const { id } = await context.params;
    
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
    if (imageUrl !== undefined) {
      if (imageUrl) {
        const imageStr = String(imageUrl).trim();
        
        // Check if it's already an S3 URL
        if (imageStr.startsWith('https://')) {
          s3ImageUrl = imageStr;
        } else {
          // Upload base64 image to S3 (will be converted to WebP)
          try {
            const filename = `blog-${id}-${Date.now()}.webp`;
            const result = await uploadToS3(imageStr, filename, 'images');
            s3ImageUrl = result.url;
            console.log(`✓ Updated blog image to S3 as WebP: ${result.url}`);
          } catch (uploadError) {
            console.error('Failed to upload blog image:', uploadError);
            return NextResponse.json(
              { success: false, message: 'Failed to upload blog image to S3' },
              { status: 500 }
            );
          }
        }
      } else {
        s3ImageUrl = undefined;
      }
    }

    const updateData: any = {
      name: String(name).trim(),
      title: String(title).trim(),
      description: String(description).trim(),
    };

    if (imageUrl !== undefined) {
      updateData.imageUrl = s3ImageUrl;
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const { id } = await context.params;
    
    const deleted = await Blog.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}
















