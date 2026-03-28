import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";
import { validateEventCoupon } from "@/lib/coupon-validation";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";

function buildReceipt(eventId: string) {
  return `evt_${eventId}`.slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const user = (await User.findById(authUser._id).lean()) as {
      name?: string;
      email?: string;
      phone?: string;
    } | null;

    const body = await req.json();
    const { eventId, quantity = 1, couponCode, couponId } = body;

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

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const availableSlots = (event.totalSeats || 0) - (event.bookedSeats || 0);
    if (availableSlots <= 0) {
      return NextResponse.json(
        { success: false, message: "This event is fully booked" },
        { status: 400 }
      );
    }

    if (quantity > availableSlots) {
      return NextResponse.json(
        { success: false, message: `Only ${availableSlots} slot${availableSlots > 1 ? "s" : ""} available` },
        { status: 400 }
      );
    }

    let finalDiscountAmount = 0;
    if (couponCode && couponId) {
      const totalPrice = (event.price || 0) * quantity;
      const validation = await validateEventCoupon(
        couponCode,
        String(authUser._id),
        eventId,
        totalPrice
      );

      if (!validation.valid || validation.coupon?._id?.toString() !== couponId) {
        return NextResponse.json(
          { success: false, message: validation.message || "Invalid coupon code" },
          { status: 400 }
        );
      }

      finalDiscountAmount = validation.discountAmount || 0;
    }

    const baseAmount = Math.round((event.price || 0) * 100);
    const discountAmountCents = Math.round(finalDiscountAmount * 100);
    const totalAmount = Math.max(1, baseAmount * quantity - discountAmountCents);

    if (baseAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event price" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount,
      currency: "USD",
      receipt: buildReceipt(event._id.toString()),
      notes: {
        userId: String(authUser._id),
        sessionType: "event",
        eventId: event._id.toString(),
        quantity: String(quantity),
        couponCode: couponCode || "",
        couponId: couponId || "",
        discountAmount: String(finalDiscountAmount || 0),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        key: getRazorpayKeyId(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        description: `${event.title} - ${event.date} at ${event.time}`,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
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
