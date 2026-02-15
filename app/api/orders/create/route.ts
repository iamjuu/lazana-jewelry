import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    // Fetch full user data to get email
    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      items,
      productTotal,
      deliveryCharges,
      amount,
      shippingAddress,
      customerComments,
      couponCode,
      couponId,
      discountAmount,
    } = body;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items in order" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street) {
      return NextResponse.json(
        { success: false, message: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    // Save shipping address to user profile
    try {
      user.address = {
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zipCode: shippingAddress.postalCode || "",
        country: shippingAddress.country || "",
      };
      await user.save();
      console.log(`✅ Shipping address saved to user profile for user ${user._id}`);
    } catch (addressError) {
      // Log error but don't fail order creation
      console.error("Failed to save address to user profile:", addressError);
    }

    // Create order
    const order = await Order.create({
      userId: user._id.toString(),
      items,
      productTotal,
      deliveryCharges,
      amount,
      currency: "USD",
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          message: "Order created, awaiting payment",
          updatedAt: new Date(),
        },
      ],
      deliveryStatus: "pending",
      deliveryStatusHistory: [
        {
          deliveryStatus: "pending",
          message: "Order created, awaiting payment",
          updatedAt: new Date(),
        },
      ],
      customerComments: customerComments || "",
      shippingAddress,
      customerEmail: user.email,
      customerName: shippingAddress.fullName,
      couponCode: couponCode || undefined,
      couponId: couponId || undefined,
      discountAmount: discountAmount || 0,
    });

    // NOTE: Email will be sent AFTER successful payment, not here

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
