import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PastEvent from "@/models/PastEvent";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();
    const { id } = await context.params;
    
    const { name, title, location, day, time, date, endDate, description, thumbnailImage, photos, videos } = body;

    // Validation
    if (!name || !title || !location || !day || !time || !date || !description) {
      return NextResponse.json(
        { success: false, message: "Name, title, location, day, time, date, and description are required" },
        { status: 400 }
      );
    }

    if (!thumbnailImage) {
      return NextResponse.json(
        { success: false, message: "Thumbnail image is required" },
        { status: 400 }
      );
    }

    // Validate photos (max 6)
    const photosArray = Array.isArray(photos) ? photos.filter((p: string) => p && p.trim()) : [];
    if (photosArray.length > 6) {
      return NextResponse.json(
        { success: false, message: "Maximum 6 photos allowed" },
        { status: 400 }
      );
    }

    // Validate videos (max 2)
    const videosArray = Array.isArray(videos) ? videos.filter((v: string) => v && v.trim()) : [];
    if (videosArray.length > 2) {
      return NextResponse.json(
        { success: false, message: "Maximum 2 videos allowed" },
        { status: 400 }
      );
    }

    // Upload thumbnail to Cloudinary (convert to WebP)
    let s3ThumbnailUrl: string;
    try {
      const thumbnailStr = String(thumbnailImage).trim();
      if (thumbnailStr.startsWith('https://')) {
        s3ThumbnailUrl = thumbnailStr;
      } else {
        const filename = `past-event-thumbnail-${id}-${Date.now()}.webp`;
        const result = await uploadToCloudinary(thumbnailStr, filename, 'images');
        s3ThumbnailUrl = result.url;
        console.log(`✓ Updated past event thumbnail as WebP: ${result.url}`);
      }
    } catch (uploadError) {
      console.error('Failed to upload thumbnail:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Failed to upload thumbnail to Cloudinary' },
        { status: 500 }
      );
    }

    // Upload photos to Cloudinary (convert to WebP)
    const s3PhotoUrls: string[] = [];
    for (let i = 0; i < photosArray.length; i++) {
      const photo = photosArray[i];
      try {
        if (photo.startsWith('https://')) {
          s3PhotoUrls.push(photo);
        } else {
          const filename = `past-event-photo-${id}-${Date.now()}-${i + 1}.webp`;
          const result = await uploadToCloudinary(photo, filename, 'images');
          s3PhotoUrls.push(result.url);
          console.log(`✓ Updated past event photo ${i + 1} as WebP: ${result.url}`);
        }
      } catch (uploadError) {
        console.error(`Failed to upload photo ${i + 1}:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Failed to upload photo ${i + 1} to Cloudinary` },
          { status: 500 }
        );
      }
    }

    // Upload videos to Cloudinary
    const s3VideoUrls: string[] = [];
    for (let i = 0; i < videosArray.length; i++) {
      const video = videosArray[i];
      try {
        if (video.startsWith('https://') || video.startsWith('http://')) {
          s3VideoUrls.push(video);
        } else {
          const filename = `past-event-video-${id}-${Date.now()}-${i + 1}.mp4`;
          const result = await uploadToCloudinary(video, filename, 'videos');
          s3VideoUrls.push(result.url);
          console.log(`✓ Updated past event video ${i + 1}: ${result.url}`);
        }
      } catch (uploadError) {
        console.error(`Failed to upload video ${i + 1}:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Failed to upload video ${i + 1} to Cloudinary` },
          { status: 500 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: String(name).trim(),
      title: String(title).trim(),
      location: String(location).trim(),
      day: String(day).trim(),
      time: String(time).trim(),
      date: String(date).trim(),
      description: String(description).trim(),
      thumbnailImage: s3ThumbnailUrl,
      photos: s3PhotoUrls,
      videos: s3VideoUrls,
    };
    if (endDate !== undefined) {
      updatePayload.endDate = endDate && String(endDate).trim() ? String(endDate).trim() : null;
    }
    const updated = await PastEvent.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Past event not found" },
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
    
    const deleted = await PastEvent.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Past event not found" },
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








