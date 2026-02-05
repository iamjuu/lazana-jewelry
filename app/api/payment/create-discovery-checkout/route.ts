import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";
import connectDB from "@/lib/mongodb";
import DiscoverySession from "@/models/DiscoverySession";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    // Fetch full user document to get email
    const user = (await User.findById(authUser._id).lean()) as {
      email?: string;
      phone?: string;
      name?: string;
    } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { sessionId, formData } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 },
      );
    }

    // Fetch discovery session to verify it exists and get price
    const discoverySession = await DiscoverySession.findById(sessionId);
    if (!discoverySession) {
      return NextResponse.json(
        { success: false, message: "Discovery session not found" },
        { status: 404 },
      );
    }

    // Check if session is already booked
    if (
      (discoverySession.bookedSeats || 0) >= (discoverySession.totalSeats || 1)
    ) {
      return NextResponse.json(
        { success: false, message: "This session is already fully booked" },
        { status: 400 },
      );
    }

    // Get base URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      const origin = req.headers.get("origin");
      if (
        origin &&
        (origin.startsWith("http://") || origin.startsWith("https://"))
      ) {
        baseUrl = origin;
      } else {
        const host =
          req.headers.get("host") || req.headers.get("x-forwarded-host");
        const protocol =
          req.headers.get("x-forwarded-proto") ||
          (host?.includes("localhost") ? "http" : "https");
        baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";
      }
    }

    const amount = Math.round((discoverySession.price || 0) * 100); // Convert to cents

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid session price. Please set a price for this discovery session.",
        },
        { status: 400 },
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
              name: discoverySession.title || "Discovery Session",
              description: `${discoverySession.date || "TBD"} at ${discoverySession.startTime || "TBD"} - ${discoverySession.instructorName || "Yoga Session"}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/discoveryappointment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/discoveryappointment`,
      metadata: {
        userId: String(authUser._id),
        sessionId: sessionId,
        sessionType: "discovery",
        date: discoverySession.date || "",
        time: discoverySession.startTime || "",
        formData: JSON.stringify(formData || {}),
      },
      customer_email: user.email || undefined,
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
      { status },
    );
  }
}
