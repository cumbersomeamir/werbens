import fs from "fs";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";

const CATALOG_TTL_MS = Math.max(1000, Number(process.env.PORTFOLIO_CATALOG_TTL_MS) || 5 * 60 * 1000);
const ADMIN_PASSWORD = process.env.PORTFOLIO_ADMIN_PASSWORD || "JuiceWrld@999";
const ADMIN_SECRET = process.env.PORTFOLIO_ADMIN_SECRET || randomBytes(32).toString("hex");
const ADMIN_TOKEN_TTL_MS = Math.max(60_000, Number(process.env.PORTFOLIO_ADMIN_TOKEN_TTL_MS) || 6 * 60 * 60_000);
const MAX_UPLOAD_BYTES = Math.max(1024 * 1024, Number(process.env.PORTFOLIO_MAX_UPLOAD_MB || 750) * 1024 * 1024);
const PORTFOLIO_PREFIX = String(process.env.PORTFOLIO_S3_PREFIX || "portfolio")
  .replace(/^\/+|\/+$/g, "");
const MEDIA_URL_EXPIRES_SECONDS = Math.max(
  300,
  Number(process.env.PORTFOLIO_MEDIA_URL_EXPIRES_SECONDS) || 12 * 60 * 60
);
const CATEGORY_MARKER_PREFIX = `${PORTFOLIO_PREFIX}/.categories`;
const CATEGORY_ORDER_KEY = `${PORTFOLIO_PREFIX}/.category-order.json`;
const UPLOAD_TMP_DIR = path.join(os.tmpdir(), "werbens-portfolio-uploads");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "werbens";
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MIME_TYPES = {
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

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
let catalogCache = null;

fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";
}

function clearCatalogCache() {
  catalogCache = null;
}

function safeBase64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function safeBase64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenPayload(payload) {
  return createHmac("sha256", ADMIN_SECRET).update(payload).digest("base64url");
}

function createAdminToken() {
  const now = Date.now();
  const payload = safeBase64UrlEncode(
    JSON.stringify({
      exp: now + ADMIN_TOKEN_TTL_MS,
      iat: now,
      scope: "portfolio-admin",
    })
  );
  return `${payload}.${signTokenPayload(payload)}`;
}

function verifyAdminToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;

  const expectedSignature = signTokenPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(safeBase64UrlDecode(payload));
    return parsed.scope === "portfolio-admin" && Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function sanitizeCategoryName(value) {
  return String(value || "")
    .replace(/\0/g, "")
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFileName(value) {
  const parsed = path.parse(path.basename(String(value || "").replace(/\0/g, "")));
  const extension = parsed.ext.toLowerCase();
  const cleanName = parsed.name
    .replace(/[\\/]+/g, " ")
    .replace(/[:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanName || !getMediaType(`file${extension}`)) return "";
  return `${cleanName}${extension}`;
}

function ensureSafeCategoryName(value) {
  const category = sanitizeCategoryName(value);
  if (!category || category === "." || category === ".." || category.startsWith(".")) {
    const error = new Error("Invalid category name.");
    error.status = 400;
    throw error;
  }
  return category;
}

function ensureSafeFileName(value) {
  const fileName = sanitizeFileName(value);
  if (!fileName || fileName === "." || fileName === ".." || fileName.startsWith(".")) {
    const error = new Error("Invalid media file name.");
    error.status = 400;
    throw error;
  }
  return fileName;
}

function ensureSupportedMediaFile(fileName) {
  if (!getMediaType(fileName)) {
    const error = new Error("Unsupported media type.");
    error.status = 415;
    throw error;
  }
}

function getExtension(fileName) {
  return path.extname(fileName).toLowerCase();
}

function getMediaType(fileName) {
  const extension = getExtension(fileName);
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  return null;
}

function getContentType(fileName) {
  return MIME_TYPES[getExtension(fileName)] || "application/octet-stream";
}

function formatTitle(fileName) {
  const title = path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return title || "Portfolio item";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

function encodeS3Segment(value) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function decodeS3Segment(value) {
  return decodeURIComponent(String(value || "").replace(/\+/g, "%20"));
}

function getMediaKey(categoryName, fileName) {
  const category = ensureSafeCategoryName(categoryName);
  const mediaFile = ensureSafeFileName(fileName);
  ensureSupportedMediaFile(mediaFile);
  return `${PORTFOLIO_PREFIX}/${encodeS3Segment(category)}/${encodeS3Segment(mediaFile)}`;
}

function getCategoryMarkerKey(categoryName) {
  const category = ensureSafeCategoryName(categoryName);
  return `${CATEGORY_MARKER_PREFIX}/${encodeS3Segment(category)}.json`;
}

function parseMediaKey(key) {
  const prefix = `${PORTFOLIO_PREFIX}/`;
  if (!key.startsWith(prefix) || key.startsWith(`${CATEGORY_MARKER_PREFIX}/`)) return null;

  const remainder = key.slice(prefix.length);
  const slashIndex = remainder.indexOf("/");
  if (slashIndex <= 0 || slashIndex === remainder.length - 1) return null;

  const category = decodeS3Segment(remainder.slice(0, slashIndex));
  const fileName = decodeS3Segment(remainder.slice(slashIndex + 1));
  if (!getMediaType(fileName)) return null;
  return { category, fileName };
}

function parseCategoryMarkerKey(key) {
  const prefix = `${CATEGORY_MARKER_PREFIX}/`;
  if (!key.startsWith(prefix) || !key.endsWith(".json")) return null;
  return decodeS3Segment(key.slice(prefix.length, -5));
}

function buildMediaPath(categoryName, fileName, modifiedMs) {
  return `/api/portfolio/media/${encodeURIComponent(categoryName)}/${encodeURIComponent(fileName)}?v=${modifiedMs}`;
}

async function buildSignedMediaUrl(fileName, key) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentType: getContentType(fileName),
    }),
    { expiresIn: MEDIA_URL_EXPIRES_SECONDS }
  );
}

async function listS3Objects(prefix) {
  const objects = [];
  let ContinuationToken;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken,
      })
    );
    objects.push(...(response.Contents || []));
    ContinuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (ContinuationToken);

  return objects;
}

async function s3ObjectExists(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false;
    }
    throw error;
  }
}

async function getUniqueFileName(category, fileName) {
  const parsed = path.parse(fileName);
  let candidate = fileName;
  let index = 1;

  while (await s3ObjectExists(getMediaKey(category, candidate))) {
    candidate = `${parsed.name} (${index})${parsed.ext}`;
    index += 1;
  }

  return candidate;
}

async function putCategoryMarker(category) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: getCategoryMarkerKey(category),
      Body: JSON.stringify({ name: category, createdAt: new Date().toISOString() }),
      ContentType: "application/json",
    })
  );
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function getCategoryOrder() {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: CATEGORY_ORDER_KEY,
      })
    );
    const body = JSON.parse(await streamToString(response.Body));
    return Array.isArray(body?.order) ? body.order.filter(Boolean).map(String) : [];
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey") {
      return [];
    }
    throw error;
  }
}

async function putCategoryOrder(order) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: CATEGORY_ORDER_KEY,
      Body: JSON.stringify({ order, updatedAt: new Date().toISOString() }),
      ContentType: "application/json",
    })
  );
}

function applyCategoryOrder(categories, order) {
  const orderIndex = new Map(order.map((name, index) => [name, index]));
  return categories.sort((a, b) => {
    const aIndex = orderIndex.has(a.name) ? orderIndex.get(a.name) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.has(b.name) ? orderIndex.get(b.name) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return collator.compare(a.name, b.name);
  });
}

