import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();
    
    // Fetch full user document to get email
    const user = await User.findById(authUser._id).lean() as { email?: string } | null;

    const body = await req.json();
    const { eventId, quantity = 1 } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    // Fetch event to verify it exists and has available slots
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event has available slots
    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (availableSlots <= 0) {
      return NextResponse.json(
        { success: false, message: "This event is fully booked" },
        { status: 400 }
      );
    }

    if (quantity > availableSlots) {
      return NextResponse.json(
        { success: false, message: `Only ${availableSlots} slot${availableSlots > 1 ? 's' : ''} available` },
        { status: 400 }
      );
    }

    // Get base URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      const origin = req.headers.get('origin');
      if (origin && (origin.startsWith('http://') || origin.startsWith('https://'))) {
        baseUrl = origin;
      } else {
        const host = req.headers.get('host') || req.headers.get('x-forwarded-host');
        const protocol = req.headers.get('x-forwarded-proto') || 
                        (host?.includes('localhost') ? 'http' : 'https');
        baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
      }
    }

    const amount = Math.round((event.price || 0) * 100); // Convert to cents

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event price" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: event.title,
              description: `${event.date} at ${event.time} - ${event.location}`,
            },
            unit_amount: amount,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/events/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/${eventId}`,
      metadata: {
        userId: String(authUser._id),
        eventId: eventId,
        sessionType: "event",
        quantity: String(quantity),
      },
      customer_email: user?.email || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (e: any) {
    console.error("Stripe checkout error:", e);
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

