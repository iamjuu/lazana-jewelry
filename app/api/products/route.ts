import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Subcategory from "@/models/Subcategory";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Ensure Subcategory model is registered before populate
    // Force the model to be loaded by referencing it and ensuring it's registered
    void Subcategory; // This ensures the import is executed
    // Double-check model is registered - if not, it means the import didn't execute properly
    if (!mongoose.models.Subcategory) {
      console.error(
        "Subcategory model not found in mongoose.models after import",
      );
      // Try to get the model directly - this will throw if not registered
      mongoose.model("Subcategory");
    }
    const { searchParams } = new URL(req.url);
    const bestSellingParam = searchParams.get("bestSelling");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const excludeImages = searchParams.get("excludeImages") === "true";
    const categoryParam = searchParams.get("category");
    const includeRelative = searchParams.get("includeRelative") === "true";
    const search = searchParams.get("search") || "";

    // Filter parameters
    const featured = searchParams.get("featured");
    const newAddition = searchParams.get("newAddition");
    const weight = searchParams.get("weight");
    const octave = searchParams.get("octave");
    const size = searchParams.get("size");
    const tuning = searchParams.get("tuning");

    // Sort parameters
    const sortBy = searchParams.get("sortBy"); // price, name
    const sortOrder = searchParams.get("sortOrder"); // asc, desc

    // Build query for filtering
    let query: any = {};

    // Category filter
    if (categoryParam && categoryParam !== "all") {
      try {
        const category = await Category.findOne({
          slug: categoryParam,
        }).lean();

        if (category) {
          query.category = category._id;
        }
      } catch (catError) {
        console.error("Error matching category:", catError);
        query.category = null;
      }
    }

    // Featured filter
    if (featured === "true") {
      query.featured = true;
    }

    // New Addition filter
    if (newAddition === "true") {
      query.newAddition = true;
    }

    // Best Selling filter
    if (bestSellingParam === "true") {
      query.bestSelling = true;
    }

    // Weight filter
    if (weight) {
      query.weight = weight;
    }

    // Octave filter
    if (octave) {
      query.octave = octave;
    }

    // Size filter - handle various formats: exact (8), ranges (5-6, 6-5), decimals (6.2)
    if (size) {
      // Check if the filter is a range (e.g., "5-6")
      const rangeMatch = size.match(/^(\d+)-(\d+)$/);

      if (rangeMatch) {
        const [_, min, max] = rangeMatch;

        // Match products with size that:
        // 1. Exactly matches the range string (5-6)
        // 2. Matches the reverse range (6-5)
        // 3. Is a single number within the range (5, 6, 5.5, 5.2, etc.)
        const sizePattern = `^(${min}-${max}|${max}-${min}|${min}(\\.\\d+)?|${max}(\\.\\d+)?)$`;

        // For ranges like 5-6, also match 5.x where x is any digit
        const rangePatterns = [];
        for (let i = parseInt(min); i <= parseInt(max); i++) {
          rangePatterns.push(`${i}(\\.\\d+)?`);
        }

        query.size = {
          $regex: `^(${min}-${max}|${max}-${min}|${rangePatterns.join("|")})$`,
          $options: "i",
        };
      } else {
        // Exact value match (e.g., "8" or "6.2")
        query.size = size;
      }
    }

    // Tuning filter (exact match by Hz number)
    if (tuning) {
      const tuningNum = parseFloat(tuning);
      if (!isNaN(tuningNum)) {
        query.tuning = tuningNum;
      }
    }

    // Exclude universal products (relativeproduct = true) from regular shop view
    // Only show regular products unless explicitly requested via includeRelative parameter
    if (!includeRelative) {
      query.relativeproduct = { $ne: true };
    }

    // Exclude deleted products
    query.deleted = { $ne: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sort: any = { createdAt: -1 }; // Default sort

    if (sortBy === "price") {
      sort = { price: sortOrder === "desc" ? -1 : 1 };
    } else if (sortBy === "name") {
      sort = { name: sortOrder === "desc" ? -1 : 1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("subcategory", "name slug category")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
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
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();

    // Validate and process category - must be a valid ObjectId or empty
    if (body.category) {
      const categoryStr = String(body.category).trim();
      if (categoryStr && mongoose.Types.ObjectId.isValid(categoryStr)) {
        body.category = categoryStr;
      } else {
        // If category is provided but invalid, set to undefined
        body.category = undefined;
      }
    }

    const created = await Product.create(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}
