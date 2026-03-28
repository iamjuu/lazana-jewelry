import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinaryByUrl } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, message: "URL is required" },
        { status: 400 }
      );
    }

    await deleteFromCloudinaryByUrl(url);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete error:", error);
    const status =
      error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED"
        ? 403
        : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete" },
      { status }
    );
  }
}