async function buildPortfolioCatalog({ includeEmpty = false } = {}) {
  const [objects, categoryOrder] = await Promise.all([
    listS3Objects(`${PORTFOLIO_PREFIX}/`),
    getCategoryOrder(),
  ]);
  const categoryMap = new Map();

  for (const object of objects) {
    const markerCategory = parseCategoryMarkerKey(object.Key);
    if (markerCategory && includeEmpty && !categoryMap.has(markerCategory)) {
      categoryMap.set(markerCategory, []);
      continue;
    }

    const parsed = parseMediaKey(object.Key);
    if (!parsed) continue;
    if (!categoryMap.has(parsed.category)) categoryMap.set(parsed.category, []);
    categoryMap.get(parsed.category).push({
      ...parsed,
      key: object.Key,
      lastModified: object.LastModified,
      sizeBytes: Number(object.Size || 0),
    });
  }

  const categories = (await Promise.all(Array.from(categoryMap.entries())
    .map(async ([name, files]) => {
      const items = await Promise.all(files
        .sort((a, b) => collator.compare(a.fileName, b.fileName))
        .map(async (file) => {
          const extension = getExtension(file.fileName);
          const modifiedMs = file.lastModified ? new Date(file.lastModified).getTime() : Date.now();
          return {
            id: `${file.category}::${file.fileName}`,
            category: file.category,
            extension: extension.replace(".", ""),
            fileName: file.fileName,
            formattedSize: formatBytes(file.sizeBytes),
            mediaUrl: await buildSignedMediaUrl(file.fileName, file.key),
            mediaPath: buildMediaPath(file.category, file.fileName, modifiedMs),
            mimeType: getContentType(file.fileName),
            modifiedAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
            sizeBytes: file.sizeBytes,
            title: formatTitle(file.fileName),
            type: getMediaType(file.fileName),
          };
        }));

      const videoCount = items.filter((item) => item.type === "video").length;
      const imageCount = items.filter((item) => item.type === "image").length;

      return {
        id: slugify(name),
        imageCount,
        itemCount: items.length,
        items,
        name,
        videoCount,
      };
    })))
    .filter((category) => includeEmpty || category.itemCount > 0);

  applyCategoryOrder(categories, categoryOrder);

  return {
    categories,
    generatedAt: new Date().toISOString(),
    totalImages: categories.reduce((sum, category) => sum + category.imageCount, 0),
    totalItems: categories.reduce((sum, category) => sum + category.itemCount, 0),
    totalVideos: categories.reduce((sum, category) => sum + category.videoCount, 0),
  };
}

async function getPortfolioCatalog(options = {}) {
  if (options.includeEmpty) return buildPortfolioCatalog(options);

  const now = Date.now();
  if (catalogCache && catalogCache.expiresAt > now) return catalogCache.data;

  const data = await buildPortfolioCatalog(options);
  catalogCache = {
    data,
    expiresAt: now + CATALOG_TTL_MS,
  };
  return data;
}

function cleanupUploadedFiles(files = []) {
  files.forEach((file) => {
    if (file?.path) rm(file.path, { force: true }).catch(() => {});
  });
}

const upload = multer({
  dest: UPLOAD_TMP_DIR,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 20,
  },
  fileFilter(req, file, callback) {
    try {
      ensureSupportedMediaFile(file.originalname);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  },
});

