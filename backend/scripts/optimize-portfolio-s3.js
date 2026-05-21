import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { preparePortfolioUpload } from "../lib/portfolioMediaProcessing.js";

const prefix = String(process.env.PORTFOLIO_S3_PREFIX || "portfolio").replace(/^\/+|\/+$/g, "");
const thumbnailPrefix = `${prefix}/.thumbnails`;
const categoryMarkerPrefix = `${prefix}/.categories`;
const bucket = process.env.AWS_S3_BUCKET || "werbens";
const tmpDir = path.join(os.tmpdir(), "werbens-portfolio-optimize");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const mimeTypes = {
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function decodeS3Segment(value) {
  return decodeURIComponent(String(value || "").replace(/\+/g, "%20"));
}

function encodeS3Segment(value) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function getMediaType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".m4v"].includes(extension)) return "video";
  return null;
}

function parseMediaKey(key) {
  const mediaPrefix = `${prefix}/`;
  if (
    !key.startsWith(mediaPrefix) ||
    key.startsWith(`${categoryMarkerPrefix}/`) ||
    key.startsWith(`${thumbnailPrefix}/`)
  ) return null;

  const remainder = key.slice(mediaPrefix.length);
  const slashIndex = remainder.indexOf("/");
  if (slashIndex <= 0 || slashIndex === remainder.length - 1) return null;

  const category = decodeS3Segment(remainder.slice(0, slashIndex));
  const fileName = decodeS3Segment(remainder.slice(slashIndex + 1));
  if (!getMediaType(fileName)) return null;
  return { category, fileName, key };
}

function getThumbnailKey(category, fileName) {
  return `${thumbnailPrefix}/${encodeS3Segment(category)}/${encodeS3Segment(`${path.parse(fileName).name}.jpg`)}`;
}

async function listS3Objects(listPrefix) {
  const objects = [];
  let ContinuationToken;
  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: listPrefix,
        ContinuationToken,
      })
    );
    objects.push(...(response.Contents || []));
    ContinuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}

async function streamToFile(stream, filePath) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    stream.pipe(output);
    stream.on("error", reject);
    output.on("error", reject);
    output.on("finish", resolve);
  });
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

async function optimizeObject(item) {
  const localPath = path.join(tmpDir, item.category, item.fileName);
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: item.key }));
  await streamToFile(response.Body, localPath);

  const processed = await preparePortfolioUpload(localPath, item.fileName);
  const mediaStat = await fs.promises.stat(processed.mediaPath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: item.key,
      Body: fs.createReadStream(processed.mediaPath),
      ContentLength: mediaStat.size,
      ContentType: mimeTypes[path.extname(item.fileName).toLowerCase()] || "application/octet-stream",
    })
  );

  if (processed.thumbnailPath) {
    const thumbnailStat = await fs.promises.stat(processed.thumbnailPath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: getThumbnailKey(item.category, item.fileName),
        Body: fs.createReadStream(processed.thumbnailPath),
        ContentLength: thumbnailStat.size,
        ContentType: "image/jpeg",
      })
    );
  }

  await fs.promises.rm(path.dirname(localPath), { recursive: true, force: true });
  for (const cleanupPath of processed.cleanupPaths) {
    await fs.promises.rm(cleanupPath, { force: true });
  }
}

async function main() {
  const skipWithThumbnail = process.argv.includes("--skip-with-thumbnail");
  await fs.promises.mkdir(tmpDir, { recursive: true });

  const objects = await listS3Objects(`${prefix}/`);
  const videos = objects
    .map((object) => parseMediaKey(object.Key))
    .filter(Boolean)
    .sort((a, b) => `${a.category}/${a.fileName}`.localeCompare(`${b.category}/${b.fileName}`, "en", { numeric: true }));

  let optimized = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    try {
      if (skipWithThumbnail && (await objectExists(getThumbnailKey(video.category, video.fileName)))) {
        skipped += 1;
        console.log(`skipped: ${video.category}/${video.fileName}`);
        continue;
      }
      await optimizeObject(video);
      optimized += 1;
      console.log(`optimized: ${video.category}/${video.fileName}`);
    } catch (error) {
      failed += 1;
      console.error(`failed: ${video.category}/${video.fileName}`);
      console.error(error.message);
    }
  }

  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  console.log(JSON.stringify({ bucket, prefix, optimized, skipped, failed }, null, 2));
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
