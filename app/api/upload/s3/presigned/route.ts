import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/aws-s3";

/**
 * Get a presigned URL so the client can upload a file directly to S3.
 * Use this for large files (e.g. videos) to avoid Vercel's 4.5 MB request body limit.
 * Request body is tiny (JSON only); the actual file is uploaded from browser to S3.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const folder = (body.folder as string) || "videos";
    const filename = (body.filename as string) || `upload-${Date.now()}.mp4`;
    const contentType = (body.contentType as string) || "video/mp4";

    if (!folder || !filename) {
      return NextResponse.json(
        { success: false, message: "folder and filename required" },
        { status: 400 }
      );
    }

    const { uploadUrl, key, url } = await createPresignedUploadUrl(
      folder,
      filename,
      contentType
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      url,
      key,
    });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
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