function wrapMulter(middleware) {
  return (req, res, next) => {
    middleware(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      cleanupUploadedFiles([...(req.files || []), req.file].filter(Boolean));
      const message =
        error instanceof multer.MulterError
          ? error.code === "LIMIT_FILE_SIZE"
            ? `Upload is too large. Max file size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
            : error.message
          : error.message || "Unable to upload portfolio media.";
      res.status(error.status || 400).json({ error: message });
    });
  };
}

export const uploadPortfolioMediaMiddleware = wrapMulter(upload.array("files", 20));
export const replacePortfolioMediaMiddleware = wrapMulter(upload.single("file"));

export async function getPortfolioCatalogHandler(req, res) {
  try {
    const includeEmptyRequested =
      req.query.includeEmpty === "1" || req.query.includeEmpty === "true";
    const includeEmpty = includeEmptyRequested && verifyAdminToken(getBearerToken(req));
    const catalog = await getPortfolioCatalog({ includeEmpty });
    res.set(
      "Cache-Control",
      includeEmpty ? "private, no-store" : "public, max-age=300, stale-while-revalidate=600"
    );
    res.json(catalog);
  } catch {
    res.status(500).json({ error: "Unable to load portfolio catalog." });
  }
}

async function sendAdminCatalog(res, status = 200) {
  const catalog = await getPortfolioCatalog({ includeEmpty: true });
  res.status(status).json({ catalog });
}

export function portfolioAdminAuth(req, res, next) {
  if (!verifyAdminToken(getBearerToken(req))) {
    res.status(401).json({ error: "Portfolio admin access denied." });
    return;
  }
  next();
}

export async function createPortfolioAdminTokenHandler(req, res) {
  const password = String(req.body?.password || "");
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  res.json({
    token: createAdminToken(),
    expiresInMs: ADMIN_TOKEN_TTL_MS,
  });
}

export async function createPortfolioCategoryHandler(req, res) {
  try {
    const category = ensureSafeCategoryName(req.body?.name);
    await putCategoryMarker(category);
    const currentOrder = await getCategoryOrder();
    if (!currentOrder.includes(category)) {
      await putCategoryOrder([...currentOrder, category]);
    }
    clearCatalogCache();
    await sendAdminCatalog(res, 201);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Unable to create category." });
  }
}

export async function updatePortfolioCategoryOrderHandler(req, res) {
  try {
    const catalog = await getPortfolioCatalog({ includeEmpty: true });
    const existingNames = catalog.categories.map((item) => item.name);
    const requestedOrder = Array.isArray(req.body?.order) ? req.body.order : null;

    if (requestedOrder) {
      const safeOrder = requestedOrder.map((name) => ensureSafeCategoryName(name));
      const existingSet = new Set(existingNames);
      const safeSet = new Set(safeOrder);
      if (safeOrder.length !== existingNames.length || safeSet.size !== existingNames.length) {
        res.status(400).json({ error: "Category order does not match existing categories." });
        return;
      }
      if (safeOrder.some((name) => !existingSet.has(name))) {
        res.status(400).json({ error: "Category order contains an unknown category." });
        return;
      }

      await putCategoryOrder(safeOrder);
      clearCatalogCache();
      await sendAdminCatalog(res);
      return;
    }

    const category = ensureSafeCategoryName(req.body?.category);
    const direction = String(req.body?.direction || "");
    if (!["up", "down"].includes(direction)) {
      res.status(400).json({ error: "Choose up/down or provide a category order." });
      return;
    }

    const order = [...existingNames];
    const index = order.indexOf(category);
    if (index === -1) {
      res.status(404).json({ error: "Category was not found." });
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= order.length) {
      res.json({ catalog });
      return;
    }

    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    await putCategoryOrder(order);
    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Unable to reorder categories." });
  }
}

export async function uploadPortfolioMediaHandler(req, res) {
  const files = Array.isArray(req.files) ? req.files : [];

  try {
    if (files.length === 0) {
      res.status(400).json({ error: "Choose at least one media file to upload." });
      return;
    }

    const category = ensureSafeCategoryName(req.body?.category);
    await putCategoryMarker(category);

    const uploaded = [];
    for (const file of files) {
      const fileName = await getUniqueFileName(category, ensureSafeFileName(file.originalname));
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: getMediaKey(category, fileName),
          Body: fs.createReadStream(file.path),
          ContentLength: file.size,
          ContentType: getContentType(fileName),
        })
      );
      uploaded.push(fileName);
    }

    cleanupUploadedFiles(files);
    clearCatalogCache();
    const catalog = await getPortfolioCatalog({ includeEmpty: true });
    res.status(201).json({ catalog, uploaded });
  } catch (error) {
    cleanupUploadedFiles(files);
    res.status(error.status || 500).json({ error: error.message || "Unable to upload media." });
  }
}

export async function updatePortfolioMediaHandler(req, res) {
  try {
    const currentCategory = ensureSafeCategoryName(req.params.category);
    const currentFile = ensureSafeFileName(req.params.file);
    const nextCategory = ensureSafeCategoryName(req.body?.category || currentCategory);
    const requestedName = String(req.body?.fileName || currentFile).trim();
    const currentExtension = path.extname(currentFile);
    const nextFile = ensureSafeFileName(
      path.extname(requestedName) ? requestedName : `${requestedName}${currentExtension}`
    );
    const sourceKey = getMediaKey(currentCategory, currentFile);
    const targetKey = getMediaKey(nextCategory, nextFile);

    if (sourceKey !== targetKey && (await s3ObjectExists(targetKey))) {
      res.status(409).json({ error: "A media file with that name already exists." });
      return;
    }

    if (sourceKey !== targetKey) {
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`,
          Key: targetKey,
          ContentType: getContentType(nextFile),
          MetadataDirective: "REPLACE",
        })
      );
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: sourceKey }));
      await putCategoryMarker(nextCategory);
    }

    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    res.status(error.status || (error?.$metadata?.httpStatusCode === 404 ? 404 : 500)).json({
      error: error.message || "Unable to update media.",
    });
  }
}

