import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";
import { 
  sendOrderPlacementNotificationToAdmin,
  sendUniversalProductOrderNotificationToAdmin,
  sendUniversalProductOrderConfirmationToUser,
  sendRegularProductOrderConfirmationToUser
} from "@/lib/email";
import { recordCouponUsage } from "@/lib/coupon-validation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const { orderId, paymentIntent: paymentIntentFromBody } = await req.json();

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

    // Verify order belongs to user
    if (order.userId !== authUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // If order is already paid, return success
    if (order.status === "paid") {
      return NextResponse.json({ success: true, data: order });
    }

    // Verify payment intent with Stripe - use paymentIntent from body if provided, otherwise use order.paymentRef
    const paymentIntentId = paymentIntentFromBody || order.paymentRef;
    
    if (paymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Check if payment succeeded or is processing (for async payments)
        if (intent.status === "succeeded") {
          // Payment successful - update order status using findByIdAndUpdate to avoid version conflicts
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
              $set: { status: "paid", paymentRef: paymentIntentId },
              $push: {
                statusHistory: {
                  status: "paid",
                  message: "Payment completed successfully",
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

          // Record coupon usage if coupon was used (only after successful payment)
          if (updatedOrder.couponId && updatedOrder.couponCode) {
            try {
              await recordCouponUsage(
                updatedOrder.couponId,
                "product",
                updatedOrder.userId
              );
              console.log(`✅ Coupon usage recorded for coupon ${updatedOrder.couponCode}`);
            } catch (couponError: any) {
              // Log error but don't fail the payment verification
              console.error("❌ Failed to record coupon usage:", couponError);
            }
          }

          // Check if order contains universal products
          const productIds = updatedOrder.items.map((item: any) => item.productId);
          const products = await Product.find({ _id: { $in: productIds } }).lean();
          const hasUniversalProduct = products.some((product: any) => product.relativeproduct === true);

          const orderEmailData = {
            orderId: updatedOrder._id.toString(),
            customerName: updatedOrder.customerName,
            customerEmail: updatedOrder.customerEmail,
            items: updatedOrder.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              isSet: item.isSet,
            })),
            productTotal: updatedOrder.productTotal,
            deliveryMethod: updatedOrder.deliveryCharges?.method || "",
            deliveryCharges: updatedOrder.deliveryCharges?.total || 0,
            totalAmount: updatedOrder.amount,
            shippingAddress: updatedOrder.shippingAddress,
            customerComments: updatedOrder.customerComments || "",
            createdAt: updatedOrder.createdAt.toISOString(),
          };

          // Send email to user (universal product vs regular product)
          if (hasUniversalProduct) {
            sendUniversalProductOrderConfirmationToUser(orderEmailData).catch((error) => {
              console.error("Failed to send universal product order confirmation email to user:", error);
            });
          } else {
            sendRegularProductOrderConfirmationToUser(orderEmailData).catch((error) => {
              console.error("Failed to send regular product order confirmation email to user:", error);
            });
          }

          // Send email notification to admin (universal product vs regular product)
          if (hasUniversalProduct) {
            sendUniversalProductOrderNotificationToAdmin(orderEmailData).catch((error) => {
              console.error("Failed to send universal product order notification email to admin:", error);
            });
          } else {
            sendOrderPlacementNotificationToAdmin(orderEmailData).catch((error) => {
              console.error("Failed to send order placement email to admin:", error);
            });
          }

          return NextResponse.json({ success: true, data: updatedOrder });
        } else if (intent.status === "processing") {
          // Payment is processing (common with some payment methods like ACH)
          // In this case, we can consider it successful but let user know it's processing
          return NextResponse.json({
            success: false,
            message: "Payment is processing. Your order will be confirmed once payment completes.",
            status: intent.status,
          });
        } else if (intent.status === "requires_capture") {
          // Payment requires manual capture
          const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
              $set: { status: "paid", paymentRef: paymentIntentId },
              $push: {
                statusHistory: {
                  status: "paid",
                  message: "Payment authorized - requires capture",
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
          
          return NextResponse.json({ success: true, data: updatedOrder });
        } else if (intent.status === "requires_payment_method") {
          // Payment method was not properly attached - user needs to retry
          return NextResponse.json(
            { success: false, message: "Payment method was not confirmed. Please try again from the checkout page." },
            { status: 400 }
          );
        } else if (intent.status === "requires_action" || intent.status === "requires_confirmation") {
          // Payment requires additional action (like 3D Secure) - should have been handled by redirect
          // Wait a moment and check again
          await new Promise(resolve => setTimeout(resolve, 2000));
          const updatedIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (updatedIntent.status === "succeeded") {
            const updatedOrder = await Order.findByIdAndUpdate(
              orderId,
              {
                $set: { status: "paid", paymentRef: paymentIntentId },
                $push: {
                  statusHistory: {
                    status: "paid",
                    message: "Payment completed successfully",
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

            // Check if order contains universal products
            const productIds = updatedOrder.items.map((item: any) => item.productId);
            const products = await Product.find({ _id: { $in: productIds } }).lean();
            const hasUniversalProduct = products.some((product: any) => product.relativeproduct === true);

            const orderEmailData = {
              orderId: updatedOrder._id.toString(),
              customerName: updatedOrder.customerName,
              customerEmail: updatedOrder.customerEmail,
              items: updatedOrder.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                isSet: item.isSet,
              })),
              productTotal: updatedOrder.productTotal,
              deliveryMethod: updatedOrder.deliveryCharges?.method || "",
              deliveryCharges: updatedOrder.deliveryCharges?.total || 0,
              totalAmount: updatedOrder.amount,
              shippingAddress: updatedOrder.shippingAddress,
              customerComments: updatedOrder.customerComments || "",
              createdAt: updatedOrder.createdAt.toISOString(),
            };

            // Send email to user (universal product vs regular product)
            if (hasUniversalProduct) {
              sendUniversalProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                console.error("Failed to send universal product order confirmation email to user:", error);
              });
            } else {
              sendRegularProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                console.error("Failed to send regular product order confirmation email to user:", error);
              });
            }

            // Send email notification to admin (universal product vs regular product)
            if (hasUniversalProduct) {
              sendUniversalProductOrderNotificationToAdmin(orderEmailData).catch((error) => {
                console.error("Failed to send universal product order notification email to admin:", error);
              });
            } else {
              sendOrderPlacementNotificationToAdmin(orderEmailData).catch((error) => {
                console.error("Failed to send order placement email to admin:", error);
              });
            }

            return NextResponse.json({ success: true, data: updatedOrder });
          }
          
          return NextResponse.json(
            { success: false, message: `Payment requires action: ${updatedIntent.status}. Please complete the authentication.` },
            { status: 400 }
          );
        } else {
          // Payment failed or other status
          return NextResponse.json(
            { success: false, message: `Payment status: ${intent.status}. Please try again or contact support if the issue persists.` },
            { status: 400 }
          );
        }
      } catch (stripeError: any) {
        console.error("Stripe verification error:", stripeError);
        return NextResponse.json(
          { success: false, message: `Payment verification failed: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "Payment reference not found" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Payment verification error:", error);
    const status = error?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to verify payment" },
      { status }
    );
  }
}

