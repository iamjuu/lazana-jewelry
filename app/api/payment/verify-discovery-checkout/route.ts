import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import DiscoverySession from "@/models/DiscoverySession";
import User from "@/models/User";
import { sendDiscoverySessionConfirmation, sendDiscoverySessionNotificationToAdmin } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    // Fetch full user document to get email and phone
    const user = await User.findById(authUser._id).lean() as { email?: string; phone?: string; name?: string } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify metadata
    const metadata = session.metadata;
    if (!metadata || metadata.sessionType !== "discovery" || !metadata.sessionId || metadata.userId !== String(authUser._id)) {
      return NextResponse.json(
        { success: false, message: "Invalid session metadata" },
        { status: 400 }
      );
    }

    const discoverySessionId = metadata.sessionId;

    // Fetch discovery session
    const discoverySession = await DiscoverySession.findById(discoverySessionId);
    if (!discoverySession) {
      return NextResponse.json(
        { success: false, message: "Discovery session not found" },
        { status: 404 }
      );
    }

    // Check if session still has available seats
    if ((discoverySession.bookedSeats || 0) >= (discoverySession.totalSeats || 1)) {
      return NextResponse.json(
        { success: false, message: "This session is already fully booked" },
        { status: 400 }
      );
    }

    // Check if booking already exists
    const existingBooking = await Booking.findOne({
      userId: authUser._id,
      sessionId: discoverySessionId,
      sessionType: "discovery",
      paymentRef: sessionId,
    });

    let booking;
    if (existingBooking) {
      booking = existingBooking;
    } else {
      // Create booking
      const bookingAmount = (session.amount_total || 0) / 100; // Convert from cents
      
      booking = await Booking.create({
        userId: authUser._id,
        sessionId: discoverySessionId,
        sessionType: "discovery",
        seats: 1,
        amount: bookingAmount,
        status: "confirmed",
        paymentProvider: "stripe",
        paymentRef: sessionId,
        paymentStatus: "paid",
        phone: user.phone || "N/A",
        comment: `Discovery Session - ${discoverySession.date || 'TBD'} at ${discoverySession.startTime || 'TBD'}`,
      });

      // Update discovery session booked seats
      discoverySession.bookedSeats = (discoverySession.bookedSeats || 0) + 1;
      await discoverySession.save();

      // Send confirmation email to user
      if (user.email) {
        sendDiscoverySessionConfirmation({
          selectedDate: discoverySession.date || 'TBD',
          selectedTime: discoverySession.startTime || 'TBD',
          email: user.email,
          userName: user.name || 'User',
        }).catch((error) => {
          console.error("Failed to send discovery session confirmation email to user:", error);
        });
      }

      // Send notification email to admin
      sendDiscoverySessionNotificationToAdmin({
        userName: user.name || 'User',
        userEmail: user.email || 'N/A',
        userPhone: user.phone || 'N/A',
        selectedDate: discoverySession.date || 'TBD',
        selectedTime: discoverySession.startTime || 'TBD',
        amount: bookingAmount,
      }).catch((error) => {
        console.error("Failed to send discovery session notification email to admin:", error);
      });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (e: any) {
    console.error("Payment verification error:", e);
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

