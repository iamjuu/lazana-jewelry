import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Subcategory from "@/models/Subcategory";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    
    // Ensure Subcategory model is registered before populate
    // Force the model to be loaded by referencing it and ensuring it's registered
    void Subcategory; // This ensures the import is executed
    // Double-check model is registered - if not, it means the import didn't execute properly
    if (!mongoose.models.Subcategory) {
      console.error("Subcategory model not found in mongoose.models after import");
      // Try to get the model directly - this will throw if not registered
      mongoose.model('Subcategory');
    }
    
    const { id } = await context.params;
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug category')
      .lean();
    if (!product) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const body = await req.json();
    const { id } = await context.params;
    const updated = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    await connectDB();
    const { id } = await context.params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}



