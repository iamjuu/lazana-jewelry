import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToS3 } from "@/lib/aws-s3";

// POST /api/upload/s3 - Upload file(s) to S3
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const contentType = req.headers.get('content-type') || '';

    // Handle FormData (actual file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = formData.get('folder') as string || 'images';

      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 }
        );
      }

      console.log(`[S3 Upload API] Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[S3 Upload API] Converted to buffer, size: ${buffer.length} bytes`);

      // Upload to S3
      const result = await uploadToS3(
        buffer,
        file.name,
        folder
      );

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        message: "File uploaded successfully",
      });
    }

    // Handle JSON (base64 upload - legacy)
    const body = await req.json();
    const { file, folder, filename } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    const result = await uploadToS3(
      file,
      filename || `file-${Date.now()}.jpg`,
      folder || "images"
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      message: "File uploaded successfully",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    const status = error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload" },
      { status }
    );
  }
}

