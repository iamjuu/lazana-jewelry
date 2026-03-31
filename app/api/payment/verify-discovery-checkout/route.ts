import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import SessionEnquiry from "@/models/SessionEnquiry";
import DiscoverySession from "@/models/DiscoverySession";
import {
  sendDiscoverySessionConfirmation,
  sendDiscoverySessionNotificationToAdmin,
} from "@/lib/email";
import {
  getRazorpayInstance,
  verifyRazorpaySignature,
} from "@/lib/razorpay";

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

    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      formData,
    } = await req.json();

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay payment details" },
        { status: 400 }
      );
    }

    const isAuthentic = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isAuthentic) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    const [payment, providerOrder] = await Promise.all([
      razorpay.payments.fetch(razorpayPaymentId),
      razorpay.orders.fetch(razorpayOrderId),
    ]);

    const metadata = providerOrder.notes;
    if (
      !metadata ||
      metadata.sessionType !== "discovery" ||
      !metadata.discoverySessionId ||
      metadata.userId !== String(authUser._id)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: "Payment does not belong to this order" },
        { status: 400 }
      );
    }

    if (!["authorized", "captured"].includes(payment.status)) {
      return NextResponse.json(
        { success: false, message: `Payment status: ${payment.status}` },
        { status: 400 }
      );
    }

    const discoverySessionId = metadata.discoverySessionId;
    const discoverySession = await DiscoverySession.findById(discoverySessionId);
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

    const expectedAmount = Math.round((discoverySession.price || 0) * 100);
    if (payment.amount !== expectedAmount || payment.currency !== "INR") {
      return NextResponse.json(
        { success: false, message: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    const existingBooking = await SessionEnquiry.findOne({
      userId: authUser._id,
      sessionId: discoverySessionId,
      sessionType: "discovery",
      paymentRef: razorpayPaymentId,
    });

    let booking = existingBooking;
    if (!booking) {
      const commentData = {
        date: discoverySession.date || "TBD",
        time: discoverySession.startTime || "TBD",
        answers: typeof formData === "object" && formData ? formData : {},
      };

      booking = await SessionEnquiry.create({
        userId: authUser._id,
        sessionId: discoverySessionId,
        sessionType: "discovery",
        seats: 1,
        amount: payment.amount / 100,
        status: "pending",
        paymentProvider: "razorpay",
        paymentRef: razorpayPaymentId,
        paymentStatus: "paid",
        fullName: user.name || "User",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        services: `Discovery Session - ${discoverySession.date || "TBD"}`,
        comment: JSON.stringify(commentData),
        bookedDate: discoverySession.date,
        bookedTime: discoverySession.startTime,
      });

      discoverySession.bookedSeats = (discoverySession.bookedSeats || 0) + 1;
      await discoverySession.save();

      if (user.email) {
        sendDiscoverySessionConfirmation({
          selectedDate: discoverySession.date || "TBD",
          selectedTime: discoverySession.startTime || "TBD",
          email: user.email,
          userName: user.name || "User",
        }).catch((error) => {
          console.error(
            "Failed to send discovery session confirmation email to user:",
            error
          );
        });
      }

      sendDiscoverySessionNotificationToAdmin({
        userName: user.name || "User",
        userEmail: user.email || "N/A",
        userPhone: user.phone || "N/A",
        selectedDate: discoverySession.date || "TBD",
        selectedTime: discoverySession.startTime || "TBD",
        amount: payment.amount / 100,
      }).catch((error) => {
        console.error(
          "Failed to send discovery session notification email to admin:",
          error
        );
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
