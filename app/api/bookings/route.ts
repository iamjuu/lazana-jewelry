import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import DiscoverySession from "@/models/DiscoverySession";
import PrivateSession from "@/models/PrivateSession";
import CorporateSession from "@/models/CorporateSession";
import Event from "@/models/Event";
import SessionEnquiry from "@/models/SessionEnquiry";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import {
  sendPrivateSessionConfirmationToUser,
  sendPrivateSessionNotificationToAdmin,
} from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    // Fetch bookings for user, optionally filter by sessionType, with pagination
    const { searchParams } = new URL(req.url);
    const sessionType = searchParams.get("sessionType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;

    let query: any = { userId: user._id };
    let modelToUse: any = Booking;

    if (sessionType) {
      const types = sessionType.includes(",")
        ? sessionType.split(",").map((t) => t.trim())
        : [sessionType];

      // If we are NOT looking for events, we should look in SessionEnquiry
      if (!types.includes("event")) {
        modelToUse = SessionEnquiry;
      }

      query.sessionType = types.length > 1 ? { $in: types } : types[0];
    }

    // Get total count for pagination
    const total = await modelToUse.countDocuments(query);

    const results = await modelToUse
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate event details for event bookings
    const bookingsWithDetails = await Promise.all(
      results.map(async (booking: any) => {
        if (booking.sessionType === "event" && booking.sessionId) {
          const event = await Event.findById(booking.sessionId).lean();
          return { ...booking, event };
        }
        return booking;
      }),
    );

    return NextResponse.json({
      success: true,
      data: bookingsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + results.length < total,
      },
    });
  } catch (e: any) {
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    // Fetch full user document
    const user = (await User.findById(authUser._id).lean()) as {
      _id: any;
      name?: string;
      email?: string;
      phone?: string;
    } | null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }
    const {
      sessionId,
      sessionType,
      seats,
      phone,
      comment,
      slotId,
      companyName,
      jobTitle,
      workEmail,
      industry,
      companySize,
      preferredDates,
      preferredLocation,
      preferredDuration,
      sessionObjectives,
    } = (await req.json()) as {
      sessionId?: string;
      sessionType?: "discovery" | "private" | "corporate";
      seats?: number;
      phone?: string;
      comment?: string;
      slotId?: string; // For discovery/private slot reference
      // Optional corporate-related fields
      companyName?: string;
      jobTitle?: string;
      workEmail?: string;
      industry?: string;
      companySize?: string;
      preferredDates?: string;
      preferredLocation?: string;
      preferredDuration?: string;
      sessionObjectives?: string[];
    };

    if (!sessionType) {
      return NextResponse.json(
        {
          success: false,
          message: "Session type is required",
        },
        { status: 400 },
      );
    }

    // For private sessions, slotId is required instead of sessionId
    if (sessionType === "private" && !slotId) {
      return NextResponse.json(
        {
          success: false,
          message: "Slot ID is required for private session booking",
        },
        { status: 400 },
      );
    }

    // For other session types, sessionId is required
    if (sessionType !== "private" && !sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ID is required",
        },
        { status: 400 },
      );
    }

    if (!seats || seats <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid seats",
        },
        { status: 400 },
      );
    }

    // Phone is optional for private sessions (no payment flow)
    if (sessionType !== "private" && (!phone || phone.trim() === "")) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required",
        },
        { status: 400 },
      );
    }

    await connectDB();

    let session: any;
    let amount = 0;

    // Fetch session based on type
    if (sessionType === "discovery") {
      session = await DiscoverySession.findById(sessionId);
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            message: "Discovery session not found",
          },
          { status: 404 },
        );
      }
      // Discovery: one-on-one, no payment
      if (session.totalSeats !== 1 || session.bookedSeats >= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Session is already booked",
          },
          { status: 400 },
        );
      }
      amount = 0; // No payment
    } else if (sessionType === "private") {
      // Private sessions: Direct booking without payment
      // For private sessions, slotId IS the PrivateSession _id
      session = await PrivateSession.findById(slotId);

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            message: "Private session not found",
          },
          { status: 404 },
        );
      }

      // REMOVED: Booking limit check - allow unlimited bookings for private sessions
      // Just increment booked seats counter for tracking purposes (not used for limiting)
      session.bookedSeats = (session.bookedSeats || 0) + 1;
      await session.save();

      amount = 0; // No payment required
    } else if (sessionType === "corporate") {
      // Corporate: enquiry only, no direct booking
      return NextResponse.json(
        {
          success: false,
          message:
            "Corporate sessions are enquiry-based. Please submit an enquiry form.",
        },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid session type",
        },
        { status: 400 },
      );
    }

    // Create booking or session enquiry
    let result;
    if (
      sessionType === "discovery" ||
      sessionType === "private" ||
      sessionType === "corporate"
    ) {
      // Check if enquiry already exists to avoid duplicates
      const queryParams: any = {
        sessionId:
          sessionType === "private" ? session._id.toString() : sessionId,
        sessionType,
        userId: user._id,
      };

      if (sessionType === "private" && session.date) {
        queryParams.bookedDate = session.date;
      }

      const existingEnquiry = await SessionEnquiry.findOne(queryParams);

      if (existingEnquiry) {
        result = existingEnquiry;
        console.log("SessionEnquiry already exists for this booking");
      } else {
        result = await SessionEnquiry.create({
          userId: user._id,
          sessionId: sessionType === "private" ? session._id : sessionId,
          sessionType,
          seats: 1,
          amount: 0,
          status: "pending",
          phone: phone?.trim(),
          comment: comment?.trim() || undefined,
          slotId: slotId || undefined,
          fullName: user.name || "Customer",
          email: user.email || "N/A",
          services: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
          bookedDate: sessionType === "private" ? session.date : undefined,
          bookedTime: sessionType === "private" ? session.startTime : undefined,
          // Corporate/Private additional fields
          companyName: companyName || undefined,
          jobTitle: jobTitle || undefined,
          workEmail: workEmail || undefined,
          industry: industry || undefined,
          companySize: companySize || undefined,
          preferredDates: preferredDates || undefined,
          preferredLocation: preferredLocation || undefined,
          preferredDuration: preferredDuration || undefined,
          sessionObjectives:
            Array.isArray(sessionObjectives) && sessionObjectives.length > 0
              ? sessionObjectives
              : undefined,
        });
        console.log("✅ Created SessionEnquiry for booking");
      }

      // For private sessions, send emails
      if (sessionType === "private") {
        try {
          // Format date to readable format
          let sessionDateReadable = "";
          if (session.date) {
            try {
              const dateObj = new Date(
                session.date + (session.date.includes("T") ? "" : "T00:00:00"),
              );
              if (!isNaN(dateObj.getTime())) {
                sessionDateReadable = dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              } else {
                sessionDateReadable = session.date;
              }
            } catch {
              sessionDateReadable = session.date;
            }
          }

          const customerEmail = user.email || "";
          const customerName = user.name || "Customer";
          const customerPhone = phone?.trim() || user.phone || "N/A";

          // Send confirmation email to user
          if (customerEmail) {
            sendPrivateSessionConfirmationToUser({
              fullName: customerName,
              email: customerEmail,
              sessionTitle: session.title || undefined,
              date: sessionDateReadable || session.date || undefined,
              time: session.startTime || undefined,
              preferredDates: preferredDates || undefined,
              preferredLocation: preferredLocation || undefined,
              preferredDuration: preferredDuration || undefined,
              companyName: companyName || undefined,
              jobTitle: jobTitle || undefined,
              workEmail: workEmail || undefined,
              industry: industry || undefined,
              companySize: companySize || undefined,
              sessionObjectives:
                Array.isArray(sessionObjectives) && sessionObjectives.length > 0
                  ? sessionObjectives
                  : undefined,
              comment: comment?.trim() || undefined,
            }).catch((error) => {
              console.error(
                "Failed to send private session confirmation email to user:",
                error,
              );
            });
          }

          // Send notification email to admin
          sendPrivateSessionNotificationToAdmin({
            fullName: customerName,
            email: customerEmail,
            phone: customerPhone,
            sessionTitle: session.title || undefined,
            date: sessionDateReadable || session.date || undefined,
            time: session.startTime || undefined,
            preferredDates: preferredDates || undefined,
            preferredLocation: preferredLocation || undefined,
            preferredDuration: preferredDuration || undefined,
            companyName: companyName || undefined,
            jobTitle: jobTitle || undefined,
            workEmail: workEmail || undefined,
            industry: industry || undefined,
            companySize: companySize || undefined,
            sessionObjectives:
              Array.isArray(sessionObjectives) && sessionObjectives.length > 0
                ? sessionObjectives
                : undefined,
            comment: comment?.trim() || undefined,
          }).catch((error) => {
            console.error(
              "Failed to send private session notification email to admin:",
              error,
            );
          });
        } catch (emailError) {
          console.error(
            "❌ Error sending emails for private session:",
            emailError,
          );
        }
      }
    } else {
      // Handle events
      result = await Booking.create({
        userId: user._id,
        sessionId: sessionId,
        sessionType: "event",
        seats: seats,
        amount: 0,
        status: "confirmed",
        phone: phone?.trim(),
        comment: comment?.trim() || undefined,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        requiresPayment: false, // No payment for private sessions
      },
      { status: 201 },
    );
  } catch (e: any) {
    const status = e?.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json(
      {
        success: false,
        message: e?.message || "Bad request",
      },
      { status },
    );
  }
}
