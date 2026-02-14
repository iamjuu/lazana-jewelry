import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import { sendSubscriptionNotificationToAdmin, sendSubscriptionConfirmationToUser } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (existingSubscriber) {
      return NextResponse.json(
        { success: false, message: "You are already subscribed with Crystal Bowl" },
        { status: 400 }
      );
    }

    // Create new subscriber
    const subscriber = await Subscriber.create({
      email: normalizedEmail,
    });

    // Send confirmation email to user (await so we can return error if email fails)
    try {
      await sendSubscriptionConfirmationToUser(normalizedEmail);
    } catch (emailError: any) {
      console.error("[Subscribe] Failed to send confirmation email:", emailError?.message || emailError);
      return NextResponse.json(
        { success: false, message: "Subscription saved but we could not send the confirmation email. Please try again later or contact us." },
        { status: 500 }
      );
    }

    // Send notification email to admin in background (non-blocking)
    sendSubscriptionNotificationToAdmin({
      email: normalizedEmail,
      subscribedAt: subscriber.createdAt?.toISOString() || new Date().toISOString(),
    }).catch((error) => {
      console.error("Failed to send subscription notification email to admin:", error);
    });

    return NextResponse.json(
      { success: true, message: "Successfully subscribed to our newsletter!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Subscription error:", error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000 || error.message?.includes("duplicate")) {
      return NextResponse.json(
        { success: false, message: "You are already subscribed with Crystal Bowl" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}

