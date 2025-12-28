import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusUpdateToUser } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const { status, deliveryStatus, message, clearMessage } = body;

    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Handle clear message request
    if (clearMessage === true) {
      // Use $unset to completely remove the currentMessage field from the document
      await Order.findByIdAndUpdate(
        id, 
        { $unset: { currentMessage: "" } }, 
        { runValidators: false, new: true }
      );
      const updatedOrder = await Order.findById(id).lean();
      return NextResponse.json({
        success: true,
        data: updatedOrder,
      });
    }

    // Handle payment status update (status field)
    if (status !== undefined) {
      const validPaymentStatuses = ["pending", "paid", "cancelled", "failed"];
      if (!validPaymentStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid payment status" },
          { status: 400 }
        );
      }

      order.status = status;
      
      // Add to payment status history
      order.statusHistory.push({
        status,
        message: message || "",
        updatedAt: new Date(),
      });
    }

    // Handle delivery status update (deliveryStatus field) - triggers email for specific statuses
    if (deliveryStatus !== undefined) {
      const validDeliveryStatuses = ["pending", "processing", "ready to ship", "shipped", "reached to your country", "on the way to delivery", "delivered"];
      if (!validDeliveryStatuses.includes(deliveryStatus)) {
        return NextResponse.json(
          { success: false, message: "Invalid delivery status" },
          { status: 400 }
        );
      }

      const emailStatuses = ["processing", "ready to ship", "reached to your country", "delivered"];
      const shouldSendEmail = emailStatuses.includes(deliveryStatus);

      order.deliveryStatus = deliveryStatus;
      
      // Add to delivery status history with email tracking
      const statusUpdate: any = {
        deliveryStatus,
        message: message || "",
        updatedAt: new Date(),
        emailSent: false,
      };

      // Send email notification to user for specific delivery status updates
      if (shouldSendEmail) {
        try {
          await sendOrderStatusUpdateToUser({
            orderId: order._id.toString(),
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            deliveryStatus,
            message: message || "",
            items: order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              isSet: item.isSet || false,
            })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.amount,
          });
          statusUpdate.emailSent = true;
          statusUpdate.emailSentAt = new Date();
        } catch (error) {
          console.error("Failed to send order status update email:", error);
          statusUpdate.emailSent = false;
        }
      }

      order.deliveryStatusHistory.push(statusUpdate);
    }

    // Handle message-only update (does not trigger email)
    if (message !== undefined && status === undefined && deliveryStatus === undefined) {
      order.currentMessage = message;
    } else if (message && (status !== undefined || deliveryStatus !== undefined)) {
      // If updating status/deliveryStatus with message, also update currentMessage
      order.currentMessage = message;
    }

    // Save order - pre-save hook will clean invalid statusHistory entries
    try {
      await order.save();
    } catch (saveError: any) {
      // If save fails due to validation, try updating directly without validation
      if (saveError.name === 'ValidationError') {
        console.warn("Validation error on save, attempting direct update:", saveError.message);
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;
        if (message !== undefined) updateData.currentMessage = message;
        if (order.statusHistory?.length) updateData.statusHistory = order.statusHistory;
        if (order.deliveryStatusHistory?.length) updateData.deliveryStatusHistory = order.deliveryStatusHistory;
        
        await Order.findByIdAndUpdate(id, updateData, { runValidators: false });
        const updatedOrder = await Order.findById(id);
        return NextResponse.json({
          success: true,
          data: updatedOrder,
        });
      }
      throw saveError;
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}
