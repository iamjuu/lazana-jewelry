import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import DiscoverySession from "@/models/DiscoverySession";
import User from "@/models/User";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";

function buildReceipt(sessionId: string) {
  return `disc_${sessionId}`.slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const user = (await User.findById(authUser._id).lean()) as {
      email?: string;
      phone?: string;
      name?: string;
    } | null;

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

    const discoverySession = await DiscoverySession.findById(sessionId);
    if (!discoverySession) {
      return NextResponse.json(
        { success: false, message: "Discovery session not found" },
        { status: 404 }
      );
    }

    if ((discoverySession.bookedSeats || 0) >= (discoverySession.totalSeats || 1)) {
      return NextResponse.json(
        { success: false, message: "This session is already fully booked" },
        { status: 400 }
      );
    }

    const amount = Math.round((discoverySession.price || 0) * 100);
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid session price. Please set a price for this discovery session.",
        },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: buildReceipt(discoverySession._id.toString()),
      notes: {
        userId: String(authUser._id),
        sessionType: "discovery",
        discoverySessionId: discoverySession._id.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        key: getRazorpayKeyId(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        description: `${discoverySession.title || "Discovery Session"} - ${discoverySession.date || "TBD"} at ${discoverySession.startTime || "TBD"}`,
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || "",
        },
      },
    });
  } catch (e: any) {
    console.error("Razorpay order creation error:", e);
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}
