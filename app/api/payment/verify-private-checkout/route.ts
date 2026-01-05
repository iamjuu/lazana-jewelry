import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import PrivateSession from "@/models/PrivateSession";
import SessionEnquiry from "@/models/SessionEnquiry";
import User from "@/models/User";
import type { IUser } from "@/types";
import Stripe from "stripe";
import { sendPrivateSessionConfirmationToUser, sendPrivateSessionNotificationToAdmin } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();
    
    const user = await User.findById(authUser._id).lean<IUser>();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer_details'],
    });

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check if booking already exists for this session
    const existingBooking = await Booking.findOne({ paymentRef: sessionId });
    const isNewBooking = !existingBooking;

    // Get metadata from session
    const metadata = session.metadata;
    
    console.log("🔍 Session metadata:", metadata);
    
    // Verify required metadata fields - support both slotId (new flow) and sessionId+enquiryId (old flow)
    if (!metadata) {
      console.error("❌ Metadata is missing from session");
      return NextResponse.json(
        { success: false, message: "Invalid session metadata: metadata is missing" },
        { status: 400 }
      );
    }

    // Check if this is the new slotId-based flow or old enquiry-based flow
    const slotId = metadata.slotId;
    const oldSessionId = metadata.sessionId;
    const enquiryId = metadata.enquiryId;

    let privateSession;
    let sessionIdToUse;

    if (slotId) {
      // New flow: slotId directly references the PrivateSession
      sessionIdToUse = slotId;
      privateSession = await PrivateSession.findById(slotId);
      
      if (!privateSession) {
        return NextResponse.json(
          { success: false, message: "Private session not found" },
          { status: 404 }
        );
      }

      if ((privateSession.bookedSeats ?? 0) >= (privateSession.totalSeats ?? 1)) {
        return NextResponse.json(
          { success: false, message: "Session is already fully booked" },
          { status: 400 }
        );
      }
    } else if (oldSessionId && enquiryId) {
      // Old flow: sessionId + enquiryId
      sessionIdToUse = oldSessionId;
      privateSession = await PrivateSession.findById(oldSessionId);
      
    if (!privateSession) {
      return NextResponse.json(
        { success: false, message: "Private session not found" },
        { status: 404 }
      );
    }

    if ((privateSession.bookedSeats ?? 0) >= (privateSession.totalSeats ?? 1)) {
      return NextResponse.json(
        { success: false, message: "Session is already fully booked" },
        { status: 400 }
      );
    }

      // Update enquiry status for old flow
      const enquiry = await SessionEnquiry.findById(enquiryId);
    if (enquiry) {
      enquiry.status = "completed";
      await enquiry.save();
      }
    } else {
      // Invalid metadata - neither flow has required fields
      console.error("❌ Invalid metadata - missing required fields:", {
        hasSlotId: !!slotId,
        hasSessionId: !!oldSessionId,
        hasEnquiryId: !!enquiryId,
        metadata: metadata
      });
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid session metadata: missing required fields (slotId or sessionId+enquiryId)",
          metadata: metadata
        },
        { status: 400 }
      );
    }

    // Verify user matches metadata
    if (metadata.userId && metadata.userId !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: session belongs to different user" },
        { status: 403 }
      );
    }

    // Create the booking (only if it doesn't exist)
    const bookingAmount = session.amount_total ? Math.round(session.amount_total / 100) : (privateSession.price ?? 0); // Convert from cents
    let booking = existingBooking;
    
    if (isNewBooking) {
      booking = await Booking.create({
        userId: String(user._id),
        sessionId: sessionIdToUse,
        sessionType: metadata.sessionType || "private",
        seats: 1, // Private sessions are always 1 seat
        amount: bookingAmount,
        status: "confirmed",
        paymentProvider: "stripe",
        paymentRef: sessionId,
        paymentStatus: "paid",
        phone: user.phone || metadata.phone || "N/A",
        comment: metadata.comment || `Private Session - ${metadata.date || privateSession.date} at ${metadata.time || privateSession.startTime}`,
      });

      // Update session booked seats (only if this is a new booking)
      privateSession.bookedSeats = (privateSession.bookedSeats || 0) + 1;
      await privateSession.save();
    }

    // Create or update SessionEnquiry for dashboard display
    let enquiry;
    // Get the raw date - could be formatted like "January 1, 2026" or YYYY-MM-DD format
    const rawDate = metadata.date || privateSession.date;
    const sessionTime = metadata.time || privateSession.startTime || "";
    
    // Convert date to YYYY-MM-DD format if it's in a different format
    let sessionDate: string;
    if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      // Already in YYYY-MM-DD format
      sessionDate = rawDate;
    } else if (rawDate) {
      // Try to parse and convert to YYYY-MM-DD
      try {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          sessionDate = `${year}-${month}-${day}`;
        } else {
          // Fallback to privateSession.date if parsing fails
          sessionDate = privateSession.date || "";
        }
      } catch {
        sessionDate = privateSession.date || "";
      }
    } else {
      sessionDate = privateSession.date || "";
    }
    
    const customerEmail = session.customer_details?.email || session.customer_email || user.email || "";
    const customerName = session.customer_details?.name || user.name || "Customer";
    const customerPhone = user.phone || metadata.phone || "N/A";

    if (enquiryId) {
      // Old flow: update existing enquiry
      enquiry = await SessionEnquiry.findById(enquiryId);
      if (enquiry) {
        enquiry.status = "completed";
        await enquiry.save();
      }
    } else {
      // New flow: create new enquiry entry
      // Check if enquiry already exists for this booking (avoid duplicates)
      const existingEnquiry = await SessionEnquiry.findOne({
        sessionId: sessionIdToUse,
        sessionType: "private",
        email: customerEmail || user.email,
      });

      if (existingEnquiry) {
        // Update existing enquiry
        existingEnquiry.status = "completed";
        // Update bookedDate if it's not in the correct format
        if (sessionDate && existingEnquiry.bookedDate !== sessionDate) {
          existingEnquiry.bookedDate = sessionDate;
        }
        if (sessionTime && existingEnquiry.bookedTime !== sessionTime) {
          existingEnquiry.bookedTime = sessionTime;
        }
        await existingEnquiry.save();
        enquiry = existingEnquiry;
      } else {
        // Create new enquiry
        try {
          enquiry = await SessionEnquiry.create({
            fullName: customerName,
            services: `Private Session - ${sessionDate} at ${sessionTime}`,
            phone: customerPhone,
            email: customerEmail || user.email || "customer@example.com", // Fallback email to prevent validation error
            comment: `Private Session booking - Payment confirmed. Amount: SGD $${bookingAmount.toFixed(2)}`,
            status: "completed",
            sessionType: "private",
            sessionId: sessionIdToUse,
            bookedDate: sessionDate,
            bookedTime: sessionTime,
          });
          console.log("✅ Created SessionEnquiry for private session booking:", enquiry._id);
        } catch (error) {
          console.error("❌ Error creating SessionEnquiry:", error);
          // Don't fail the whole request if enquiry creation fails
        }
      }
    }

    // Use the already defined variables for email

    // Send confirmation email to customer (don't wait - send in background)
    if (customerEmail) {
      sendPrivateSessionConfirmationToUser({
        fullName: customerName,
        email: customerEmail,
        date: sessionDate,
        time: sessionTime,
      }).catch((error) => {
        console.error("Failed to send private session confirmation email to customer:", error);
      });
    }

    // Send notification email to admin (don't wait - send in background)
    sendPrivateSessionNotificationToAdmin({
      fullName: customerName,
      email: customerEmail || user.email || "",
      phone: customerPhone,
      date: sessionDate,
      time: sessionTime,
    }).catch((error) => {
      console.error("Failed to send private session notification email to admin:", error);
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: "Booking created successfully",
    });
  } catch (e: any) {
    console.error("Verification error details:", {
      message: e?.message,
      name: e?.name,
      stack: e?.stack,
    });
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { 
        success: false, 
        message: e?.message || "Server error",
        error: process.env.NODE_ENV === "development" ? e?.stack : undefined
      },
      { status }
    );
  }
}
