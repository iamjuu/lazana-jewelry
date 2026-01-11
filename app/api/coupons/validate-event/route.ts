import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateEventCoupon } from "@/lib/coupon-validation";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const body = await req.json();
    const { couponCode, eventId } = body;

    if (!couponCode || !couponCode.trim()) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch event to get price
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const eventPrice = (event.price || 0);
    const quantity = body.quantity || 1;
    const totalPrice = eventPrice * quantity;

    if (totalPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event price" },
        { status: 400 }
      );
    }

    const validation = await validateEventCoupon(
      couponCode,
      authUser._id.toString(),
      eventId,
      totalPrice
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message || "Invalid coupon code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: validation.coupon,
        discountAmount: validation.discountAmount,
        discountPercent: validation.coupon?.discountPercent || 0,
        originalAmount: totalPrice,
        finalAmount: Math.max(0, totalPrice - (validation.discountAmount || 0)),
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: "Error validating coupon. Please try again." },
      { status: 500 }
    );
  }
}





