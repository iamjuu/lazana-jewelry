import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import AvailableSlot from "@/models/AvailableSlot";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", );

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check if booking already exists for this session
    const existingBooking = await Booking.findOne({ paymentRef: sessionId });
    if (existingBooking) {
      return NextResponse.json({
        success: true,
        data: existingBooking,
        message: "Booking already exists",
      });
    }

    // Get metadata from session
    const metadata = session.metadata;
    if (!metadata || !metadata.slotId || !metadata.date || !metadata.time) {
      return NextResponse.json(
        { success: false, message: "Invalid session metadata" },
        { status: 400 }
      );
    }

    // Check if slot is still available
    const slot = await AvailableSlot.findById(metadata.slotId);
    if (!slot) {
      return NextResponse.json(
        { success: false, message: "Slot not found" },
        { status: 404 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { success: false, message: "Slot already booked" },
        { status: 400 }
      );
    }

    // Create the booking
    console.log("Creating booking with data:", {
      userId: String(user._id),
      sessionId: metadata.slotId,
      amount: session.amount_total || 0,
      slotId: metadata.slotId,
    });

    const booking = await Booking.create({
      userId: String(user._id), // Ensure it's a string
      sessionId: metadata.slotId, // Using slotId as sessionId for private sessions
      seats: 1, // Private sessions are always 1 seat
      amount: session.amount_total || 0, // Amount in cents from Stripe
      status: "confirmed",
      paymentProvider: "stripe",
      paymentRef: sessionId,
      paymentStatus: "paid",
      sessionType: "private",
      slotId: metadata.slotId,
      phone: user.phone || "N/A",
      comment: `Private Session - ${metadata.date} at ${metadata.time}`,
    });

    console.log("Booking created successfully:", booking._id);

    // Mark slot as booked
    slot.isBooked = true;
    await slot.save();

    console.log("Slot marked as booked:", slot._id);

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
      errors: e?.errors,
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
