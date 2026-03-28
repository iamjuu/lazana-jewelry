import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// POST /api/upload/cloudinary — upload file(s) to Cloudinary
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "images";

      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToCloudinary(buffer, file.name, folder);

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        message: "File uploaded successfully",
      });
    }

    const body = await req.json();
    const { file, folder, filename } = body;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    const result = await uploadToCloudinary(
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
    const status =
      error?.message === "FORBIDDEN" || error?.message === "UNAUTHORIZED"
        ? 403
        : 500;
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload" },
      { status }
    );
  }
}
