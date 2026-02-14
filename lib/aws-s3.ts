  import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
  import sharp from "sharp";

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const S3_BUCKET = process.env.S3_BUCKET_NAME || "amzn-crystalbowl-bucket";
  const S3_BASE_URL = process.env.S3_BASE_URL || "https://amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com";

  export interface UploadResult {
    url: string;
    key: string;
  }

  /**
   * Upload an image or video to S3
   * @param file - File buffer or base64 string
   * @param filename - Desired filename
   * @param folder - Folder path in S3 (e.g., 'images' or 'videos')
   * @returns Promise with the uploaded file URL and key
   */
  export async function uploadToS3(
    file: Buffer | string,
    filename: string,
    folder: string = "images"
  ): Promise<UploadResult> {
    try {
      let buffer: Buffer;
      let contentType: string = ""; // Initialize to empty string
      let processedBuffer: Buffer;

      console.log(`[S3 Upload] Starting upload for ${folder}/${filename}`);

      // Handle base64 string or Buffer
      if (typeof file === "string") {
        // Check if it's already a URL (shouldn't upload URLs)
        if (file.startsWith('http://') || file.startsWith('https://')) {
          console.log(`[S3 Upload] File is already a URL, skipping upload: ${file}`);
          // Extract the key from URL
          const urlParts = file.split('/');
          const key = urlParts.slice(-2).join('/'); // folder/filename
          return { url: file, key };
        }

        // Extract base64 data
        const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          buffer = Buffer.from(matches[2], "base64");
          console.log(`[S3 Upload] Detected MIME type: ${mimeType}, Buffer size: ${buffer.length} bytes`);
          
          // Set content type based on detected MIME type for videos
          if (folder === "videos" && mimeType.startsWith('video/')) {
            contentType = mimeType; // Use detected video type (video/mp4, video/webm, etc.)
          }
        } else {
          // Assume it's raw base64 without prefix
          console.log(`[S3 Upload] No MIME prefix detected, assuming raw base64`);
          buffer = Buffer.from(file, "base64");
        }
      } else {
        buffer = file;
        console.log(`[S3 Upload] Received Buffer directly, size: ${buffer.length} bytes`);
      }

      // Convert images to WebP, upload videos as-is
      if (folder === "videos") {
        processedBuffer = buffer;
        if (!contentType) {
          contentType = "video/mp4";
        }
        console.log(`[S3 Upload] Video upload - ContentType: ${contentType}, Size: ${processedBuffer.length} bytes`);
      } else {
        // Convert image to WebP format
        console.log("Converting image to WebP...");
        processedBuffer = await sharp(buffer)
          .webp({ quality: 80 }) // Optimal quality WebP (80 = great quality + smaller size)
          .toBuffer();
        contentType = "image/webp";
        
        // Update filename extension to .webp
        filename = filename.replace(/\.(jpg|jpeg|png|gif)$/i, ".webp");
        if (!filename.endsWith(".webp")) {
          filename = filename.replace(/\.[^.]+$/, ".webp");
        }
        console.log(`[S3 Upload] Image converted to WebP, Size: ${processedBuffer.length} bytes`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `${folder}/${timestamp}-${sanitizedFilename}`;

      console.log(`[S3 Upload] Uploading to S3 - Key: ${key}, ContentType: ${contentType}`);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: processedBuffer,
        ContentType: contentType,
        // Make the file publicly readable
        // ACL: "public-read", // Commented out - may not be allowed on bucket
      });

      await s3Client.send(command);

      const url = `${S3_BASE_URL}/${key}`;

      console.log(`✓ Uploaded to S3: ${url}`);
      return { url, key };
    } catch (error) {
      console.error("Error uploading to S3:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (e.g., 'images/123456-filename.jpg')
   * @returns Promise<void>
   */
  export async function deleteFromS3(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Error deleting from S3:", error);
      throw new Error("Failed to delete file from S3");
    }
  }

  /**
   * Extract S3 key from full URL
   * @param url - Full S3 URL
   * @returns S3 key or null
   */
  export function extractS3Key(url: string): string | null {
    try {
      // Handle S3 URLs: https://bucket.s3.region.amazonaws.com/folder/file.jpg
      const matches = url.match(/amazonaws\.com\/(.+)$/);
      if (matches && matches[1]) {
        return matches[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting S3 key:", error);
      return null;
    }
  }

  /**
   * Upload multiple images to S3
   * @param files - Array of file buffers or base64 strings
   * @param baseName - Base name for files
   * @returns Promise with array of uploaded file URLs
   */
  export async function uploadMultipleToS3(
    files: (Buffer | string)[],
    baseName: string = "product"
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const filename = `${baseName}-${index + 1}.jpg`;
      return uploadToS3(file, filename, "images");
    });

    return Promise.all(uploadPromises);
  }
