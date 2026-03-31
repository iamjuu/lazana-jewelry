import connectDB from "./mongodb";
import ProductCoupon from "@/models/ProductCoupon";
import EventCoupon from "@/models/EventCoupon";
import mongoose from "mongoose";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(amount * 100) / 100);

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  coupon?: any;
  discountAmount?: number;
  eligibleProductIds?: string[]; // Product IDs that are eligible for the coupon
  eligibleTotalPrice?: number; // Total price of eligible products only
}

/**
 * Validates a product coupon and returns validation result
 */
export async function validateProductCoupon(
  couponCode: string,
  userId: string,
  productIdsInCart: string[], // Array of product IDs in the cart
  productCategoryIdsInCart: string[], // Array of category IDs of products in the cart
  totalPrice: number = 0
): Promise<CouponValidationResult> {
  try {
    await connectDB();

    const normalizedCode = couponCode.trim().toUpperCase();
    const now = new Date();

    // Find the coupon by code
    const coupon = await ProductCoupon.findOne({
      couponCode: normalizedCode,
      isActive: true,
    })
      .populate("excludedCategories", "name")
      .populate("excludedProducts", "name")
      .lean();

    if (!coupon) {
      return {
        valid: false,
        message: "Coupon code not available for this product",
      };
    }

    // Check if coupon is expired
    const expiryDate = new Date(coupon.expiryDate);
    if (expiryDate < now) {
      return {
        valid: false,
        message: "Coupon code not available for this product",
      };
    }

    // Note: We no longer reject if ANY product is excluded
    // Instead, we'll let the API determine eligible products and calculate discount only on those
    // The validation here just checks if the coupon itself is valid (not expired, within limits, etc.)
    // The actual product eligibility filtering happens in the API route

    // Check total usage limit
    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        message: "Coupon code not available for this product",
      };
    }

    // Check per-user usage limit
    if (coupon.perUserLimit) {
      const userUsage = coupon.userUsage?.find((usage: any) => {
        const usageUserId = typeof usage.userId === 'string' 
          ? usage.userId 
          : usage.userId._id?.toString();
        return usageUserId === userId;
      });

      if (userUsage && userUsage.count >= coupon.perUserLimit) {
        return {
          valid: false,
          message: "Coupon code not available for this product",
        };
      }
    }

    // Calculate discount amount based on discount type
    let discountAmount = 0;
    let message = "";
    
    if (coupon.discountType === "percentage" && coupon.discountPercent) {
      discountAmount = (totalPrice * coupon.discountPercent) / 100;
      message = `Coupon applied: ${coupon.discountPercent}% off`;
    } else if (coupon.discountType === "amount" && coupon.discountAmount) {
      // For fixed amount, ensure discount doesn't exceed total price
      discountAmount = Math.min(coupon.discountAmount, totalPrice);
      message = `Coupon applied: ${formatCurrency(coupon.discountAmount)} off`;
    } else {
      return {
        valid: false,
        message: "Invalid coupon configuration",
      };
    }

    return {
      valid: true,
      coupon: coupon,
      discountAmount,
      message,
    };
  } catch (error: any) {
    console.error("Error validating product coupon:", error);
    return {
      valid: false,
      message: "Error validating coupon. Please try again.",
    };
  }
}

/**
 * Validates an event coupon and returns validation result
 */
