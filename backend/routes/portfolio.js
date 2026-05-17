import fs from "fs";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { access, mkdir, readdir, realpath, rename, rm, stat, unlink } from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MEDIA_ROOT = path.resolve(moduleDir, "../../../werbens-creations");
const MEDIA_ROOT = path.resolve(process.env.PORTFOLIO_MEDIA_DIR || DEFAULT_MEDIA_ROOT);
const CATALOG_TTL_MS = Math.max(1000, Number(process.env.PORTFOLIO_CATALOG_TTL_MS) || 15000);
const ADMIN_PASSWORD = process.env.PORTFOLIO_ADMIN_PASSWORD || "JuiceWrld@999";
const ADMIN_SECRET = process.env.PORTFOLIO_ADMIN_SECRET || randomBytes(32).toString("hex");
const ADMIN_TOKEN_TTL_MS = Math.max(60_000, Number(process.env.PORTFOLIO_ADMIN_TOKEN_TTL_MS) || 6 * 60 * 60_000);
const MAX_UPLOAD_BYTES = Math.max(1024 * 1024, Number(process.env.PORTFOLIO_MAX_UPLOAD_MB || 750) * 1024 * 1024);
const UPLOAD_TMP_DIR = path.join(MEDIA_ROOT, ".portfolio-upload-tmp");

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
let mediaRootRealPath = null;

fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";
}

