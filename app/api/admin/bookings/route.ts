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

    // Build query for Bookings (Events)
    let bookingQuery: any = { ...query };
    // If specific non-event session types are requested, Booking query might yield nothing or old data
    // We keep it as is to support showing old migrated data if it exists

    // Build query for SessionEnquiries (Yoga Sessions)
    // We only want "Bookings" here, so we look for paid/completed enquiries
    let enquiryQuery: any = {
      ...query,
      // Map 'confirmed' status search to 'completed' for enquiries if needed,
      // but generally we want items that are effectively bookings
      $or: [{ paymentStatus: "paid" }, { status: "completed" }],
    };

    // Adjust status filter if present
    if (status) {
      if (status === "confirmed") {
        enquiryQuery.status = "completed";
      } else if (status === "all") {
        delete enquiryQuery.status;
      } else {
        enquiryQuery.status = status;
      }
    }

    // If sessionType is 'event', we don't need enquiries
    let fetchEnquiries = true;
    if (sessionType === "event") {
      fetchEnquiries = false;
    }

    const [bookings, enquiries] = await Promise.all([
      Booking.find(bookingQuery).sort({ createdAt: -1 }).lean(),
      fetchEnquiries
        ? SessionEnquiry.find(enquiryQuery).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
    ]);

    // Normalize and merge
    const normalizedEnquiries = enquiries.map((enquiry: any) => ({
      ...enquiry,
      // Map Enquiry fields to Booking fields where they differ
      status: enquiry.status === "completed" ? "confirmed" : enquiry.status,
      // Ensure specific fields exist
      userId: enquiry.userId,
      sessionType: enquiry.sessionType,
      sessionId: enquiry.sessionId,
      amount: enquiry.amount,
      paymentStatus: enquiry.paymentStatus,
      paymentProvider: enquiry.paymentProvider,
      isEnquiry: true, // Flag to identify origin if needed
    }));

    // Combine and sort
    const allRecords = [...bookings, ...normalizedEnquiries].sort(
      (a: any, b: any) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
    );

    // Populate details
    const bookingsWithDetails = await Promise.all(
      allRecords.map(async (booking: any) => {
        const result: any = { ...booking };

        // Populate event details for event bookings
        if (booking.sessionType === "event" && booking.sessionId) {
          const event = await Event.findById(booking.sessionId).lean();
          result.event = event;
        }

        // Populate session details for session bookings (or enquiries)
        if (
          booking.sessionType &&
          booking.sessionType !== "event" &&
          booking.sessionId
        ) {
          let session: any = null;
          if (booking.sessionType === "discovery") {
            session = await DiscoverySession.findById(booking.sessionId).lean();
          } else if (booking.sessionType === "private") {
            session = await PrivateSession.findById(booking.sessionId).lean();
          } else if (booking.sessionType === "corporate") {
            session = await CorporateSession.findById(booking.sessionId).lean();
          }
          result.session = session;

          // Normalize session to event structure if event is missing (for admin dashboard display)
          if (!result.event && session) {
            result.event = {
              title: session.title || booking.services || "Yoga Session",
              date: booking.bookedDate || session.date || "",
              time: booking.bookedTime || session.startTime || "",
              location: "Crystal Bowl Studio", // Default location
            };
          }
        }

        // Populate user details
        if (booking.userId) {
          const user = (await User.findById(booking.userId).lean()) as {
            name?: string;
            email?: string;
          } | null;
          if (user && user.name && user.email) {
            result.userName = user.name;
            result.userEmail = user.email;
          }
        }

        return result;
      }),
    );

    return NextResponse.json(
      { success: true, data: bookingsWithDetails },
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
