import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteFromS3, extractS3Key } from "@/lib/aws-s3";

// DELETE /api/upload/s3 - Delete file from S3
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

    // Extract S3 key from URL
    const key = extractS3Key(url);
    
    if (!key) {
      return NextResponse.json(
        { success: false, message: "Invalid S3 URL" },
        { status: 400 }
      );
    }

    console.log(`[S3 Delete] Deleting file: ${key}`);

    // Delete from S3
    await deleteFromS3(key);

    console.log(`✓ Deleted from S3: ${key}`);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete error:", error);
    const status = error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete" },
      { status }
    );
  }
}



