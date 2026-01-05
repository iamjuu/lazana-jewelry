import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProductCoupon from "@/models/ProductCoupon";
import { requireAdmin } from "@/lib/auth";

// GET - Fetch all product coupons
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const coupons = await ProductCoupon.find()
      .populate("excludedCategories", "name")
      .populate("excludedProducts", "name")
      .populate("userUsage.userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: coupons }, { status: 200 });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

// POST - Create a new product coupon
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const body = await req.json();
    const {
      couponCode,
      couponName,
      discountPercent,
      expiryDate,
      excludedCategories = [],
      excludedProducts = [],
      usageLimit,
      perUserLimit,
      isActive = true,
    } = body;

    // Validation
    if (!couponCode || !couponName || discountPercent === undefined || !expiryDate) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json(
        { success: false, message: "Discount percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Check if there's an active (non-expired) coupon with the same code
    const normalizedCode = couponCode.trim().toUpperCase();
    const now = new Date();
    
    const activeCouponWithSameCode = await ProductCoupon.findOne({
      couponCode: normalizedCode,
      $or: [
        { expiryDate: { $gt: now } }, // Not expired
        { isActive: true }, // Still active
      ],
    });

    if (activeCouponWithSameCode) {
      // Check if it's actually expired or inactive
      const isExpired = new Date(activeCouponWithSameCode.expiryDate) < now;
      if (!isExpired && activeCouponWithSameCode.isActive) {
        return NextResponse.json(
          { success: false, message: "An active coupon with this code already exists. Please wait until it expires or deactivate it first." },
          { status: 400 }
        );
      }
    }

    // Create coupon
    const coupon = await ProductCoupon.create({
      couponCode: normalizedCode,
      couponName: couponName.trim(),
      discountPercent: Number(discountPercent),
      expiryDate: new Date(expiryDate),
      excludedCategories: excludedCategories || [],
      excludedProducts: excludedProducts || [],
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : null,
      usedCount: 0,
      userUsage: [],
      isActive: Boolean(isActive),
    });

    const populatedCoupon = await ProductCoupon.findById(coupon._id)
      .populate("excludedCategories", "name")
      .populate("excludedProducts", "name")
      .lean();

    return NextResponse.json(
      { success: true, data: populatedCoupon },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Create product coupon error:", e);
    
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

