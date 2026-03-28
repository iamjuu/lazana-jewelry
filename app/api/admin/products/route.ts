import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import "@/models/Category"; // Register Category so Product ref resolves (avoids "Schema hasn't been registered for model Category")
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const body = await req.json();
    const { name, shortDescription, description, category, subcategory, price, discount, imageUrl, videoUrl, isSet, numberOfSets, newAddition, featured, bestSelling, tuning, octave, size, weight, relativeproduct } = body;

    // Validation
    const isUniversalProduct = relativeproduct === true;
    
    // Prevent universal products from being best selling
    if (isUniversalProduct && bestSelling === true) {
      return NextResponse.json(
        { success: false, message: "Universal products cannot be marked as best selling" },
        { status: 400 }
      );
    }
    
    // Validate max 4 best selling products (only if trying to set bestSelling to true)
    if (bestSelling === true && !isUniversalProduct) {
      const currentBestSellingCount = await Product.countDocuments({ 
        bestSelling: true, 
        deleted: { $ne: true },
        relativeproduct: { $ne: true } // Exclude universal products
      });
      
      // Creating new product - check if we can add it
      if (currentBestSellingCount >= 4) {
        return NextResponse.json(
          { success: false, message: "Maximum 4 products can be marked as best selling. Please unmark another best selling product first." },
          { status: 400 }
        );
      }
    }
    
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

    if (imageUrl.length > 7) {
      return NextResponse.json(
        { success: false, message: "Maximum 7 images allowed" },
        { status: 400 }
      );
    }

    // Upload images to S3 and get URLs
    console.log("Uploading images to Cloudinary...");
    const s3ImageUrls: string[] = [];
    
    for (let i = 0; i < imageUrl.length; i++) {
      const image = imageUrl[i];
      
      // Skip if already an S3 URL (in case of updates)
      if (typeof image === 'string' && image.startsWith('https://')) {
        s3ImageUrls.push(image);
        continue;
      }

      // Upload image to S3 (will be converted to WebP)
      try {
        const filename = `product-${Date.now()}-${i + 1}.webp`;
        const result = await uploadToCloudinary(image, filename, 'images');
        s3ImageUrls.push(result.url);
        console.log(`✓ Uploaded image ${i + 1} to S3 as WebP: ${result.url}`);
      } catch (uploadError) {
        console.error(`Failed to upload image ${i + 1}:`, uploadError);
        return NextResponse.json(
          { success: false, message: `Failed to upload image ${i + 1} to Cloudinary` },
          { status: 500 }
        );
      }
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

    // Validate discount if provided
    let processedDiscount: number | undefined = undefined;
    if (discount !== undefined && discount !== null && discount !== "") {
      const discountNum = typeof discount === 'number' ? discount : parseFloat(String(discount));
      if (!isNaN(discountNum)) {
        if (discountNum < 0) {
          return NextResponse.json(
            { success: false, message: "Discount cannot be negative" },
            { status: 400 }
          );
        }
        if (discountNum >= priceInRupees) {
          return NextResponse.json(
            { success: false, message: "Discount cannot be greater than or equal to price" },
            { status: 400 }
          );
        }
        processedDiscount = Math.round(discountNum * 100) / 100; // Round to 2 decimal places
      }
    }

    // Handle videoUrl - upload to S3 if base64, otherwise keep URL
    let processedVideoUrl: string | string[] = [];
    if (videoUrl) {
      const videoArray = Array.isArray(videoUrl) ? videoUrl : [videoUrl];
      const s3VideoUrls: string[] = [];

      for (let i = 0; i < videoArray.length; i++) {
        const video = videoArray[i];
        const videoStr = String(video).trim();
        
        if (!videoStr) continue;

        // Skip if already an S3/external URL
        if (videoStr.startsWith('https://') || videoStr.startsWith('http://')) {
          s3VideoUrls.push(videoStr);
          continue;
        }

        // Upload base64 video to S3 - fail entire request if any upload fails
        try {
          const filename = `product-video-${Date.now()}-${i + 1}.mp4`;
          const result = await uploadToCloudinary(videoStr, filename, 'videos');
          s3VideoUrls.push(result.url);
          console.log(`Uploaded video ${i + 1} to S3: ${result.url}`);
        } catch (uploadError) {
          console.error(`Failed to upload video ${i + 1}:`, uploadError);
          return NextResponse.json(
            { success: false, message: `Failed to upload video ${i + 1} to Cloudinary` },
            { status: 500 }
          );
        }
      }

      processedVideoUrl = s3VideoUrls.length > 0 ? s3VideoUrls : [];
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
      imageUrl: s3ImageUrls, // S3 URLs only
      videoUrl: processedVideoUrl.length > 0 ? processedVideoUrl : [],
    };

    // Add discount if provided
    if (processedDiscount !== undefined) {
      productData.discount = processedDiscount;
    }

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
      if (bestSelling !== undefined) productData.bestSelling = Boolean(bestSelling);
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

