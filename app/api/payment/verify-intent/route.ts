import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import {
  sendOrderPlacementNotificationToAdmin,
  sendUniversalProductOrderNotificationToAdmin,
  sendUniversalProductOrderConfirmationToUser,
  sendRegularProductOrderConfirmationToUser,
} from "@/lib/email";
import { recordCouponUsage } from "@/lib/coupon-validation";
import {
  getRazorpayInstance,
  verifyRazorpaySignature,
} from "@/lib/razorpay";

async function sendOrderEmails(updatedOrder: any) {
  const productIds = updatedOrder.items.map((item: any) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((product: any) => [product._id.toString(), product]));

  const universalItems: any[] = [];
  const regularItems: any[] = [];

  updatedOrder.items.forEach((item: any) => {
    const product = productMap.get(item.productId);
    if (product?.relativeproduct === true) {
      universalItems.push(item);
    } else {
      regularItems.push(item);
    }
  });

  const hasUniversalProduct = universalItems.length > 0;
  const hasRegularProduct = regularItems.length > 0;

  const calculateTotals = (items: any[]) => {
    const itemProductTotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    let itemDeliveryCharges = 0;
    if (items.length > 0 && !hasUniversalProduct) {
      itemDeliveryCharges = updatedOrder.deliveryCharges?.total || 0;
    }
    return {
      itemProductTotal,
      itemDeliveryCharges,
      itemTotal: itemProductTotal + itemDeliveryCharges,
    };
  };

  if (hasUniversalProduct && hasRegularProduct) {
    const regularTotals = calculateTotals(regularItems);
    const universalTotals = calculateTotals(universalItems);

    const regularOrderEmailData = {
      orderId: updatedOrder._id.toString(),
      customerName: updatedOrder.customerName,
      customerEmail: updatedOrder.customerEmail,
      userId: updatedOrder.userId,
      items: regularItems.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        isSet: item.isSet,
        imageUrl: item.imageUrl || undefined,
      })),
      productTotal: regularTotals.itemProductTotal,
      deliveryMethod: updatedOrder.deliveryCharges?.method || "",
      deliveryCharges: regularTotals.itemDeliveryCharges,
      totalAmount: regularTotals.itemTotal,
      shippingAddress: updatedOrder.shippingAddress,
      customerComments: updatedOrder.customerComments || "",
      couponCode: updatedOrder.couponCode,
      discountAmount: 0,
      createdAt: updatedOrder.createdAt.toISOString(),
    };

    const universalOrderEmailData = {
      orderId: updatedOrder._id.toString(),
      customerName: updatedOrder.customerName,
      customerEmail: updatedOrder.customerEmail,
      userId: updatedOrder.userId,
      items: universalItems.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        isSet: item.isSet,
        imageUrl: item.imageUrl || undefined,
      })),
      productTotal: universalTotals.itemProductTotal,
      deliveryMethod: "",
      deliveryCharges: 0,
      totalAmount: universalTotals.itemProductTotal,
      shippingAddress: updatedOrder.shippingAddress,
      customerComments: updatedOrder.customerComments || "",
      couponCode: updatedOrder.couponCode,
      discountAmount: updatedOrder.discountAmount || 0,
      createdAt: updatedOrder.createdAt.toISOString(),
    };

    sendRegularProductOrderConfirmationToUser(regularOrderEmailData).catch((error) => {
      console.error("Failed to send regular product order confirmation email to user:", error);
    });
    sendUniversalProductOrderConfirmationToUser(universalOrderEmailData).catch((error) => {
      console.error("Failed to send universal product order confirmation email to user:", error);
    });
    sendOrderPlacementNotificationToAdmin(regularOrderEmailData).catch((error) => {
      console.error("Failed to send regular product order notification email to admin:", error);
    });
    sendUniversalProductOrderNotificationToAdmin(universalOrderEmailData).catch((error) => {
      console.error("Failed to send universal product order notification email to admin:", error);
    });
    return;
  }

  const orderEmailData = {
    orderId: updatedOrder._id.toString(),
    customerName: updatedOrder.customerName,
    customerEmail: updatedOrder.customerEmail,
    userId: updatedOrder.userId,
    items: updatedOrder.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      isSet: item.isSet,
      imageUrl: item.imageUrl || undefined,
    })),
    productTotal: updatedOrder.productTotal,
    deliveryMethod: updatedOrder.deliveryCharges?.method || "",
    deliveryCharges: updatedOrder.deliveryCharges?.total || 0,
    totalAmount: updatedOrder.amount,
    shippingAddress: updatedOrder.shippingAddress,
    customerComments: updatedOrder.customerComments || "",
    couponCode: updatedOrder.couponCode,
    discountAmount: updatedOrder.discountAmount || 0,
    createdAt: updatedOrder.createdAt.toISOString(),
  };

  if (hasUniversalProduct) {
    sendUniversalProductOrderConfirmationToUser(orderEmailData).catch((error) => {
      console.error("Failed to send universal product order confirmation email to user:", error);
    });
    sendUniversalProductOrderNotificationToAdmin(orderEmailData).catch((error) => {
      console.error("Failed to send universal product order notification email to admin:", error);
    });
    return;
  }

  sendRegularProductOrderConfirmationToUser(orderEmailData).catch((error) => {
    console.error("Failed to send regular product order confirmation email to user:", error);
  });
  sendOrderPlacementNotificationToAdmin(orderEmailData).catch((error) => {
    console.error("Failed to send order placement email to admin:", error);
  });
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay payment details" },
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

    if (order.status === "paid") {
      return NextResponse.json({ success: true, data: order });
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

    const expectedAmount = Math.round(order.amount * 100);

    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: "Payment does not belong to this order" },
        { status: 400 }
      );
    }

    if (providerOrder.notes?.localOrderId !== order._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Payment order mismatch" },
        { status: 400 }
      );
    }

    if (providerOrder.notes?.userId !== authUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Payment belongs to a different user" },
        { status: 403 }
      );
    }

    if (payment.amount !== expectedAmount) {
      return NextResponse.json(
        { success: false, message: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    if (payment.currency !== (order.currency || "USD").toUpperCase()) {
      return NextResponse.json(
        { success: false, message: "Payment currency mismatch" },
        { status: 400 }
      );
    }

    if (!["authorized", "captured"].includes(payment.status)) {
      return NextResponse.json(
        { success: false, message: `Payment status: ${payment.status}` },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: "paid",
          paymentProvider: "razorpay",
          paymentRef: razorpayPaymentId,
        },
        $push: {
          statusHistory: {
            status: "paid",
            message: "Payment completed successfully via Razorpay",
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Failed to update order" },
        { status: 500 }
      );
    }

    if (updatedOrder.couponId && updatedOrder.couponCode) {
      try {
        await recordCouponUsage(
          updatedOrder.couponId,
          "product",
          updatedOrder.userId
        );
      } catch (couponError: any) {
        console.error("Failed to record coupon usage:", couponError);
      }
    }

    await sendOrderEmails(updatedOrder);

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    const status = error?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to verify payment" },
      { status }
    );
  }
}