function isSafeSegment(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "." &&
    value !== ".." &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
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
  const payload = safeBase64UrlEncode(
    JSON.stringify({
      exp: Date.now() + ADMIN_TOKEN_TTL_MS,
      iat: Date.now(),
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
  if (!isSafeSegment(category) || category.startsWith(".")) {
    const error = new Error("Invalid category name.");
    error.status = 400;
    throw error;
  }
  return category;
}

function ensureSafeFileName(value) {
  const fileName = sanitizeFileName(value);
  if (!isSafeSegment(fileName) || fileName.startsWith(".")) {
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

async function resolveInsideMediaRoot(...segments) {
  const rootRealPath = await getMediaRootRealPath();
  const targetPath = path.resolve(MEDIA_ROOT, ...segments);
  const relative = path.relative(rootRealPath, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    const error = new Error("Portfolio path is not allowed.");
    error.status = 403;
    throw error;
  }
  return targetPath;
}

async function resolveCategoryPath(categoryName) {
  return resolveInsideMediaRoot(ensureSafeCategoryName(categoryName));
}

async function resolveMediaPath(categoryName, fileName) {
  const category = ensureSafeCategoryName(categoryName);
  const mediaFile = ensureSafeFileName(fileName);
  ensureSupportedMediaFile(mediaFile);
  return resolveInsideMediaRoot(category, mediaFile);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function getUniqueDestination(categoryPath, fileName) {
  const parsed = path.parse(fileName);
  let candidate = path.join(categoryPath, fileName);
  let index = 1;

  while (await pathExists(candidate)) {
    candidate = path.join(categoryPath, `${parsed.name} (${index})${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

function cleanupUploadedFiles(files = []) {
  files.forEach((file) => {
    if (file?.path) {
      rm(file.path, { force: true }).catch(() => {});
    }
  });
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

function buildMediaPath(categoryName, fileName, modifiedMs) {
  return `/api/portfolio/media/${encodeURIComponent(categoryName)}/${encodeURIComponent(fileName)}?v=${modifiedMs}`;
}

async function getMediaRootRealPath() {
  if (!mediaRootRealPath) {
    mediaRootRealPath = await realpath(MEDIA_ROOT);
  }
  return mediaRootRealPath;
}

async function scanCategory(categoryEntry) {
  const categoryPath = path.join(MEDIA_ROOT, categoryEntry.name);
  const categoryFiles = await readdir(categoryPath, { withFileTypes: true });
  const mediaFiles = categoryFiles
    .filter((entry) => entry.isFile() && getMediaType(entry.name))
    .sort((a, b) => collator.compare(a.name, b.name));

  const items = await Promise.all(
    mediaFiles.map(async (entry) => {
      const filePath = path.join(categoryPath, entry.name);
      const fileStat = await stat(filePath);
      const extension = getExtension(entry.name);
      const modifiedMs = Math.trunc(fileStat.mtimeMs);

      return {
        id: `${categoryEntry.name}::${entry.name}`,
        category: categoryEntry.name,
        extension: extension.replace(".", ""),
        fileName: entry.name,
        formattedSize: formatBytes(fileStat.size),
        mediaPath: buildMediaPath(categoryEntry.name, entry.name, modifiedMs),
        mimeType: MIME_TYPES[extension] || "application/octet-stream",
        modifiedAt: fileStat.mtime.toISOString(),
        sizeBytes: fileStat.size,
        title: formatTitle(entry.name),
        type: getMediaType(entry.name),
      };
    })
  );

  const videoCount = items.filter((item) => item.type === "video").length;
  const imageCount = items.filter((item) => item.type === "image").length;

  return {
    id: slugify(categoryEntry.name),
    imageCount,
    itemCount: items.length,
    items,
    name: categoryEntry.name,
    videoCount,
  };
}

async function buildPortfolioCatalog({ includeEmpty = false } = {}) {
  await access(MEDIA_ROOT, fs.constants.R_OK);

  const categoryEntries = (await readdir(MEDIA_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((a, b) => collator.compare(a.name, b.name));

  const categories = (await Promise.all(categoryEntries.map(scanCategory))).filter(
    (category) => includeEmpty || category.itemCount > 0
  );

  return {
    categories,
    generatedAt: new Date().toISOString(),
    totalImages: categories.reduce((sum, category) => sum + category.imageCount, 0),
    totalItems: categories.reduce((sum, category) => sum + category.itemCount, 0),
    totalVideos: categories.reduce((sum, category) => sum + category.videoCount, 0),
  };
}

async function getPortfolioCatalog(options = {}) {
  if (options.includeEmpty) {
    return buildPortfolioCatalog(options);
  }

  const now = Date.now();
  if (catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.data;
  }

  const data = await buildPortfolioCatalog(options);
  catalogCache = {
    data,
    expiresAt: now + CATALOG_TTL_MS,
  };
  return data;
}

function parseRange(rangeHeader, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;

  if (start === null && end === null) return null;

  if (start === null) {
    const suffixLength = end;
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    if (!Number.isInteger(start) || start < 0) return null;
    end = end === null ? size - 1 : end;
  }

  if (!Number.isInteger(end) || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

function sendStream(filePath, res, streamOptions = {}) {
  const stream = fs.createReadStream(filePath, streamOptions);
  stream.on("error", (error) => {
    if (!res.headersSent) {
      res.status(500).json({ error: "Unable to stream portfolio media." });
      return;
    }
    res.destroy(error);
  });
  stream.pipe(res);
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
    const catalog = await getPortfolioCatalog({
      includeEmpty: includeEmptyRequested && verifyAdminToken(getBearerToken(req)),
    });
    res.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    res.json(catalog);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    res.status(status).json({
      error:
        status === 404
          ? "Portfolio media folder was not found."
          : "Unable to load portfolio catalog.",
    });
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
    const categoryPath = await resolveCategoryPath(category);
    await mkdir(categoryPath, { recursive: true });
    clearCatalogCache();
    await sendAdminCatalog(res, 201);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Unable to create category." });
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
    const categoryPath = await resolveCategoryPath(category);
    await mkdir(categoryPath, { recursive: true });

    const uploaded = [];
    for (const file of files) {
      const fileName = ensureSafeFileName(file.originalname);
      const destinationPath = await getUniqueDestination(categoryPath, fileName);
      await rename(file.path, destinationPath);
      uploaded.push(path.basename(destinationPath));
    }

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

    const sourcePath = await resolveMediaPath(currentCategory, currentFile);
    const targetCategoryPath = await resolveCategoryPath(nextCategory);
    await mkdir(targetCategoryPath, { recursive: true });
    const targetPath = await resolveMediaPath(nextCategory, nextFile);

    if (sourcePath !== targetPath && (await pathExists(targetPath))) {
      res.status(409).json({ error: "A media file with that name already exists." });
      return;
    }

    await rename(sourcePath, targetPath);
    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    res.status(error.status || (error?.code === "ENOENT" ? 404 : 500)).json({
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
    const currentPath = await resolveMediaPath(category, currentFile);
    const currentStat = await stat(currentPath);
    if (!currentStat.isFile()) {
      res.status(404).json({ error: "Portfolio media was not found." });
      return;
    }

    const replacementName = ensureSafeFileName(file.originalname);
    const replacementExtension = path.extname(replacementName);
    const currentBaseName = path.basename(currentFile, path.extname(currentFile));
    const nextFile = `${currentBaseName}${replacementExtension}`;
    const targetPath = await resolveMediaPath(category, nextFile);

    if (targetPath !== currentPath && (await pathExists(targetPath))) {
      res.status(409).json({ error: "A replacement target with that extension already exists." });
      return;
    }

    await rename(file.path, targetPath);
    if (targetPath !== currentPath) {
      await unlink(currentPath);
    }

    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    cleanupUploadedFiles([file].filter(Boolean));
    res.status(error.status || (error?.code === "ENOENT" ? 404 : 500)).json({
      error: error.message || "Unable to replace media.",
    });
  }
}

export async function deletePortfolioMediaHandler(req, res) {
  try {
    const mediaPath = await resolveMediaPath(req.params.category, req.params.file);
    await unlink(mediaPath);
    clearCatalogCache();
    await sendAdminCatalog(res);
  } catch (error) {
    res.status(error.status || (error?.code === "ENOENT" ? 404 : 500)).json({
      error: error.message || "Unable to delete media.",
    });
  }
}

export async function streamPortfolioMediaHandler(req, res) {
  try {
    const { category, file } = req.params;
    if (!isSafeSegment(category) || !isSafeSegment(file)) {
      res.status(400).json({ error: "Invalid portfolio media path." });
      return;
    }

    const mediaType = getMediaType(file);
    const extension = getExtension(file);
    if (!mediaType) {
      res.status(415).json({ error: "Unsupported portfolio media type." });
      return;
    }

    const rootRealPath = await getMediaRootRealPath();
    const requestedPath = path.resolve(MEDIA_ROOT, category, file);
    const realFilePath = await realpath(requestedPath);
    if (!realFilePath.startsWith(`${rootRealPath}${path.sep}`)) {
      res.status(403).json({ error: "Portfolio media path is not allowed." });
      return;
    }

    const fileStat = await stat(realFilePath);
    if (!fileStat.isFile()) {
      res.status(404).json({ error: "Portfolio media was not found." });
      return;
    }

    const etag = `W/"${fileStat.size}-${Math.trunc(fileStat.mtimeMs)}"`;
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", fileStat.mtime.toUTCString());

    const range = req.headers.range;
    if (range) {
      const parsedRange = parseRange(range, fileStat.size);
      if (!parsedRange) {
        res.setHeader("Content-Range", `bytes */${fileStat.size}`);
        res.status(416).end();
        return;
      }

      const { start, end } = parsedRange;
      const contentLength = end - start + 1;
      res.status(206);
      res.setHeader("Content-Length", contentLength);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileStat.size}`);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      sendStream(realFilePath, res, { start, end });
      return;
    }

    res.setHeader("Content-Length", fileStat.size);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    sendStream(realFilePath, res);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
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
