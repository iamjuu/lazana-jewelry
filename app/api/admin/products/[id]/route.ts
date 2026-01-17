import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { uploadToS3, deleteFromS3, extractS3Key } from "@/lib/aws-s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const { id } = await context.params;
    const body = await req.json();
    const { name, shortDescription, description, category, subcategory, price, discount, imageUrl, videoUrl, isSet, numberOfSets, newAddition, featured, tuning, octave, size, weight } = body;

    // Validation
    if (name !== undefined && !name) {
      return NextResponse.json(
        { success: false, message: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (description !== undefined && !description) {
      return NextResponse.json(
        { success: false, message: "Description cannot be empty" },
        { status: 400 }
      );
    }

    if (imageUrl !== undefined && (!Array.isArray(imageUrl) || imageUrl.length === 0)) {
      return NextResponse.json(
        { success: false, message: "At least one image is required" },
        { status: 400 }
      );
    }

    if (imageUrl !== undefined && imageUrl.length > 7) {
      return NextResponse.json(
        { success: false, message: "Maximum 7 images allowed" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription ? String(shortDescription).trim() : "";
    if (description !== undefined) updateData.description = String(description).trim();
    if (category !== undefined) {
      // Validate category - must be a valid ObjectId or empty
      const categoryStr = category ? String(category).trim() : "";
      if (categoryStr && mongoose.Types.ObjectId.isValid(categoryStr)) {
        updateData.category = categoryStr;
      } else if (categoryStr === "") {
        // Empty string means remove category
        updateData.category = null;
      }
      // If category is provided but invalid, silently ignore it (don't update the field)
    }
    if (subcategory !== undefined) {
      // Validate subcategory - must be a valid ObjectId or empty
      const subcategoryStr = subcategory ? String(subcategory).trim() : "";
      if (subcategoryStr && mongoose.Types.ObjectId.isValid(subcategoryStr)) {
        updateData.subcategory = subcategoryStr;
      } else if (subcategoryStr === "") {
        // Empty string means remove subcategory
        updateData.subcategory = null;
      }
      // If subcategory is provided but invalid, silently ignore it (don't update the field)
    }
    if (price !== undefined) {
      const priceString = String(price).trim();
      const priceInRupees = parseFloat(priceString);
      
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedPrice = Math.round(priceInRupees * 100) / 100;
      
      console.log("=== PRODUCT UPDATE DEBUG ===");
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
      updateData.price = roundedPrice;
    }
    if (discount !== undefined) {
      if (discount === null || discount === "") {
        // Remove discount if explicitly set to null/empty
        updateData.discount = undefined;
      } else {
        const discountNum = typeof discount === 'number' ? discount : parseFloat(String(discount));
        if (!isNaN(discountNum)) {
          if (discountNum < 0) {
            return NextResponse.json(
              { success: false, message: "Discount cannot be negative" },
              { status: 400 }
            );
          }
          // Get current price (either from update or existing product)
          const currentPrice = updateData.price !== undefined 
            ? updateData.price 
            : (await Product.findById(id).select('price').lean())?.price;
          
          if (currentPrice && discountNum >= currentPrice) {
            return NextResponse.json(
              { success: false, message: "Discount cannot be greater than or equal to price" },
              { status: 400 }
            );
          }
          updateData.discount = Math.round(discountNum * 100) / 100; // Round to 2 decimal places
        }
      }
    }
    if (imageUrl !== undefined) {
      // Upload images to S3 and get URLs
      console.log("Uploading images to S3 for update...");
      const s3ImageUrls: string[] = [];
      
      for (let i = 0; i < imageUrl.length; i++) {
        const image = imageUrl[i];
        
        // Skip if already an S3 URL
        if (typeof image === 'string' && image.startsWith('https://')) {
          s3ImageUrls.push(image);
          continue;
        }

        // Upload image to S3 (will be converted to WebP)
        try {
          const filename = `product-${id}-${Date.now()}-${i + 1}.webp`;
          const result = await uploadToS3(image, filename, 'images');
          s3ImageUrls.push(result.url);
          console.log(`✓ Uploaded image ${i + 1} to S3 as WebP: ${result.url}`);
        } catch (uploadError) {
          console.error(`Failed to upload image ${i + 1}:`, uploadError);
          return NextResponse.json(
            { success: false, message: `Failed to upload image ${i + 1} to S3` },
            { status: 500 }
          );
        }
      }
      
      updateData.imageUrl = s3ImageUrls;
    }
    if (videoUrl !== undefined) {
      // Fetch existing product to get old video URLs
      const existingProduct = await Product.findById(id).select('videoUrl').lean();
      const oldVideos = existingProduct?.videoUrl ? (Array.isArray(existingProduct.videoUrl) ? existingProduct.videoUrl : [existingProduct.videoUrl]) : [];

      // Handle videoUrl - upload to S3 if base64
      const videoArray = Array.isArray(videoUrl) ? videoUrl : (videoUrl ? [videoUrl] : []);
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

        // Upload base64 video to S3
        try {
          const filename = `product-video-${id}-${Date.now()}-${i + 1}.mp4`;
          const result = await uploadToS3(videoStr, filename, 'videos');
          s3VideoUrls.push(result.url);
          console.log(`Uploaded video ${i + 1} to S3: ${result.url}`);
        } catch (uploadError) {
          console.error(`Failed to upload video ${i + 1}:`, uploadError);
          // Continue with other videos
        }
      }

      // Delete old videos from S3 that are no longer in the new list
      const videosToDelete = oldVideos.filter(oldVideo => {
        if (!oldVideo || !oldVideo.startsWith('https://')) return false;
        return !s3VideoUrls.includes(oldVideo);
      });

      for (const videoToDelete of videosToDelete) {
        try {
          const s3Key = extractS3Key(videoToDelete);
          if (s3Key) {
            await deleteFromS3(s3Key);
            console.log(`✓ Deleted old video from S3: ${s3Key}`);
          }
        } catch (deleteError) {
          console.error(`Failed to delete old video ${videoToDelete}:`, deleteError);
          // Continue even if deletion fails
        }
      }

      updateData.videoUrl = s3VideoUrls.length > 0 ? s3VideoUrls : [];
    }
    if (isSet !== undefined) {
      updateData.isSet = Boolean(isSet);
      // If isSet is false, clear numberOfSets
      if (!isSet) {
        updateData.numberOfSets = null;
      }
    }
    if (numberOfSets !== undefined) {
      if (isSet === true && numberOfSets !== null && numberOfSets !== undefined) {
        const setsNum = typeof numberOfSets === 'number' ? numberOfSets : parseInt(String(numberOfSets));
        if (!isNaN(setsNum) && setsNum > 0) {
          updateData.numberOfSets = setsNum;
        }
      } else if (numberOfSets === null || numberOfSets === undefined || numberOfSets === "") {
        updateData.numberOfSets = null;
      }
    }
    if (newAddition !== undefined) updateData.newAddition = Boolean(newAddition);
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (tuning !== undefined) {
      if (tuning !== null && tuning !== "") {
        const tuningNum = typeof tuning === 'number' ? tuning : parseFloat(String(tuning));
        if (!isNaN(tuningNum)) {
          updateData.tuning = tuningNum;
        } else {
          updateData.tuning = null; // Remove tuning if invalid
        }
      } else {
        updateData.tuning = null; // Remove tuning if empty
      }
    }
    if (octave !== undefined) {
      if (octave && String(octave).trim()) {
        updateData.octave = String(octave).trim();
      } else {
        updateData.octave = null; // Remove octave if empty
      }
    }
    if (size !== undefined) {
      if (size && String(size).trim()) {
        updateData.size = String(size).trim();
      } else {
        updateData.size = null; // Remove size if empty
      }
    }
    if (weight !== undefined) {
      if (weight && String(weight).trim()) {
        updateData.weight = String(weight).trim();
      } else {
        updateData.weight = null; // Remove weight if empty
      }
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug category');
    
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const { id } = await context.params;
    
    // Fetch the product first to get image and video URLs
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Note: Images are kept in S3, only videos are deleted

    // Delete videos from S3
    if (product.videoUrl) {
      const videosArray = Array.isArray(product.videoUrl) ? product.videoUrl : [product.videoUrl];
      for (const videoUrl of videosArray) {
        if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('https://') || videoUrl.startsWith('http://'))) {
          try {
            const s3Key = extractS3Key(videoUrl);
            if (s3Key) {
              await deleteFromS3(s3Key);
              console.log(`✓ Deleted video from S3: ${s3Key}`);
            }
          } catch (deleteError) {
            console.error(`Failed to delete video ${videoUrl}:`, deleteError);
            // Continue even if deletion fails
          }
        }
      }
    }

    // Soft delete: Set deleted flag to true instead of actually deleting
    product.deleted = true;
    await product.save();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

