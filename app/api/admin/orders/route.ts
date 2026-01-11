import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { paymentRef: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (e: any) {
    const status = e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}



