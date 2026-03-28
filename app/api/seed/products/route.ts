import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

// Seed sample products - should be protected in production
export async function POST(_req: NextRequest) {
  try {
    // Check if this should be allowed (e.g., only in development)
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Seeding disabled in production" },
        { status: 403 }
      );
    }

    await connectDB();

    // Sample products
    const sampleProducts = [
      {
        name: "Sample necklace - 18 inch",
        description: "Beautiful sample piece for your Lazana Jewelry catalog",
        price: 15000, // in smallest currency unit (paise)
        imageUrl: [],
      },
      {
        name: "Gold vermeil hoop earrings",
        description: "Sample listing for your Lazana Jewelry catalog",
        price: 8000,
        imageUrl: [],
      },
      {
        name: "Sterling silver chain bracelet",
        description: "Adjustable bracelet—sample for development seed data",
        price: 3500,
        imageUrl: [],
      },
    ];

    // Only seed if no products exist
    const count = await Product.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { success: false, message: "Products already exist" },
        { status: 409 }
      );
    }

    const products = await Product.insertMany(sampleProducts);

    return NextResponse.json({
      success: true,
      data: products,
      message: `Seeded ${products.length} products`,
    });
  } catch (err: any) {
    console.error("Product seed error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}



