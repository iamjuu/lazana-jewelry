import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import "@/models/Product";
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

type RouteContext = { params: Promise<{ productId: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { productId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const dbUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { wishlist: productId } },
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
      message: "Removed from wishlist",
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
