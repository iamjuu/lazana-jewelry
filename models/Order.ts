import mongoose, { Schema, models, model } from "mongoose";
import type { Order as OrderType, OrderItem, OrderStatusUpdate, DeliveryStatusUpdate, DeliveryCharges, ShippingAddress } from "@/types";

const OrderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  isSet: { type: Boolean, default: false },
  imageUrl: { type: String, required: false }, // Product image URL for display in emails and order details
});

const DeliveryChargesSchema = new Schema<DeliveryCharges>({
  method: { 
    type: String, 
    enum: ["Air Express", "Air Economy"], // Keep Air Economy for backward compatibility with old orders
    required: true,
    default: "Air Express"
  },
  breakdown: { type: String, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const ShippingAddressSchema = new Schema<ShippingAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const OrderStatusUpdateSchema = new Schema<OrderStatusUpdate>({
  status: { type: String, required: true }, // Removed enum to allow backward compatibility
  message: { type: String },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const DeliveryStatusUpdateSchema = new Schema<DeliveryStatusUpdate>({
  deliveryStatus: { type: String, enum: ["pending", "processing", "ready to ship", "shipped", "reached to your country", "on the way to delivery", "delivered"], required: true },
  message: { type: String },
  updatedAt: { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
}, { _id: false });

const OrderSchema = new Schema<OrderType>(
  {
    userId: { type: String, required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    productTotal: { type: Number, required: true },
    deliveryCharges: { type: DeliveryChargesSchema, required: true },
    amount: { type: Number, required: true }, // productTotal + deliveryCharges.total
    currency: { type: String, default: "SGD" },
    status: { 
      type: String, 
      default: "pending",
      validate: {
        validator: function(v: string) {
          // For new values, validate; old invalid values will be cleaned by pre-save hook
          return !v || ["pending", "paid", "cancelled", "failed"].includes(v);
        },
        message: 'Invalid payment status. Must be one of: pending, paid, cancelled, failed'
      }
    }, // Payment status
    deliveryStatus: { type: String, enum: ["pending", "processing", "ready to ship", "shipped", "reached to your country", "on the way to delivery", "delivered"], default: "pending" }, // Delivery status
    statusHistory: { type: [OrderStatusUpdateSchema], default: [] }, // Payment status history
    deliveryStatusHistory: { type: [DeliveryStatusUpdateSchema], default: [] }, // Delivery status history
    currentMessage: { type: String },
    customerComments: { type: String },
    paymentProvider: { type: String, enum: ["stripe"] },
    paymentRef: { type: String, index: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    customerEmail: { type: String, required: true },
    customerName: { type: String, required: true },
    couponCode: { type: String },
    couponId: { type: String },
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save hook to clean invalid status values from old data
OrderSchema.pre('save', function(next) {
  const validPaymentStatuses = ["pending", "paid", "cancelled", "failed"];
  
  // Clean invalid payment status in statusHistory
  if (this.statusHistory && Array.isArray(this.statusHistory)) {
    this.statusHistory = this.statusHistory.filter((entry: any) => {
      return entry && entry.status && validPaymentStatuses.includes(entry.status);
    });
  }
  
  // Ensure current status is valid, default to "pending" if not
  if (this.status && !validPaymentStatuses.includes(this.status)) {
    // If status is invalid (like "processing"), check if there's a valid status in history
    const lastValidStatus = this.statusHistory && this.statusHistory.length > 0 
      ? this.statusHistory[this.statusHistory.length - 1]?.status 
      : null;
    this.status = (lastValidStatus && validPaymentStatuses.includes(lastValidStatus)) ? lastValidStatus : "pending";
  }
  
  next();
});

// Clear the model if it exists to force recompilation with new schema
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default model<OrderType>("Order", OrderSchema);



