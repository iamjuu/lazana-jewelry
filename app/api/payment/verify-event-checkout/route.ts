import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Event from "@/models/Event";
import User from "@/models/User";
import { sendEventBookingConfirmationToUser, sendEventBookingNotificationToAdmin } from "@/lib/email";

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
    if (!metadata || metadata.sessionType !== "event" || !metadata.eventId || metadata.userId !== String(authUser._id)) {
      return NextResponse.json(
        { success: false, message: "Invalid session metadata" },
        { status: 400 }
      );
    }

    const eventId = metadata.eventId;
    const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;

    // Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event still has available slots
    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (availableSlots < quantity) {
      return NextResponse.json(
        { success: false, message: `Only ${availableSlots} slot${availableSlots > 1 ? 's' : ''} available now` },
        { status: 400 }
      );
    }

    // Check if booking already exists
    const existingBooking = await Booking.findOne({
      userId: authUser._id,
      sessionId: eventId,
      sessionType: "event",
      paymentRef: sessionId,
    });

    let booking;
    if (existingBooking) {
      booking = existingBooking;
    } else {
      // Create booking
      booking = await Booking.create({
        userId: authUser._id,
        sessionId: eventId,
        sessionType: "event",
        seats: quantity,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        status: "confirmed",
        paymentProvider: "stripe",
        paymentRef: sessionId,
        paymentStatus: "paid",
        phone: user.phone || "N/A",
        comment: `Event: ${event.title} - ${event.date} at ${event.time} (${quantity} slot${quantity > 1 ? 's' : ''})`,
      });

      // Update event booked seats
      event.bookedSeats = (event.bookedSeats || 0) + quantity;
      await event.save();

      // Send confirmation email to user
      if (user.email) {
        sendEventBookingConfirmationToUser({
          fullName: user.name || "Customer",
          email: user.email,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          slots: quantity,
          amount: booking.amount,
        }).catch((error) => {
          console.error("Failed to send event booking confirmation email to user:", error);
        });
      }

      // Send notification email to admin
      sendEventBookingNotificationToAdmin({
        fullName: user.name || "Customer",
        email: user.email || "",
        phone: user.phone || "N/A",
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        slots: quantity,
        amount: booking.amount,
        bookingId: String(booking._id),
      }).catch((error) => {
        console.error("Failed to send event booking notification email to admin:", error);
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

