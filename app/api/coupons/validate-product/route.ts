import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateProductCoupon } from "@/lib/coupon-validation";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

/**
 * Validates product coupons with the following rules:
 * 1. Products with discount field > 0 cannot use coupons
 * 2. Products in excluded categories cannot use coupons
 * 3. Specifically excluded products cannot use coupons
 * 4. Coupon applies ONLY to the most expensive eligible product (not all eligible products)
 * 5. Both percentage and fixed amount coupons apply to the single most expensive eligible product
 */
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

    // Fetch all products first to determine eligibility
    const productMap = new Map<string, any>();
    const productIdsInCart: string[] = [];
    const productCategoryIdsInCart: string[] = [];

    for (const item of items) {
      const productId = item.productId || item._id;
      if (!productId) continue;

      // Fetch product to get category and price (exclude deleted products)
      const product = await Product.findOne({ _id: productId, deleted: { $ne: true } }).lean();
      if (!product) continue;

      // Skip universal products (they shouldn't be eligible for coupons)
      if (product.relativeproduct) continue;

      productIdsInCart.push(productId.toString());
      productMap.set(productId.toString(), { product, quantity: item.quantity || 1 });

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

    if (productIdsInCart.length === 0) {
      return NextResponse.json(
        { success: false, message: "Coupon code not available for this product" },
        { status: 400 }
      );
    }

    // Validate coupon first to get excluded products/categories
    const validation = await validateProductCoupon(
      couponCode.trim().toUpperCase(),
      authUser._id.toString(),
      productIdsInCart,
      productCategoryIdsInCart,
      0 // We'll calculate eligible total separately
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message || "Coupon code not available for this product" },
        { status: 400 }
      );
    }

    // Determine eligible products (products that are NOT excluded)
    const excludedProductIds: string[] = [];
    const excludedCategoryIds: string[] = [];
    
    if (validation.coupon?.excludedProducts && validation.coupon.excludedProducts.length > 0) {
      excludedProductIds.push(...validation.coupon.excludedProducts.map((prod: any) => prod._id.toString()));
    }
    
    if (validation.coupon?.excludedCategories && validation.coupon.excludedCategories.length > 0) {
      excludedCategoryIds.push(...validation.coupon.excludedCategories.map((cat: any) => cat._id.toString()));
    }

    // Filter eligible products and find the most expensive one
    const eligibleProducts: Array<{ productId: string; product: any; quantity: number; totalPrice: number }> = [];

    for (const [productId, { product, quantity }] of productMap.entries()) {
      // Check if product has a discount (products with discount cannot use coupons)
      if (product.discount && product.discount > 0) {
        continue; // Skip products that already have a discount
      }

      // Check if product is excluded by product ID
      if (excludedProductIds.includes(productId)) {
        continue; // Skip excluded products
      }

      // Check if product is excluded by category
      if (product.category) {
        const categoryId = typeof product.category === 'string' 
          ? product.category 
          : product.category._id?.toString();
        if (categoryId && excludedCategoryIds.includes(categoryId)) {
          continue; // Skip products in excluded categories
        }
      }

      // Product is eligible - calculate its total price
      const itemTotalPrice = (product.price || 0) * quantity;
      eligibleProducts.push({ productId, product, quantity, totalPrice: itemTotalPrice });
    }

    // Sort by total price (descending) to find the most expensive
    eligibleProducts.sort((a, b) => b.totalPrice - a.totalPrice);
    
    // Get the most expensive eligible product
    const mostExpensiveProduct = eligibleProducts.length > 0 ? eligibleProducts[0] : null;
    const eligibleProductIds: string[] = mostExpensiveProduct ? [mostExpensiveProduct.productId] : [];
    const eligibleTotalPrice = mostExpensiveProduct ? mostExpensiveProduct.totalPrice : 0;

    // Check if at least one product is eligible
    if (!mostExpensiveProduct || eligibleProductIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Coupon code not available for this product" },
        { status: 400 }
      );
    }

    // Calculate discount ONLY on the most expensive eligible product
    let discountAmount = 0;
    if (validation.coupon.discountType === "percentage" && validation.coupon.discountPercent) {
      // Apply percentage discount to the most expensive eligible product only
      discountAmount = (mostExpensiveProduct.totalPrice * validation.coupon.discountPercent) / 100;
    } else if (validation.coupon.discountType === "amount" && validation.coupon.discountAmount) {
      // Apply fixed amount discount to the most expensive eligible product only
      discountAmount = Math.min(validation.coupon.discountAmount, mostExpensiveProduct.totalPrice);
    }

    // Calculate total price of all products (for display purposes)
    let totalPrice = 0;
    for (const [productId, { product, quantity }] of productMap.entries()) {
      const itemPrice = (product.price || 0) * quantity;
      totalPrice += itemPrice;
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: validation.coupon,
        discountAmount: discountAmount,
        discountPercent: validation.coupon?.discountPercent || 0,
        originalAmount: totalPrice,
        eligibleAmount: eligibleTotalPrice, // Amount eligible for discount
        finalAmount: Math.max(0, totalPrice - discountAmount),
        eligibleProductIds: eligibleProductIds, // Products that the discount applies to
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

