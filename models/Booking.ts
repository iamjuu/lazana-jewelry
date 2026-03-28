import mongoose, { Schema, models, model } from "mongoose";
import type { Booking as BookingType } from "@/types";

const BookingSchema = new Schema<BookingType>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    seats: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    phone: { type: String, required: false },
    comment: { type: String, required: false },
    paymentProvider: { type: String, enum: ["stripe", "razorpay", "paypal", "bank_transfer"], required: false },
    paymentRef: { type: String, required: false },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    sessionType: { type: String, enum: ["discovery", "private", "corporate", "event"], required: true, index: true },
    slotId: { type: String, required: false },
    couponCode: { type: String, required: false },
    couponId: { type: String, required: false },
    discountAmount: { type: Number, required: false },
  },
  { timestamps: true }
);

// Compound index for faster queries
BookingSchema.index({ userId: 1, sessionType: 1 });
BookingSchema.index({ sessionId: 1, sessionType: 1 });

export default (models.Booking as mongoose.Model<BookingType>) || model<BookingType>("Booking", BookingSchema);



