require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Please define MONGODB_URI in .env.local");
  process.exit(1);
}

const TARGET_BUCKET_HOST = "amzn-crystalbowl-bucket.s3.ap-southeast-1.amazonaws.com";
const KNOWN_S3_SUFFIX = ".s3.ap-southeast-1.amazonaws.com";

const ProductSchema = new mongoose.Schema(
  {
    imageUrl: { type: [String], default: [] },
  },
  { collection: "products" }
);

const Product = mongoose.models.ProductImageMigration || mongoose.model("ProductImageMigration", ProductSchema);

function rewriteImageUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { changed: false, value: rawUrl };
  }

  const value = rawUrl.trim();

  // Ignore base64 and non-http strings
  if (value.startsWith("data:") || (!value.startsWith("http://") && !value.startsWith("https://"))) {
    return { changed: false, value: rawUrl };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { changed: false, value: rawUrl };
  }

  const originalHost = parsed.hostname;
  let updated = false;

  // Case 1: old bucket host or any *.s3.ap-southeast-1.amazonaws.com host -> target bucket host
  if (originalHost.endsWith(KNOWN_S3_SUFFIX) && originalHost !== TARGET_BUCKET_HOST) {
    parsed.hostname = TARGET_BUCKET_HOST;
    updated = true;
  }

  // Case 2: path-style URL, e.g. s3.ap-southeast-1.amazonaws.com/bucket-name/images/file.webp
  if (parsed.hostname === "s3.ap-southeast-1.amazonaws.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      // Remove leading bucket segment and move to target virtual-host style URL
      parsed.hostname = TARGET_BUCKET_HOST;
      parsed.pathname = `/${segments.slice(1).join("/")}`;
      updated = true;
    }
  }

  const nextValue = parsed.toString();
  if (!updated || nextValue === value) {
    return { changed: false, value: rawUrl };
  }

  return { changed: true, value: nextValue };
}

async function run() {
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

  if (!apply) {
    console.log("Running in DRY-RUN mode. No DB writes will be made.");
    console.log("Use --apply to write changes.");
  } else {
    console.log("Running in APPLY mode. Changes will be written.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let scanned = 0;
  let changedDocs = 0;
  let changedUrls = 0;

  const cursor = Product.find(
    { imageUrl: { $exists: true, $ne: [] } },
    { imageUrl: 1 }
  ).cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned += 1;

    const original = Array.isArray(doc.imageUrl) ? doc.imageUrl : [];
    const rewritten = [];
    let docChanged = false;

    for (const url of original) {
      const result = rewriteImageUrl(url);
      rewritten.push(result.value);
      if (result.changed) {
        changedUrls += 1;
        docChanged = true;
      }
    }

    if (docChanged) {
      changedDocs += 1;
      console.log(`\n[${doc._id}] imageUrl updated`);
      for (let i = 0; i < original.length; i += 1) {
        if (original[i] !== rewritten[i]) {
          console.log(`- ${original[i]}`);
          console.log(`+ ${rewritten[i]}`);
        }
      }

      if (apply) {
        await Product.updateOne({ _id: doc._id }, { $set: { imageUrl: rewritten } });
      }
    }

    if (limit > 0 && scanned >= limit) {
      console.log(`\nReached limit=${limit}, stopping early.`);
      break;
    }
  }

  console.log("\nMigration summary");
  console.log(`- scanned docs: ${scanned}`);
  console.log(`- docs to change: ${changedDocs}`);
  console.log(`- image URLs changed: ${changedUrls}`);
  console.log(`- mode: ${apply ? "APPLY" : "DRY-RUN"}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

run().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // noop
  }
  process.exit(1);
});
