import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const body = await req.json();
    const { name, title, location, day, time, date, description, imageUrl, totalSeats, price } = body;

    // Validation
    if (!name || !title || !location || !day || !time || !date || !description) {
      return NextResponse.json(
        { success: false, message: "Name, title, location, day, time, date, and description are required" },
        { status: 400 }
      );
    }

    // Validate slots and price (use defaults if not provided for backward compatibility)
    const seats = totalSeats !== undefined && totalSeats !== null ? Number(totalSeats) : 1;
    const eventPrice = price !== undefined && price !== null ? Number(price) : 0;
    
    if (seats <= 0) {
      return NextResponse.json(
        { success: false, message: "Total seats must be greater than 0" },
        { status: 400 }
      );
    }

    if (eventPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be 0 or greater" },
        { status: 400 }
      );
    }

    const event = await Event.create({
      name: String(name).trim(),
      title: String(title).trim(),
      location: String(location).trim(),
      day: String(day).trim(),
      time: String(time).trim(),
      date: String(date).trim(),
      description: String(description).trim(),
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      totalSeats: seats,
      bookedSeats: 0,
      price: eventPrice,
    });

    return NextResponse.json(
      { success: true, data: event },
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
    
    const events = await Event.find().sort({ createdAt: -1 });
    
    return NextResponse.json(
      { success: true, data: events },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}
















