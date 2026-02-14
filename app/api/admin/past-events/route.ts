import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PastEvent from "@/models/PastEvent";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const body = await req.json();
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

    // Upload thumbnail to S3 (convert to WebP)
    let s3ThumbnailUrl: string;
    try {
      const thumbnailStr = String(thumbnailImage).trim();
      if (thumbnailStr.startsWith('https://')) {
        s3ThumbnailUrl = thumbnailStr;
      } else {
        const filename = `past-event-thumbnail-${Date.now()}.webp`;
        const result = await uploadToS3(thumbnailStr, filename, 'images');
        s3ThumbnailUrl = result.url;
        console.log(`✓ Uploaded past event thumbnail as WebP: ${result.url}`);
      }
    } catch (uploadError) {
      console.error('Failed to upload thumbnail:', uploadError);
      return NextResponse.json(
        { success: false, message: 'Failed to upload thumbnail to S3' },
        { status: 500 }
      );
    }

    // Upload photos to S3 (convert to WebP)
    const s3PhotoUrls: string[] = [];
    for (let i = 0; i < photosArray.length; i++) {
      const photo = photosArray[i];
      try {
        if (photo.startsWith('https://')) {
          s3PhotoUrls.push(photo);
        } else {
          const filename = `past-event-photo-${Date.now()}-${i + 1}.webp`;
          const result = await uploadToS3(photo, filename, 'images');
          s3PhotoUrls.push(result.url);
          console.log(`✓ Uploaded past event photo ${i + 1} as WebP: ${result.url}`);
        }
      } catch (uploadError) {
        console.error(`Failed to upload photo ${i + 1}:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Failed to upload photo ${i + 1} to S3` },
          { status: 500 }
        );
      }
    }

    // Upload videos to S3
    const s3VideoUrls: string[] = [];
    for (let i = 0; i < videosArray.length; i++) {
      const video = videosArray[i];
      try {
        if (video.startsWith('https://') || video.startsWith('http://')) {
          s3VideoUrls.push(video);
        } else {
          const filename = `past-event-video-${Date.now()}-${i + 1}.mp4`;
          const result = await uploadToS3(video, filename, 'videos');
          s3VideoUrls.push(result.url);
          console.log(`✓ Uploaded past event video ${i + 1}: ${result.url}`);
        }
      } catch (uploadError) {
        console.error(`Failed to upload video ${i + 1}:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Failed to upload video ${i + 1} to S3` },
          { status: 500 }
        );
      }
    }

    const pastEvent = await PastEvent.create({
      name: String(name).trim(),
      title: String(title).trim(),
      location: String(location).trim(),
      day: String(day).trim(),
      time: String(time).trim(),
      date: String(date).trim(),
      endDate: endDate && String(endDate).trim() ? String(endDate).trim() : undefined,
      description: String(description).trim(),
      thumbnailImage: s3ThumbnailUrl,
      photos: s3PhotoUrls,
      videos: s3VideoUrls,
    });

    return NextResponse.json(
      { success: true, data: pastEvent },
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
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const [pastEvents, total] = await Promise.all([
      PastEvent.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      PastEvent.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: pastEvents,
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