export async function validateEventCoupon(
  couponCode: string,
  userId: string,
  eventId?: string,
  eventPrice: number = 0
): Promise<CouponValidationResult> {
  try {
    await connectDB();

    const normalizedCode = couponCode.trim().toUpperCase();
    const now = new Date();

    // Find the coupon by code
    const coupon = await EventCoupon.findOne({
      couponCode: normalizedCode,
      isActive: true,
    }).populate("excludedEvents", "title name");

    if (!coupon) {
      return {
        valid: false,
        message: "Invalid coupon code",
      };
    }

    // Check if coupon is expired
    const expiryDate = new Date(coupon.expiryDate);
    if (expiryDate < now) {
      return {
        valid: false,
        message: "This coupon has expired",
      };
    }

    // Check if event is excluded
    if (eventId && coupon.excludedEvents && coupon.excludedEvents.length > 0) {
      const excludedIds = coupon.excludedEvents.map((evt: any) => 
        typeof evt === 'string' ? evt : evt._id.toString()
      );
      
      if (excludedIds.includes(eventId.toString())) {
        return {
          valid: false,
          message: "This coupon cannot be used for this event",
        };
      }
    }

    // Check total usage limit
    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        message: "This coupon has reached its usage limit",
      };
    }

    // Check per-user usage limit
    if (coupon.perUserLimit) {
      const userUsage = coupon.userUsage?.find((usage: any) => {
        const usageUserId = typeof usage.userId === 'string' 
          ? usage.userId 
          : usage.userId._id?.toString();
        return usageUserId === userId;
      });

      if (userUsage && userUsage.count >= coupon.perUserLimit) {
        return {
          valid: false,
          message: `You have already used this coupon ${coupon.perUserLimit} time${coupon.perUserLimit > 1 ? 's' : ''}`,
        };
      }
    }

    // Calculate discount amount based on discount type
    let discountAmount = 0;
    let message = "";
    
    if (coupon.discountType === "percentage" && coupon.discountPercent) {
      discountAmount = (eventPrice * coupon.discountPercent) / 100;
      message = `Coupon applied: ${coupon.discountPercent}% off`;
    } else if (coupon.discountType === "amount" && coupon.discountAmount) {
      // For fixed amount, ensure discount doesn't exceed event price
      discountAmount = Math.min(coupon.discountAmount, eventPrice);
      message = `Coupon applied: ${formatCurrency(coupon.discountAmount)} off`;
    } else {
      return {
        valid: false,
        message: "Invalid coupon configuration",
      };
    }

    return {
      valid: true,
      coupon: coupon.toObject(),
      discountAmount,
      message,
    };
  } catch (error: any) {
    console.error("Error validating event coupon:", error);
    return {
      valid: false,
      message: "Error validating coupon. Please try again.",
    };
  }
}

/**
 * Records coupon usage (increments usedCount and userUsage)
 */
export async function recordCouponUsage(
  couponId: string,
  couponType: "product" | "event",
  userId: string
): Promise<boolean> {
  try {
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (couponType === "product") {
      const coupon = await ProductCoupon.findById(couponId);
      if (!coupon) return false;

      // Increment total usage
      coupon.usedCount = (coupon.usedCount || 0) + 1;

      // Update or create user usage entry
      const existingUserUsage = coupon.userUsage?.find((usage: any) => {
        const usageUserId = typeof usage.userId === 'string' 
          ? usage.userId 
          : usage.userId._id?.toString();
        return usageUserId === userId;
      });

      if (existingUserUsage) {
        existingUserUsage.count += 1;
        existingUserUsage.lastUsedAt = new Date();
      } else {
        if (!coupon.userUsage) {
          coupon.userUsage = [];
        }
        coupon.userUsage.push({
          userId: userObjectId,
          count: 1,
          lastUsedAt: new Date(),
        });
      }

      await coupon.save();
      return true;
    } else {
      const coupon = await EventCoupon.findById(couponId);
      if (!coupon) return false;

      // Increment total usage
      coupon.usedCount = (coupon.usedCount || 0) + 1;

      // Update or create user usage entry
      const existingUserUsage = coupon.userUsage?.find((usage: any) => {
        const usageUserId = typeof usage.userId === 'string' 
          ? usage.userId 
          : usage.userId._id?.toString();
        return usageUserId === userId;
      });

      if (existingUserUsage) {
        existingUserUsage.count += 1;
        existingUserUsage.lastUsedAt = new Date();
      } else {
        if (!coupon.userUsage) {
          coupon.userUsage = [];
        }
        coupon.userUsage.push({
          userId: userObjectId,
          count: 1,
          lastUsedAt: new Date(),
        });
      }

      await coupon.save();
      return true;
    }
  } catch (error: any) {
    console.error("Error recording coupon usage:", error);
    return false;
  }
}

