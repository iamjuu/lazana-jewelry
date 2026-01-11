import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import EventCoupon from "@/models/EventCoupon";
import { requireAdmin } from "@/lib/auth";

// DELETE - Delete an event coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { id } = await params;

    const coupon = await EventCoupon.findByIdAndDelete(id);

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Coupon deleted successfully" },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

// PATCH - Update an event coupon
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const {
      couponCode,
      couponName,
      discountType,
      discountPercent,
      discountAmount,
      expiryDate,
      excludedEvents,
      usageLimit,
      perUserLimit,
      isActive,
    } = body;

    const updateData: any = {};

    if (couponCode !== undefined) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const now = new Date();
      
      // Check if there's an active (non-expired) coupon with the same code (excluding current coupon)
      const activeCouponWithSameCode = await EventCoupon.findOne({
        couponCode: normalizedCode,
        _id: { $ne: id },
        $or: [
          { expiryDate: { $gt: now } }, // Not expired
          { isActive: true }, // Still active
        ],
      });

      if (activeCouponWithSameCode) {
        const isExpired = new Date(activeCouponWithSameCode.expiryDate) < now;
        if (!isExpired && activeCouponWithSameCode.isActive) {
          return NextResponse.json(
            { success: false, message: "An active coupon with this code already exists. Please wait until it expires or deactivate it first." },
            { status: 400 }
          );
        }
      }
      
      updateData.couponCode = normalizedCode;
    }

    if (couponName !== undefined) {
      updateData.couponName = couponName.trim();
    }

    if (discountType !== undefined) {
      if (discountType !== "percentage" && discountType !== "amount") {
        return NextResponse.json(
          { success: false, message: "Invalid discount type. Must be 'percentage' or 'amount'" },
          { status: 400 }
        );
      }
      updateData.discountType = discountType;
    }

    if (discountPercent !== undefined) {
      if (discountPercent < 0 || discountPercent > 100) {
        return NextResponse.json(
          { success: false, message: "Discount percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.discountPercent = Number(discountPercent);
    }

    if (discountAmount !== undefined) {
      if (discountAmount < 0) {
        return NextResponse.json(
          { success: false, message: "Discount amount must be greater than 0" },
          { status: 400 }
        );
      }
      updateData.discountAmount = Number(discountAmount);
    }

    if (expiryDate !== undefined) {
      updateData.expiryDate = new Date(expiryDate);
    }

    if (excludedEvents !== undefined) {
      updateData.excludedEvents = excludedEvents;
    }

    if (usageLimit !== undefined) {
      updateData.usageLimit = usageLimit ? Number(usageLimit) : null;
    }

    if (perUserLimit !== undefined) {
      updateData.perUserLimit = perUserLimit ? Number(perUserLimit) : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const coupon = await EventCoupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("excludedEvents", "title name")
      .populate("userUsage.userId", "name email")
      .lean();

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: coupon },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Update event coupon error:", e);
    
    if (e.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

