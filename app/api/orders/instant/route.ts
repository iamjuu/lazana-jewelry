import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireAuth } from "@/lib/auth";

// Instant buy - direct purchase without cart
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { productId, quantity = 1 } = (await req.json()) as {
      productId?: string;
      quantity?: number;
    };

    if (!productId || quantity <= 0) {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }

    await connectDB();

    // Get product (exclude deleted products)
    const product = await Product.findOne({ _id: productId, deleted: { $ne: true } }).lean();
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    // Calculate actual price (price - discount)
    const hasDiscount = product.discount && product.discount > 0;
    const actualPrice = hasDiscount && product.discount ? product.price - product.discount : product.price;
    
    // Create order
    const orderItems = [
      {
        productId: String(product._id),
        name: product.name,
        price: actualPrice, // Use discounted price
        quantity,
      },
    ];

    const amount = actualPrice * quantity;

    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      amount,
      currency: "USD",
      status: "pending",
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (e: any) {
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}



