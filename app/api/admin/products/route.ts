import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const body = await req.json();
    const { name, shortDescription, description, category, subcategory, price, imageUrl, videoUrl, isSet, numberOfSets, newAddition, featured, tuning, octave, size, weight, relativeproduct } = body;

    // Validation
    const isUniversalProduct = relativeproduct === true;
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    if (!description || !price) {
      return NextResponse.json(
        { success: false, message: "Description and price are required" },
        { status: 400 }
      );
    }

    if (isUniversalProduct && !shortDescription) {
      return NextResponse.json(
        { success: false, message: "Short description is required for universal products" },
        { status: 400 }
      );
    }

    if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one image is required" },
        { status: 400 }
      );
    }

    // Price should be in rupees/dollars (not cents/paise)
    const priceString = String(price).trim();
    const priceInRupees = parseFloat(priceString);
    
    // Round to 2 decimal places to avoid floating point precision issues
    const roundedPrice = Math.round(priceInRupees * 100) / 100;
    
    console.log("=== PRODUCT CREATION DEBUG ===");
    console.log("Raw price received:", price);
    console.log("Price type:", typeof price);
    console.log("Price string:", priceString);
    console.log("Parsed price:", priceInRupees);
    console.log("Rounded price:", roundedPrice);
    console.log("Is NaN?", isNaN(priceInRupees));
    console.log("==============================");
    
    if (isNaN(priceInRupees) || priceInRupees <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid price" },
        { status: 400 }
      );
    }

    // Handle videoUrl - can be string or array
    let processedVideoUrl: string | string[] = [];
    if (videoUrl) {
      if (Array.isArray(videoUrl)) {
        processedVideoUrl = videoUrl.filter(v => v && String(v).trim()).map(v => String(v).trim());
      } else {
        processedVideoUrl = [String(videoUrl).trim()];
      }
    }

    // Validate and process category - must be a valid ObjectId or empty
    let processedCategory: string | undefined = undefined;
    if (category) {
      const categoryStr = String(category).trim();
      if (categoryStr && mongoose.Types.ObjectId.isValid(categoryStr)) {
        processedCategory = categoryStr;
      }
      // If category is provided but invalid, silently ignore it (set to undefined)
    }

    // Validate and process subcategory - must be a valid ObjectId or empty
    let processedSubcategory: string | undefined = undefined;
    if (subcategory) {
      const subcategoryStr = String(subcategory).trim();
      if (subcategoryStr && mongoose.Types.ObjectId.isValid(subcategoryStr)) {
        processedSubcategory = subcategoryStr;
      }
      // If subcategory is provided but invalid, silently ignore it (set to undefined)
    }

    // Process optional fields
    const productData: any = {
      name: String(name).trim(),
      shortDescription: shortDescription ? String(shortDescription).trim() : "",
      description: String(description).trim(),
      price: roundedPrice,
      imageUrl: imageUrl,
      videoUrl: processedVideoUrl.length > 0 ? processedVideoUrl : [],
    };

    // Only add category, subcategory if not a universal product
    if (!isUniversalProduct) {
      productData.category = processedCategory;
      productData.subcategory = processedSubcategory;
    }

    // Add relativeproduct field
    if (relativeproduct === true) {
      productData.relativeproduct = true;
    }

    // Add optional fields if provided (only for regular products, not universal)
    if (!isUniversalProduct) {
      if (isSet !== undefined) productData.isSet = Boolean(isSet);
      if (isSet === true && numberOfSets !== undefined && numberOfSets !== null) {
        const setsNum = typeof numberOfSets === 'number' ? numberOfSets : parseInt(String(numberOfSets));
        if (!isNaN(setsNum) && setsNum > 0) productData.numberOfSets = setsNum;
      }
      if (newAddition !== undefined) productData.newAddition = Boolean(newAddition);
      if (featured !== undefined) productData.featured = Boolean(featured);
      if (tuning !== undefined && tuning !== null) {
        const tuningNum = typeof tuning === 'number' ? tuning : parseFloat(String(tuning));
        if (!isNaN(tuningNum)) productData.tuning = tuningNum;
      }
      if (octave !== undefined && octave && String(octave).trim()) productData.octave = String(octave).trim();
      if (size !== undefined && size && String(size).trim()) productData.size = String(size).trim();
      if (weight !== undefined && weight && String(weight).trim()) productData.weight = String(weight).trim();
    }

    const product = await Product.create(productData);

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

