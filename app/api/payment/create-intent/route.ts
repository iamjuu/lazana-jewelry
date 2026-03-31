import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";

function buildReceipt(orderId: string) {
  return `ord_${orderId}`.slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== authUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Order already processed" },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser._id).lean<{
      name?: string;
      email?: string;
      phone?: string;
    } | null>();

    const currency = "INR";
    const amount = Math.round(order.amount * 100);

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order amount" },
        { status: 400 }
      );
    }

    if (order.currency !== currency) {
      order.currency = currency;
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt: buildReceipt(order._id.toString()),
      notes: {
        localOrderId: order._id.toString(),
        userId: authUser._id.toString(),
      },
    });

    order.paymentRef = razorpayOrder.id;
    order.paymentProvider = "razorpay";
    await order.save();

    return NextResponse.json({
      success: true,
      data: {
        provider: "razorpay",
        key: getRazorpayKeyId(),
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayOrderId: razorpayOrder.id,
        description: `Order #${order._id.toString().slice(-8)}`,
        prefill: {
          name: order.customerName || user?.name || "",
          email: order.customerEmail || user?.email || "",
          contact: order.shippingAddress?.phone || user?.phone || "",
        },
      },
      order,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
