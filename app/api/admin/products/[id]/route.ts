import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import "@/models/Category"; // Register Category so Product ref resolves (avoids "Schema hasn't been registered for model Category")
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  parseCloudinaryUrl,
} from "@/lib/cloudinary";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const { id } = await context.params;
    const body = await req.json();
    const { name, shortDescription, description, category, subcategory, price, discount, imageUrl, videoUrl, isSet, numberOfSets, newAddition, featured, bestSelling, tuning, octave, size, weight } = body;

    // Get current product to check if it's universal
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }
    const isUniversalProduct = currentProduct.relativeproduct === true;

    // Prevent universal products from being best selling
    if (bestSelling !== undefined && bestSelling === true && isUniversalProduct) {
      return NextResponse.json(
        { success: false, message: "Universal products cannot be marked as best selling" },
        { status: 400 }
      );
    }

    // Validate max 4 best selling products (only if trying to set bestSelling to true)
    if (bestSelling !== undefined && bestSelling === true && !isUniversalProduct) {
      const currentBestSellingCount = await Product.countDocuments({ 
        bestSelling: true, 
        deleted: { $ne: true },
        relativeproduct: { $ne: true }, // Exclude universal products
        _id: { $ne: id } // Exclude current product
      });
      
      if (currentBestSellingCount >= 4) {
        return NextResponse.json(
          { success: false, message: "Maximum 4 products can be marked as best selling. Please unmark another best selling product first." },
          { status: 400 }
        );
      }
    }

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
        // Remove discount if explicitly set to null/empty (use null so Mongoose includes it in the update)
        updateData.discount = null;
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
      // Get existing product images so we can delete removed ones from Cloudinary
      const existingProductForImages = await Product.findById(id).select('imageUrl').lean();
      const oldImages: string[] = existingProductForImages?.imageUrl && Array.isArray(existingProductForImages.imageUrl)
        ? existingProductForImages.imageUrl
        : [];

      // Upload images to Cloudinary and get URLs
      console.log("Uploading images to Cloudinary for update...");
      const s3ImageUrls: string[] = [];

      for (let i = 0; i < imageUrl.length; i++) {
        const image = imageUrl[i];

        // Skip if already an HTTPS URL
        if (typeof image === 'string' && image.startsWith('https://')) {
          s3ImageUrls.push(image);
          continue;
        }

        // Upload image to Cloudinary (will be converted to WebP)
        try {
          const filename = `product-${id}-${Date.now()}-${i + 1}.webp`;
          const result = await uploadToCloudinary(image, filename, 'images');
          s3ImageUrls.push(result.url);
          console.log(`✓ Uploaded image ${i + 1} to Cloudinary as WebP: ${result.url}`);
        } catch (uploadError) {
          console.error(`Failed to upload image ${i + 1}:`, uploadError);
          return NextResponse.json(
            { success: false, message: `Failed to upload image ${i + 1} to Cloudinary` },
            { status: 500 }
          );
        }
      }

      // Delete from Cloudinary any old image that is no longer in the new list
      const imagesToDelete = oldImages.filter(
        (oldImg) => oldImg && oldImg.startsWith('https://') && !s3ImageUrls.includes(oldImg)
      );
      for (const url of imagesToDelete) {
        try {
          const parsed = parseCloudinaryUrl(url);
          if (parsed) {
            await deleteFromCloudinary(parsed.publicId, parsed.resourceType);
            console.log(`✓ Deleted removed image from Cloudinary: ${parsed.publicId}`);
          }
        } catch (deleteError) {
          console.error(`Failed to delete old image ${url}:`, deleteError);
        }
      }

      updateData.imageUrl = s3ImageUrls;
    }
    if (videoUrl !== undefined) {
      // Fetch existing product to get old video URLs
      const existingProduct = await Product.findById(id).select('videoUrl').lean();
      const oldVideos = existingProduct?.videoUrl ? (Array.isArray(existingProduct.videoUrl) ? existingProduct.videoUrl : [existingProduct.videoUrl]) : [];

      // Handle videoUrl - upload to Cloudinary if base64
      const videoArray = Array.isArray(videoUrl) ? videoUrl : (videoUrl ? [videoUrl] : []);
      const s3VideoUrls: string[] = [];

      for (let i = 0; i < videoArray.length; i++) {
        const video = videoArray[i];
        const videoStr = String(video).trim();
        
        if (!videoStr) continue;

        // Skip if already an external URL
        if (videoStr.startsWith('https://') || videoStr.startsWith('http://')) {
          s3VideoUrls.push(videoStr);
          continue;
        }

        // Upload base64 video to Cloudinary - fail entire update if any upload fails
        try {
          const filename = `product-video-${id}-${Date.now()}-${i + 1}.mp4`;
          const result = await uploadToCloudinary(videoStr, filename, 'videos');
          s3VideoUrls.push(result.url);
          console.log(`Uploaded video ${i + 1} to Cloudinary: ${result.url}`);
        } catch (uploadError) {
          console.error(`Failed to upload video ${i + 1}:`, uploadError);
          return NextResponse.json(
            { success: false, message: `Failed to upload video ${i + 1} to Cloudinary` },
            { status: 500 }
          );
        }
      }

      // Delete old videos from Cloudinary that are no longer in the new list
      const videosToDelete = oldVideos.filter(oldVideo => {
        if (!oldVideo || !oldVideo.startsWith('https://')) return false;
        return !s3VideoUrls.includes(oldVideo);
      });

      for (const videoToDelete of videosToDelete) {
        try {
          const parsed = parseCloudinaryUrl(videoToDelete);
          if (parsed) {
            await deleteFromCloudinary(parsed.publicId, parsed.resourceType);
            console.log(`✓ Deleted old video from Cloudinary: ${parsed.publicId}`);
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
    if (bestSelling !== undefined && !isUniversalProduct) {
      updateData.bestSelling = Boolean(bestSelling);
    } else if (bestSelling !== undefined && isUniversalProduct && bestSelling === true) {
      // Don't allow setting bestSelling to true for universal products
      // But allow setting it to false to unmark if somehow it was set before
      updateData.bestSelling = false;
    }
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

    // Note: Images are kept in storage, only videos are deleted on product delete

    // Delete videos from Cloudinary
    if (product.videoUrl) {
      const videosArray = Array.isArray(product.videoUrl) ? product.videoUrl : [product.videoUrl];
      for (const videoUrl of videosArray) {
        if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('https://') || videoUrl.startsWith('http://'))) {
          try {
            const parsed = parseCloudinaryUrl(videoUrl);
            if (parsed) {
              await deleteFromCloudinary(parsed.publicId, parsed.resourceType);
              console.log(`✓ Deleted video from Cloudinary: ${parsed.publicId}`);
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

