import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

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

    // Fetch order
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

    // Create Stripe Payment Intent with SGD currency - Card payments only
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100), // Convert to cents
      currency: "sgd",
      payment_method_types: ["card"], // Only allow card payments
      metadata: {
        orderId: order._id.toString(),
        userId: order.userId,
      },
      description: `Order #${order._id.toString().slice(-8)}`,
      receipt_email: order.customerEmail,
    });

    // Update order with payment reference
    order.paymentRef = paymentIntent.id;
    order.paymentProvider = "stripe";
    await order.save();

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      order,
    });
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

