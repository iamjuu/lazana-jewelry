import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Product from "@/models/Product";
import User from "@/models/User";
import type { WishlistProduct } from "@/types";

const wishlistPopulate = [
  { path: "wishlist", match: { deleted: { $ne: true } } },
];

type WishlistRecord = Partial<WishlistProduct> & {
  _id: mongoose.Types.ObjectId | string;
  imageUrl?: unknown;
  category?: unknown;
  subcategory?: unknown;
};

type UserWithWishlist = {
  wishlist?: WishlistRecord[];
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Server error";

const serializeWishlist = (wishlist: WishlistRecord[] = []) =>
  wishlist.filter(Boolean).map((item) => ({
    _id: String(item._id),
    name: item.name || "",
    price: typeof item.price === "number" ? item.price : 0,
    discount: item.discount ?? 0,
    shortDescription: item.shortDescription ?? "",
    description: item.description ?? "",
    imageUrl: Array.isArray(item.imageUrl) ? item.imageUrl : [],
    category: item.category ?? undefined,
    subcategory: item.subcategory ?? undefined,
  }));

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const dbUser = await User.findById(user._id)
      .populate(wishlistPopulate)
      .lean<UserWithWishlist>();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const wishlist = serializeWishlist(dbUser.wishlist);

    return NextResponse.json({
      success: true,
      data: wishlist,
      meta: { count: wishlist.length },
    });
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: message || "Failed to load wishlist" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const productId = String(body?.productId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findOne({
      _id: productId,
      deleted: { $ne: true },
    })
      .select("_id")
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    const dbUser = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { wishlist: productId } },
      { new: true },
    )
      .populate(wishlistPopulate)
      .lean<UserWithWishlist>();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const wishlist = serializeWishlist(dbUser.wishlist);

    return NextResponse.json({
      success: true,
      data: wishlist,
      message: "Added to wishlist",
      meta: { count: wishlist.length },
    });
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, message: message || "Failed to update wishlist" },
      { status },
    );
  }
}
