import mongoose, { Schema, models, model } from "mongoose";

export interface EventCouponType {
  couponCode: string; // Coupon code (can be reused if previous coupon with same code is expired)
  couponName: string; // Display name for the coupon
  discountPercent: number; // Discount percentage (e.g., 10 for 10%)
  expiryDate: Date; // Expiry date
  excludedEvents?: mongoose.Types.ObjectId[]; // Events to exclude (these events won't be eligible for this coupon)
  usageLimit?: number | null; // Total number of times coupon can be used (optional, null = unlimited)
  usedCount?: number; // Number of times coupon has been used
  perUserLimit?: number | null; // Number of times a single user can use this coupon (optional, null = unlimited)
  userUsage?: Array<{ // Track which users used this coupon and how many times
    userId: mongoose.Types.ObjectId;
    count: number;
    lastUsedAt: Date;
  }>;
  isActive: boolean; // Whether coupon is active
  createdAt?: Date;
  updatedAt?: Date;
}

const EventCouponSchema = new Schema<EventCouponType>(
  {
    couponCode: {
      type: String,
      required: true,
      // Removed unique constraint - can reuse codes if previous coupon is expired
      trim: true,
      uppercase: true,
    },
    couponName: {
      type: String,
      required: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    excludedEvents: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: null, // null means unlimited per user
      min: 1,
    },
    userUsage: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      count: {
        type: Number,
        default: 1,
        min: 0,
      },
      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster lookups
EventCouponSchema.index({ couponCode: 1 });
EventCouponSchema.index({ isActive: 1, expiryDate: 1 });

// Clear cached model if exists
if (models.EventCoupon) {
  delete models.EventCoupon;
}

export default (models.EventCoupon as mongoose.Model<EventCouponType>) || 
  model<EventCouponType>("EventCoupon", EventCouponSchema);

