import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

// GET - Fetch all events with pagination and search
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

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: events,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const body = await req.json();
    const {
      name,
      title,
      location,
      day,
      time,
      date,
      endDate,
      description,
      imageUrl,
      totalSeats,
      price,
    } = body;

    // Validation
    if (
      !name ||
      !title ||
      !location ||
      !day ||
      !time ||
      !date ||
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, title, location, day, time, date, and description are required",
        },
        { status: 400 },
      );
    }

    // Validate slots and price (use defaults if not provided for backward compatibility)
    const seats =
      totalSeats !== undefined && totalSeats !== null ? Number(totalSeats) : 1;
    const eventPrice =
      price !== undefined && price !== null ? Number(price) : 0;

    if (seats <= 0) {
      return NextResponse.json(
        { success: false, message: "Total seats must be greater than 0" },
        { status: 400 },
      );
    }

    if (eventPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be 0 or greater" },
        { status: 400 },
      );
    }

    // Handle image upload to S3 if provided
    let s3ImageUrl: string | undefined;
    if (imageUrl) {
      const imageStr = String(imageUrl).trim();

      // Check if it's already an S3 URL
      if (imageStr.startsWith("https://")) {
        s3ImageUrl = imageStr;
      } else {
        // Upload base64 image to S3 (will be converted to WebP)
        try {
          const filename = `event-${Date.now()}.webp`;
          const result = await uploadToS3(imageStr, filename, "images");
          s3ImageUrl = result.url;
          console.log(`✓ Uploaded event image to S3 as WebP: ${result.url}`);
        } catch (uploadError) {
          console.error("Failed to upload event image:", uploadError);
          return NextResponse.json(
            { success: false, message: "Failed to upload event image to S3" },
            { status: 500 },
          );
        }
      }
    }

    const event = await Event.create({
      name: String(name).trim(),
      title: String(title).trim(),
      location: String(location).trim(),
      day: String(day).trim(),
      time: String(time).trim(),
      date: String(date).trim(),
      endDate: endDate ? String(endDate).trim() : undefined,
      description: String(description).trim(),
      imageUrl: s3ImageUrl,
      totalSeats: seats,
      bookedSeats: 0,
      price: eventPrice,
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}
