import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { id } = await context.params;
    
    // Check if any products are using this category
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    
    const productsWithCategory = await Product.countDocuments({ category: category.name });
    
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. ${productsWithCategory} product(s) are using this category.` 
        },
        { status: 400 }
      );
    }
    
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
    
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { id } = await context.params;
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }
    
    const oldCategory = await Category.findById(id);
    if (!oldCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    
    // Helper to capitalize
    const toTitleCase = (str: string) => str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const capitalizedName = toTitleCase(name.trim());
    
    // Check if new name conflicts with existing category
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${capitalizedName}$`, 'i') },
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category name already exists" },
        { status: 400 }
      );
    }
    
    // Update products that use the old category name
    if (oldCategory.name !== capitalizedName) {
      await Product.updateMany(
        { category: oldCategory.name },
        { $set: { category: capitalizedName } }
      );
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      { 
        name: capitalizedName,
        description: description?.trim(),
      },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
    
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

