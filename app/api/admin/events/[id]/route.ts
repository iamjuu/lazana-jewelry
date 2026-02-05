import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();
    const { id } = await context.params;

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

    // Get current event to check bookedSeats
    const currentEvent = await Event.findById(id);
    if (!currentEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    // Validate slots - can't reduce totalSeats below current bookedSeats
    const currentBookedSeats = (currentEvent.bookedSeats as number) || 0;
    if (totalSeats !== undefined && totalSeats !== null) {
      const seatsNum = Number(totalSeats);
      if (seatsNum < currentBookedSeats) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot reduce total seats below ${currentBookedSeats} (already booked)`,
          },
          { status: 400 },
        );
      }
      if (seatsNum <= 0) {
        return NextResponse.json(
          { success: false, message: "Total seats must be greater than 0" },
          { status: 400 },
        );
      }
    }

    if (price !== undefined && price !== null && price < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be 0 or greater" },
        { status: 400 },
      );
    }

    // Handle image upload to S3 if provided
    let s3ImageUrl: string | undefined;
    if (imageUrl !== undefined) {
      if (imageUrl) {
        const imageStr = String(imageUrl).trim();

        // Check if it's already an S3 URL
        if (imageStr.startsWith("https://")) {
          s3ImageUrl = imageStr;
        } else {
          // Upload base64 image to S3 (will be converted to WebP)
          try {
            const filename = `event-${id}-${Date.now()}.webp`;
            const result = await uploadToS3(imageStr, filename, "images");
            s3ImageUrl = result.url;
            console.log(`✓ Updated event image to S3 as WebP: ${result.url}`);
          } catch (uploadError) {
            console.error("Failed to upload event image:", uploadError);
            return NextResponse.json(
              { success: false, message: "Failed to upload event image to S3" },
              { status: 500 },
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
      location: String(location).trim(),
      day: String(day).trim(),
      time: String(time).trim(),
      date: String(date).trim(),
      endDate: endDate ? String(endDate).trim() : undefined,
      description: String(description).trim(),
    };

    if (imageUrl !== undefined) {
      updateData.imageUrl = s3ImageUrl;
    }

    if (totalSeats !== undefined && totalSeats !== null) {
      updateData.totalSeats = Number(totalSeats);
    }
    if (price !== undefined && price !== null) {
      updateData.price = Number(price);
    }

    const updated = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const { id } = await context.params;

    const deleted = await Event.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}
