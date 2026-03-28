import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSignedDirectVideoUpload } from "@/lib/cloudinary";

/**
 * Returns a signed Cloudinary video upload target so the browser can POST multipart
 * directly to Cloudinary (avoids small server body limits).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const folder = (body.folder as string) || "videos";

    if (!folder) {
      return NextResponse.json(
        { success: false, message: "folder required" },
        { status: 400 }
      );
    }

    const { uploadUrl, fields } = createSignedDirectVideoUpload(folder);

    return NextResponse.json({
      success: true,
      uploadUrl,
      fields,
    });
  } catch (error: any) {
    console.error("Cloudinary signed upload error:", error);
    const status =
      error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED"
        ? 403
        : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to get upload URL" },
      { status }
    );
  }
}
