import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Event from "@/models/Event";
import User from "@/models/User";
import EventCoupon from "@/models/EventCoupon";
import mongoose from "mongoose";
import {
  sendEventBookingConfirmationToUser,
  sendEventBookingNotificationToAdmin,
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
      metadata.sessionType !== "event" ||
      !metadata.eventId ||
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

    const eventId = metadata.eventId;
    const quantity = metadata.quantity ? parseInt(String(metadata.quantity), 10) : 1;
    const couponCode = metadata.couponCode ? String(metadata.couponCode) : null;
    const couponId = metadata.couponId ? String(metadata.couponId) : null;
    const discountAmount = metadata.discountAmount ? parseFloat(String(metadata.discountAmount)) : 0;

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (availableSlots < quantity) {
      return NextResponse.json(
        { success: false, message: `Only ${availableSlots} slot${availableSlots > 1 ? "s" : ""} available now` },
        { status: 400 }
      );
    }

    const expectedAmount =
      Math.round((event.price || 0) * 100) * quantity -
      Math.round(discountAmount * 100);
    if (payment.amount !== Math.max(1, expectedAmount) || payment.currency !== "INR") {
      return NextResponse.json(
        { success: false, message: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    const existingBooking = await Booking.findOne({
      userId: authUser._id,
      sessionId: eventId,
      sessionType: "event",
      paymentRef: razorpayPaymentId,
    });

    let booking = existingBooking;
    if (!booking) {
      const bookingData: any = {
        userId: authUser._id,
        sessionId: eventId,
        sessionType: "event",
        seats: quantity,
        amount: payment.amount / 100,
        status: "confirmed",
        paymentProvider: "razorpay",
        paymentRef: razorpayPaymentId,
        paymentStatus: "paid",
        phone: user.phone || "N/A",
        comment: `Event: ${event.title} - ${event.date} at ${event.time} (${quantity} slot${quantity > 1 ? "s" : ""})`,
      };

      if (couponCode && couponId) {
        bookingData.couponCode = couponCode;
        bookingData.couponId = couponId;
        bookingData.discountAmount = discountAmount;
      }

      booking = await Booking.create(bookingData);

      if (couponId && couponCode) {
        try {
          const coupon = await EventCoupon.findById(couponId);
          if (coupon) {
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            if (!coupon.userUsage) {
              coupon.userUsage = [];
            }

            const userUsageIndex = coupon.userUsage.findIndex(
              (usage: any) => String(usage.userId) === String(authUser._id)
            );

            if (userUsageIndex >= 0) {
              coupon.userUsage[userUsageIndex].count =
                (coupon.userUsage[userUsageIndex].count || 0) + 1;
              coupon.userUsage[userUsageIndex].lastUsedAt = new Date();
            } else {
              coupon.userUsage.push({
                userId: new mongoose.Types.ObjectId(authUser._id),
                count: 1,
                lastUsedAt: new Date(),
              });
            }

            await coupon.save();
          }
        } catch (error) {
          console.error("Error recording coupon usage:", error);
        }
      }

      event.bookedSeats = (event.bookedSeats || 0) + quantity;
      await event.save();

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
