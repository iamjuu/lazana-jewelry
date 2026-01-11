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

          // Check if order contains universal products and regular products
          const productIds = updatedOrder.items.map((item: any) => item.productId);
          const products = await Product.find({ _id: { $in: productIds } }).lean();
          
          // Create a map of productId to product for quick lookup
          const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
          
          // Separate items into universal and regular products
          const universalItems: any[] = [];
          const regularItems: any[] = [];
          
          updatedOrder.items.forEach((item: any) => {
            const product = productMap.get(item.productId);
            if (product && product.relativeproduct === true) {
              universalItems.push(item);
            } else {
              regularItems.push(item);
            }
          });
          
          const hasUniversalProduct = universalItems.length > 0;
          const hasRegularProduct = regularItems.length > 0;

          // Helper function to calculate totals for a subset of items
          const calculateTotals = (items: any[]) => {
            const itemProductTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            // For universal products, delivery charges are 0, but for regular products we need to calculate
            // For now, we'll use a proportional split based on product total, or we can recalculate delivery
            // Let's use the full delivery charges for regular products if they exist, 0 for universal
            let itemDeliveryCharges = 0;
            if (items.length > 0 && !hasUniversalProduct) {
              itemDeliveryCharges = updatedOrder.deliveryCharges?.total || 0;
            }
            const itemTotal = itemProductTotal + itemDeliveryCharges;
            return { itemProductTotal, itemDeliveryCharges, itemTotal };
          };

          // Send emails based on what products are in the order
          if (hasUniversalProduct && hasRegularProduct) {
            // Order has both - send separate emails for each type
            
            // Calculate totals for regular products
            const regularTotals = calculateTotals(regularItems);
            
            // Regular product email data
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
              discountAmount: 0, // Coupon applies to entire order, so we'll show it only in one email
              createdAt: updatedOrder.createdAt.toISOString(),
            };

            // Universal product email data
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
              productTotal: calculateTotals(universalItems).itemProductTotal,
              deliveryMethod: "",
              deliveryCharges: 0,
              totalAmount: calculateTotals(universalItems).itemProductTotal,
              shippingAddress: updatedOrder.shippingAddress,
              customerComments: updatedOrder.customerComments || "",
              couponCode: updatedOrder.couponCode,
              discountAmount: updatedOrder.discountAmount || 0, // Show coupon discount in universal email
              createdAt: updatedOrder.createdAt.toISOString(),
            };

            // Send both emails to user
            sendRegularProductOrderConfirmationToUser(regularOrderEmailData).catch((error) => {
              console.error("Failed to send regular product order confirmation email to user:", error);
            });
            sendUniversalProductOrderConfirmationToUser(universalOrderEmailData).catch((error) => {
              console.error("Failed to send universal product order confirmation email to user:", error);
            });

            // Send both emails to admin
            sendOrderPlacementNotificationToAdmin(regularOrderEmailData).catch((error) => {
              console.error("Failed to send regular product order notification email to admin:", error);
            });
            sendUniversalProductOrderNotificationToAdmin(universalOrderEmailData).catch((error) => {
              console.error("Failed to send universal product order notification email to admin:", error);
            });
          } else {
            // Order has only one type - send single email
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

            // Send email to user
            if (hasUniversalProduct) {
              sendUniversalProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                console.error("Failed to send universal product order confirmation email to user:", error);
              });
            } else {
              sendRegularProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                console.error("Failed to send regular product order confirmation email to user:", error);
              });
            }

            // Send email notification to admin
            if (hasUniversalProduct) {
              sendUniversalProductOrderNotificationToAdmin(orderEmailData).catch((error) => {
                console.error("Failed to send universal product order notification email to admin:", error);
              });
            } else {
              sendOrderPlacementNotificationToAdmin(orderEmailData).catch((error) => {
                console.error("Failed to send order placement email to admin:", error);
              });
            }
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

            // Check if order contains universal products and regular products
            const productIds = updatedOrder.items.map((item: any) => item.productId);
            const products = await Product.find({ _id: { $in: productIds } }).lean();
            
            // Create a map of productId to product for quick lookup
            const productMap2 = new Map(products.map((p: any) => [p._id.toString(), p]));
            
            // Separate items into universal and regular products
            const universalItems2: any[] = [];
            const regularItems2: any[] = [];
            
            updatedOrder.items.forEach((item: any) => {
              const product = productMap2.get(item.productId);
              if (product && product.relativeproduct === true) {
                universalItems2.push(item);
              } else {
                regularItems2.push(item);
              }
            });
            
            const hasUniversalProduct2 = universalItems2.length > 0;
            const hasRegularProduct2 = regularItems2.length > 0;

            // Helper function to calculate totals for a subset of items
            const calculateTotals2 = (items: any[]) => {
              const itemProductTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
              let itemDeliveryCharges = 0;
              if (items.length > 0 && !hasUniversalProduct2) {
                itemDeliveryCharges = updatedOrder.deliveryCharges?.total || 0;
              }
              const itemTotal = itemProductTotal + itemDeliveryCharges;
              return { itemProductTotal, itemDeliveryCharges, itemTotal };
            };

            // Send emails based on what products are in the order
            if (hasUniversalProduct2 && hasRegularProduct2) {
              // Order has both - send separate emails for each type
              
              // Calculate totals for regular products
              const regularTotals2 = calculateTotals2(regularItems2);
              
              // Regular product email data
              const regularOrderEmailData2 = {
                orderId: updatedOrder._id.toString(),
                customerName: updatedOrder.customerName,
                customerEmail: updatedOrder.customerEmail,
                userId: updatedOrder.userId,
                items: regularItems2.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  isSet: item.isSet,
                  imageUrl: item.imageUrl || undefined,
                })),
                productTotal: regularTotals2.itemProductTotal,
                deliveryMethod: updatedOrder.deliveryCharges?.method || "",
                deliveryCharges: regularTotals2.itemDeliveryCharges,
                totalAmount: regularTotals2.itemTotal,
                shippingAddress: updatedOrder.shippingAddress,
                customerComments: updatedOrder.customerComments || "",
                couponCode: updatedOrder.couponCode,
                discountAmount: 0,
                createdAt: updatedOrder.createdAt.toISOString(),
              };

              // Universal product email data
              const universalOrderEmailData2 = {
                orderId: updatedOrder._id.toString(),
                customerName: updatedOrder.customerName,
                customerEmail: updatedOrder.customerEmail,
                userId: updatedOrder.userId,
                items: universalItems2.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  isSet: item.isSet,
                  imageUrl: item.imageUrl || undefined,
                })),
                productTotal: calculateTotals2(universalItems2).itemProductTotal,
                deliveryMethod: "",
                deliveryCharges: 0,
                totalAmount: calculateTotals2(universalItems2).itemProductTotal,
                shippingAddress: updatedOrder.shippingAddress,
                customerComments: updatedOrder.customerComments || "",
                couponCode: updatedOrder.couponCode,
                discountAmount: updatedOrder.discountAmount || 0,
                createdAt: updatedOrder.createdAt.toISOString(),
              };

              // Send both emails to user
              sendRegularProductOrderConfirmationToUser(regularOrderEmailData2).catch((error) => {
                console.error("Failed to send regular product order confirmation email to user:", error);
              });
              sendUniversalProductOrderConfirmationToUser(universalOrderEmailData2).catch((error) => {
                console.error("Failed to send universal product order confirmation email to user:", error);
              });

              // Send both emails to admin
              sendOrderPlacementNotificationToAdmin(regularOrderEmailData2).catch((error) => {
                console.error("Failed to send regular product order notification email to admin:", error);
              });
              sendUniversalProductOrderNotificationToAdmin(universalOrderEmailData2).catch((error) => {
                console.error("Failed to send universal product order notification email to admin:", error);
              });
            } else {
              // Order has only one type - send single email
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

              // Send email to user
              if (hasUniversalProduct2) {
                sendUniversalProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                  console.error("Failed to send universal product order confirmation email to user:", error);
                });
              } else {
                sendRegularProductOrderConfirmationToUser(orderEmailData).catch((error) => {
                  console.error("Failed to send regular product order confirmation email to user:", error);
                });
              }

              // Send email notification to admin
              if (hasUniversalProduct2) {
                sendUniversalProductOrderNotificationToAdmin(orderEmailData).catch((error) => {
                  console.error("Failed to send universal product order notification email to admin:", error);
                });
              } else {
                sendOrderPlacementNotificationToAdmin(orderEmailData).catch((error) => {
                  console.error("Failed to send order placement email to admin:", error);
                });
              }
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

