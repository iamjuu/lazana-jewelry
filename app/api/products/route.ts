import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const excludeImages = searchParams.get("excludeImages") === "true";
    const categoryParam = searchParams.get("category");

    // Build query for category filtering
    let query: any = {};
    if (categoryParam && categoryParam !== "all") {
      try {
        // Try to match by slug first
        const category = await Category.findOne({
          slug: categoryParam
        }).lean();

        if (category) {
          // Match products by category name (products store category as name string like "7 Chakras Set")
          query.category = category.name;
        } else {
          // Fallback: try case-insensitive match on product category field (might be stored as slug)
          query.$or = [
            { category: categoryParam },
            { category: { $regex: new RegExp(categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
          ];
        }
      } catch (catError) {
        console.error("Error matching category:", catError);
        // If category matching fails, still try to match products directly
        query.category = { $regex: new RegExp(categoryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    // If images are excluded, remove them to reduce payload size (for better performance)
    const productsData = excludeImages
      ? products.map(({ imageUrl, ...product }) => ({
          ...product,
          hasImage: Array.isArray(imageUrl) && imageUrl.length > 0,
        }))
      : products;

    return NextResponse.json({
      success: true,
      data: productsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();
    const created = await Product.create(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}



