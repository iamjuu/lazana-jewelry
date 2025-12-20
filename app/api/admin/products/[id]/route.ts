import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    
    const { id } = await context.params;
    const body = await req.json();
    const { name, shortDescription, description, category, subcategory, price, imageUrl, videoUrl, isSet, numberOfSets, newAddition, featured, tuning, octave, size, weight } = body;

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
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (videoUrl !== undefined) {
      // Handle videoUrl - can be string or array
      if (Array.isArray(videoUrl)) {
        updateData.videoUrl = videoUrl.filter(v => v && String(v).trim()).map(v => String(v).trim());
      } else if (videoUrl) {
        updateData.videoUrl = [String(videoUrl).trim()];
      } else {
        updateData.videoUrl = [];
      }
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
    const deleted = await Product.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status }
    );
  }
}

