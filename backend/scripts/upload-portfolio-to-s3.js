import "dotenv/config";
import fs from "fs";
import { readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultSourceDir = path.resolve(scriptDir, "../../../werbens-creations");
const sourceDir = path.resolve(process.env.PORTFOLIO_MEDIA_DIR || defaultSourceDir);
const prefix = String(process.env.PORTFOLIO_S3_PREFIX || "portfolio").replace(/^\/+|\/+$/g, "");
const categoryMarkerPrefix = `${prefix}/.categories`;
const bucket = process.env.AWS_S3_BUCKET || "werbens";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const mimeTypes = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

function encodeS3Segment(value) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function getMediaType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".m4v"].includes(extension)) return "video";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension)) return "image";
  return null;
}

async function objectExists(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") return false;
    throw error;
  }
}

async function putCategoryMarker(category) {
  const key = `${categoryMarkerPrefix}/${encodeS3Segment(category)}.json`;
  if (await objectExists(key)) return;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify({ name: category, migratedAt: new Date().toISOString() }),
      ContentType: "application/json",
    })
  );
}

async function uploadFile(category, fileName, filePath, fileStat) {
  const key = `${prefix}/${encodeS3Segment(category)}/${encodeS3Segment(fileName)}`;
  if (process.argv.includes("--skip-existing") && (await objectExists(key))) {
    return "skipped";
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentLength: fileStat.size,
      ContentType: mimeTypes[path.extname(fileName).toLowerCase()] || "application/octet-stream",
    })
  );
  return "uploaded";
}

async function main() {
  const categories = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

  let uploaded = 0;
  let skipped = 0;
  let unsupported = 0;

  for (const categoryEntry of categories) {
    const category = categoryEntry.name;
    await putCategoryMarker(category);
    const categoryPath = path.join(sourceDir, category);
    const files = (await readdir(categoryPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

    for (const file of files) {
      if (!getMediaType(file.name)) {
        unsupported += 1;
        continue;
      }

      const filePath = path.join(categoryPath, file.name);
      const fileStat = await stat(filePath);
      const result = await uploadFile(category, file.name, filePath, fileStat);
      if (result === "skipped") skipped += 1;
      if (result === "uploaded") uploaded += 1;
      console.log(`${result}: ${category}/${file.name}`);
    }
  }

  console.log(JSON.stringify({ bucket, prefix, sourceDir, uploaded, skipped, unsupported }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
