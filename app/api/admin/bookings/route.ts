import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Event from "@/models/Event";
import User from "@/models/User";
import CorporateSession from "@/models/CorporateSession";
import PrivateSession from "@/models/PrivateSession";
import DiscoverySession from "@/models/DiscoverySession";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionType = searchParams.get("sessionType");
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");

    let query: any = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }
    if (sessionType) {
      query.sessionType = sessionType;
    }
    if (status && status !== "all") {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Populate event, session, and user details
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking: any) => {
        const result: any = { ...booking };

        // Populate event details for event bookings
        if (booking.sessionType === "event" && booking.sessionId) {
          const event = await Event.findById(booking.sessionId).lean();
          result.event = event;
        }

        // Populate session details for session bookings (backward compatibility)
        if (booking.sessionType && booking.sessionType !== "event" && booking.sessionId) {
          let session: any = null;
          if (booking.sessionType === "discovery") {
            session = await DiscoverySession.findById(booking.sessionId).lean();
          } else if (booking.sessionType === "private") {
            session = await PrivateSession.findById(booking.sessionId).lean();
          } else if (booking.sessionType === "corporate") {
            session = await CorporateSession.findById(booking.sessionId).lean();
          }
          result.session = session;
        }

        // Populate user details
        if (booking.userId) {
          const user = await User.findById(booking.userId).lean() as { name?: string; email?: string } | null;
          if (user && user.name && user.email) {
            result.userName = user.name;
            result.userEmail = user.email;
          }
        }

        return result;
      })
    );

    return NextResponse.json(
      { success: true, data: bookingsWithDetails },
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