export async function replacePortfolioMediaHandler(req, res) {
  const file = req.file;

  try {
    if (!file) {
      res.status(400).json({ error: "Choose a replacement media file." });
      return;
    }

    const category = ensureSafeCategoryName(req.params.category);
    const currentFile = ensureSafeFileName(req.params.file);
    const replacementName = ensureSafeFileName(file.originalname);
    const replacementExtension = path.extname(replacementName);
    const currentBaseName = path.basename(currentFile, path.extname(currentFile));
    const nextFile = `${currentBaseName}${replacementExtension}`;
    const currentKey = getMediaKey(category, currentFile);
    const targetKey = getMediaKey(category, nextFile);

    if (!(await s3ObjectExists(currentKey))) {
      res.status(404).json({ error: "Portfolio media was not found." });
      return;
    }

    if (targetKey !== currentKey && (await s3ObjectExists(targetKey))) {
      res.status(409).json({ error: "A replacement target with that extension already exists." });
      return;
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: targetKey,
        Body: fs.createReadStream(file.path),
        ContentLength: file.size,
        ContentType: getContentType(nextFile),
      })
    );
    if (targetKey !== currentKey) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: currentKey }));
    }

    cleanupUploadedFiles([file]);
    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    cleanupUploadedFiles([file].filter(Boolean));
    res.status(error.status || 500).json({
      error: error.message || "Unable to replace media.",
    });
  }
}

export async function deletePortfolioMediaHandler(req, res) {
  try {
    const mediaKey = getMediaKey(req.params.category, req.params.file);
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: mediaKey }));
    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Unable to delete media.",
    });
  }
}

export async function streamPortfolioMediaHandler(req, res) {
  try {
    const category = ensureSafeCategoryName(req.params.category);
    const file = ensureSafeFileName(req.params.file);
    const key = getMediaKey(category, file);
    const extension = getExtension(file);
    const head = await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));

    const etag = head.ETag || `W/"${head.ContentLength || 0}-${head.LastModified?.getTime?.() || 0}"`;
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    const range = req.headers.range;
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Range: range,
      })
    );

    const status = response.ContentRange ? 206 : 200;
    res.status(status);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", response.ContentType || MIME_TYPES[extension] || "application/octet-stream");
    res.setHeader("ETag", etag);
    if (head.LastModified) res.setHeader("Last-Modified", head.LastModified.toUTCString());
    if (response.ContentLength !== undefined) res.setHeader("Content-Length", response.ContentLength);
    if (response.ContentRange) res.setHeader("Content-Range", response.ContentRange);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    response.Body.pipe(res);
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode === 404 ? 404 : 500;
    if (!res.headersSent) {
      res.status(status).json({
        error:
          status === 404
            ? "Portfolio media was not found."
            : "Unable to stream portfolio media.",
      });
    } else {
      res.destroy(error);
    }
  }
}
