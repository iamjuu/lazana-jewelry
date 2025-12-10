import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/categories - Get all categories
export async function GET() {
  try {
    await connectDB();
    
    const categories = await Category.find({}).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Helper to capitalize
    const toTitleCase = (str: string) => str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const capitalizedName = toTitleCase(name.trim());
    
    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${capitalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category already exists" },
        { status: 400 }
      );
    }
    
    // Use new + save() to trigger pre-save hooks
    const category = new Category({
      name: capitalizedName,
      description: description?.trim(),
    });
    
    await category.save();
    
    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      data: category,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

