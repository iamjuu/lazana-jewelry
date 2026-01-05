import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateProductCoupon } from "@/lib/coupon-validation";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectDB();

    const body = await req.json();
    const { couponCode, items } = body;

    if (!couponCode || !couponCode.trim()) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items are required" },
        { status: 400 }
      );
    }

    // Calculate total product price and collect product IDs and category IDs
    let totalPrice = 0;
    const productIdsInCart: string[] = [];
    const productCategoryIdsInCart: string[] = [];

    for (const item of items) {
      const productId = item.productId || item._id;
      if (!productId) continue;

      // Fetch product to get category and price
      const product = await Product.findById(productId).lean();
      if (!product) continue;

      // Skip universal products (they shouldn't be eligible for coupons)
      if (product.relativeproduct) continue;

      const itemPrice = (product.price || 0) * (item.quantity || 1);
      totalPrice += itemPrice;
      productIdsInCart.push(productId.toString());

      // Collect category ID if product has a category
      if (product.category) {
        const categoryId = typeof product.category === 'string' 
          ? product.category 
          : product.category._id?.toString();
        if (categoryId && !productCategoryIdsInCart.includes(categoryId)) {
          productCategoryIdsInCart.push(categoryId);
        }
      }
    }

    if (totalPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "Coupon code not available for this product" },
        { status: 400 }
      );
    }

    // Validate coupon using the validation function
    const validation = await validateProductCoupon(
      couponCode.trim().toUpperCase(),
      authUser._id.toString(),
      productIdsInCart,
      productCategoryIdsInCart,
      totalPrice
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message || "Coupon code not available for this product" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: validation.coupon,
        discountAmount: validation.discountAmount,
        discountPercent: validation.coupon?.discountPercent || 0,
        originalAmount: totalPrice,
        finalAmount: Math.max(0, totalPrice - (validation.discountAmount || 0)),
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: "Coupon code not available for this product" },
      { status: 500 }
    );
  }
}

