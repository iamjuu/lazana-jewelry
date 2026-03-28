import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

export interface UploadResult {
  url: string;
  key: string;
}

let configured = false;

function ensureConfig() {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  configured = true;
}

/**
 * Parse a Cloudinary delivery URL into public_id and resource type (for destroy).
 */
export function parseCloudinaryUrl(
  url: string
): { publicId: string; resourceType: "image" | "video" } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("res.cloudinary.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx < 2) return null;
    const resourceType = parts[uploadIdx - 1] as string;
    if (resourceType !== "image" && resourceType !== "video") return null;
    let rest = parts.slice(uploadIdx + 1);
    if (rest[0]?.match(/^v\d+$/)) rest = rest.slice(1);
    const withExt = rest.join("/");
    if (!withExt) return null;
    const publicId = withExt.replace(/\.[^.]+$/, "");
    return { publicId, resourceType };
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video"
): Promise<void> {
  ensureConfig();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    console.warn("[Cloudinary] destroy result:", result);
  }
}

/**
 * Delete asset by full Cloudinary URL (no-op if URL is not Cloudinary).
 */
export async function deleteFromCloudinaryByUrl(url: string): Promise<void> {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) {
    throw new Error("Invalid Cloudinary URL");
  }
  await deleteFromCloudinary(parsed.publicId, parsed.resourceType);
}

export async function uploadToCloudinary(
  file: Buffer | string,
  filename: string,
  folder: string = "images"
): Promise<UploadResult> {
  ensureConfig();

  let buffer: Buffer;
  let contentType = "";

  if (typeof file === "string") {
    if (file.startsWith("http://") || file.startsWith("https://")) {
      const urlParts = file.split("/");
      const key = urlParts.slice(-2).join("/");
      return { url: file, key };
    }

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
      if (folder === "videos" && mimeType.startsWith("video/")) {
        contentType = mimeType;
      }
    } else {
      buffer = Buffer.from(file, "base64");
    }
  } else {
    buffer = file;
  }

  let processedBuffer: Buffer;
  const isVideo = folder === "videos";

  if (isVideo) {
    processedBuffer = buffer;
    if (!contentType) contentType = "video/mp4";
  } else {
    processedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    contentType = "image/webp";
    filename = filename.replace(/\.(jpg|jpeg|png|gif)$/i, ".webp");
    if (!filename.endsWith(".webp")) {
      filename = filename.replace(/\.[^.]+$/, ".webp");
    }
  }

  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const baseId =
    sanitizedFilename.replace(/\.[^.]+$/, "") || `file-${timestamp}`;
  const resourceType = isVideo ? "video" : "image";

  const result = await new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${timestamp}-${baseId}`,
        resource_type: resourceType,
        overwrite: true,
      },
      (err, res) => {
        if (err) reject(err);
        else if (res?.secure_url && res.public_id) {
          resolve({ url: res.secure_url, key: res.public_id });
        } else reject(new Error("Cloudinary upload returned no URL"));
      }
    );
    stream.end(processedBuffer);
  });

  return result;
}

export interface SignedDirectUploadResult {
  uploadUrl: string;
  fields: {
    api_key: string;
    timestamp: string;
    signature: string;
    folder: string;
  };
}

/**
 * Signed direct upload to Cloudinary (browser POSTs multipart to uploadUrl).
 * Use for large videos to avoid small server body limits.
 */
export function createSignedDirectVideoUpload(folder: string): SignedDirectUploadResult {
  ensureConfig();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    fields: {
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
      folder,
    },
  };
}

export async function uploadMultipleToCloudinary(
  files: (Buffer | string)[],
  baseName: string = "product"
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) => {
    const filename = `${baseName}-${index + 1}.jpg`;
    return uploadToCloudinary(file, filename, "images");
  });
  return Promise.all(uploadPromises);
}
