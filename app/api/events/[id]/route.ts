import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    
    const event = await Event.findById(id).lean();
    
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: event },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}







