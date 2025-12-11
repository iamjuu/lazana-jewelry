import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", );

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    const body = await req.json();
    const { slotId, amount, date, time } = body;

    if (!slotId || !amount || !date || !time) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Private Yoga Session",
              description: `${date} at ${time}`,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/privateappointment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/privateappointment`,
      metadata: {
        userId: user._id.toString(),
        slotId: slotId,
        sessionType: "private",
        date: date,
        time: time,
      },
      customer_email: user.email,
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

