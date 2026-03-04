/**
 * Post-to-all routes.
 *
 * This module adds an isolated flow for:
 * - Saving preferred destinations for "Post to All"
 * - Posting one super-form payload across selected connected accounts
 *
 * Existing posting routes are intentionally untouched.
 */

import { getDb } from "../../../../db.js";
import {
  publishToXDirectly,
  publishToLinkedInDirectly,
  publishToInstagramDirectly,
  publishToFacebookDirectly,
} from "../platforms/index.js";
import { createScheduledPostsFromRequest, runDueScheduledPosts } from "../../../../services/socialPostingService.js";
import { uploadImageToS3, getPresignedUrl } from "../../../../services/s3Service.js";

const PREFERENCES_COLLECTION = "PostToAllPreferences";
const MEDIA_UPLOAD_PREFIX = "social-post-to-all";
const IMAGE_UPLOAD_MAX_BYTES = 12 * 1024 * 1024;
const VIDEO_UPLOAD_MAX_BYTES = 35 * 1024 * 1024;
const PRESIGNED_READ_EXPIRES_SECONDS = 60 * 60 * 24 * 7;

function readUserId(req) {
  return String(req?.body?.userId || req?.query?.userId || "").trim();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeMimeType(value) {
  return normalizeText(value).toLowerCase();
}

function toTitleFromCaption(caption) {
  const text = normalizeText(caption);
  if (!text) return "Post";
  const firstLine = text.split(/\r?\n/)[0] || text;
  return firstLine.length > 80 ? `${firstLine.slice(0, 79).trim()}…` : firstLine;
}

function isValidUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeHashtags(value) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(
    new Set(
      list
        .map((tag) => tag.replace(/^#/, "").replace(/[^a-zA-Z0-9_]/g, ""))
        .filter(Boolean)
        .slice(0, 20)
    )
  );
}

function parseBase64DataUrl(input) {
  const raw = normalizeText(input);
  const match = raw.match(/^data:([^;]+);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;
  return {
    mimeType: normalizeMimeType(match[1]),
    base64: String(match[2] || "").replace(/\s+/g, ""),
  };
}

function mediaKindFromMimeType(mimeType) {
  const normalized = normalizeMimeType(mimeType);
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("video/")) return "video";
  return "";
}

function sanitizeFileName(fileName) {
  const base = normalizeText(fileName) || "upload";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

function sanitizePathSegment(value) {
  const base = normalizeText(value) || "user";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "user";
}

function buildFileExtension(fileName, mimeType) {
  const cleanName = sanitizeFileName(fileName);
  const extFromName = cleanName.includes(".") ? cleanName.split(".").pop().toLowerCase() : "";
  if (extFromName && extFromName.length <= 8) return extFromName;

  const lookup = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return lookup[normalizeMimeType(mimeType)] || "bin";
}

function buildMediaKey({ userId, kind, fileName, mimeType }) {
  const now = Date.now();
  const safeUserId = sanitizePathSegment(userId);
  const safeName = sanitizeFileName(fileName).replace(/\.[^.]+$/, "");
  const ext = buildFileExtension(fileName, mimeType);
  const random = Math.random().toString(36).slice(2, 10);
  return `${MEDIA_UPLOAD_PREFIX}/${safeUserId}/${kind}/${now}-${random}-${safeName}.${ext}`;
}

function buildPublicS3Url(key) {
  const base = normalizeText(process.env.AWS_S3_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL);
  if (!base) return "";
  const encodedKey = String(key || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${base.replace(/\/+$/, "")}/${encodedKey}`;
}

function targetKey(platform, channelId) {
  return `${String(platform || "").toLowerCase()}::${String(channelId || "")}`;
}

function uniqueTargets(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const platform = String(row?.platform || "").toLowerCase();
    const channelId = normalizeText(row?.channelId);
    if (!platform || !channelId) continue;
    const key = targetKey(platform, channelId);
    if (!map.has(key)) {
      map.set(key, {
        platform,
        channelId,
        displayName: normalizeText(row?.displayName || row?.username || channelId),
        username: normalizeText(row?.username),
      });
    }
  }
  return Array.from(map.values());
}

async function loadConnectedTargets({ db, userId }) {
  const accounts = await db
    .collection("SocialAccounts")
    .find({ userId })
    .project({
      platform: 1,
      platformUserId: 1,
      channelId: 1,
      username: 1,
      displayName: 1,
      channels: 1,
    })
    .toArray();

  const list = [];
  for (const account of accounts) {
    const platform = String(account?.platform || "").toLowerCase();
    if (!platform) continue;

    const channels = Array.isArray(account?.channels) ? account.channels : [];
    if (channels.length > 0) {
      for (const channel of channels) {
        const channelId = normalizeText(channel?.channelId || channel?.pageId || channel?.igId || "");
        if (!channelId) continue;
        list.push({
          platform,
          channelId,
          displayName: normalizeText(channel?.title || channel?.name || account?.displayName || account?.username || channelId),
          username: normalizeText(channel?.username || account?.username),
        });
      }
      continue;
    }

    const channelId = normalizeText(account?.platformUserId || account?.channelId || "");
    if (!channelId) continue;
    list.push({
      platform,
      channelId,
      displayName: normalizeText(account?.displayName || account?.username || channelId),
      username: normalizeText(account?.username),
    });
  }

  return uniqueTargets(list).sort((a, b) => {
    const p = String(a.platform).localeCompare(String(b.platform));
    if (p !== 0) return p;
    return String(a.displayName || "").localeCompare(String(b.displayName || ""));
  });
}

function filterSelectedTargets(availableTargets, selectedTargets) {
  const availableMap = new Map(
    (Array.isArray(availableTargets) ? availableTargets : []).map((row) => [targetKey(row.platform, row.channelId), row])
  );

  const normalized = uniqueTargets(Array.isArray(selectedTargets) ? selectedTargets : []);
  const result = [];
  const seen = new Set();
  for (const row of normalized) {
    const key = targetKey(row.platform, row.channelId);
    if (seen.has(key)) continue;
    const match = availableMap.get(key);
    if (!match) continue;
    seen.add(key);
    result.push(match);
  }
  return result;
}

function buildCombinedText({ caption, hashtags, linkUrl }) {
  const hashText = hashtags.length ? hashtags.map((tag) => `#${tag}`).join(" ") : "";
  return [caption, hashText, linkUrl].filter(Boolean).join("\n\n").trim();
}

function trimForX(text, limit = 280) {
  const value = normalizeText(text);
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function buildPlatformContent({ platform, caption, hashtags, linkUrl, imageUrl, videoUrl, instagramAltText }) {
  const bodyText = buildCombinedText({ caption, hashtags, linkUrl });
  const title = toTitleFromCaption(caption);

  if (platform === "x") {
    return {
      x_text: trimForX(bodyText || caption),
    };
  }

  if (platform === "linkedin") {
    return {
      linkedin_text: bodyText || caption,
    };
  }

  if (platform === "facebook") {
    const base = {
      facebook_message: bodyText || caption,
      facebook_link: linkUrl || "",
    };
    if (videoUrl) {
      return {
        ...base,
        facebook_video_url: videoUrl,
      };
    }
    return {
      ...base,
    };
  }

  if (platform === "instagram") {
    if (!imageUrl && !videoUrl) {
      throw new Error("Instagram destination selected, but image/video URL is missing.");
    }
    if (videoUrl) {
      return {
        instagram_video_url: videoUrl,
        instagram_caption: bodyText || caption,
      };
    }
    return {
      instagram_image_url: imageUrl,
      instagram_caption: bodyText || caption,
      instagram_alt_text: instagramAltText || "",
    };
  }

  // Generic payload for fallback scheduler adapters.
  return {
    title,
    body: bodyText || caption,
    hashtags,
    videoAssetId: videoUrl || "",
    thumbnailAssetId: imageUrl || "",
  };
}

function buildSummary(results = []) {
  const summary = {
    total: 0,
    posted: 0,
    queued: 0,
    failed: 0,
  };
  for (const row of results) {
    summary.total += 1;
    if (row?.status === "posted") summary.posted += 1;
    else if (row?.status === "queued") summary.queued += 1;
    else summary.failed += 1;
  }
  return summary;
}

async function savePreferences({ db, userId, selectedTargets }) {
  const now = new Date();
  await db.collection(PREFERENCES_COLLECTION).updateOne(
    { userId, feature: "post_to_all" },
    {
      $setOnInsert: { createdAt: now },
      $set: {
        feature: "post_to_all",
        selectedTargets: selectedTargets.map((row) => ({
          platform: row.platform,
          channelId: row.channelId,
          displayName: row.displayName || "",
          username: row.username || "",
        })),
        updatedAt: now,
      },
    },
    { upsert: true }
  );
}

export async function createPostToAllMediaUploadHandler(req, res) {
  const userId = readUserId(req);
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const fileName = normalizeText(req?.body?.fileName) || "upload";
    const declaredMimeType = normalizeMimeType(req?.body?.mimeType);
    const parsed = parseBase64DataUrl(req?.body?.dataUrl);
    if (!parsed) {
      return res.status(400).json({ ok: false, error: "dataUrl must be a valid base64 data URL." });
    }

    if (declaredMimeType && parsed.mimeType && declaredMimeType !== parsed.mimeType) {
      return res.status(400).json({ ok: false, error: "mimeType does not match uploaded file content." });
    }

    const mimeType = declaredMimeType || parsed.mimeType;
    const kind = mediaKindFromMimeType(mimeType);
    if (!kind) {
      return res.status(400).json({ ok: false, error: "Only image/* and video/* uploads are supported." });
    }

    const buffer = Buffer.from(parsed.base64, "base64");
    if (!buffer.length) {
      return res.status(400).json({ ok: false, error: "Uploaded file is empty." });
    }

    const maxBytes = kind === "video" ? VIDEO_UPLOAD_MAX_BYTES : IMAGE_UPLOAD_MAX_BYTES;
    if (buffer.length > maxBytes) {
      return res.status(400).json({
        ok: false,
        error: `${kind} file is too large. Maximum ${Math.round(maxBytes / (1024 * 1024))}MB allowed.`,
      });
    }

    const key = buildMediaKey({ userId, kind, fileName, mimeType });
    await uploadImageToS3({ buffer, key, contentType: mimeType });

    const publicUrl = buildPublicS3Url(key);
    const url = publicUrl || (await getPresignedUrl(key, PRESIGNED_READ_EXPIRES_SECONDS));

    return res.json({
      ok: true,
      kind,
      key,
      url,
      expiresInSeconds: publicUrl ? null : PRESIGNED_READ_EXPIRES_SECONDS,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to upload post media." });
  }
}

export async function getPostToAllPreferencesHandler(req, res) {
  const userId = readUserId(req);
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const db = await getDb();
    const availableTargets = await loadConnectedTargets({ db, userId });
    const prefDoc = await db.collection(PREFERENCES_COLLECTION).findOne({ userId, feature: "post_to_all" });

    let selectedTargets = filterSelectedTargets(availableTargets, prefDoc?.selectedTargets || []);
    if (!selectedTargets.length && !prefDoc) {
      selectedTargets = availableTargets;
    }

    return res.json({
      ok: true,
      availableTargets,
      preferences: {
        selectedTargets,
        updatedAt: prefDoc?.updatedAt || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to load post-to-all preferences." });
  }
}

export async function updatePostToAllPreferencesHandler(req, res) {
  const userId = readUserId(req);
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const db = await getDb();
    const availableTargets = await loadConnectedTargets({ db, userId });
    const selectedTargets = filterSelectedTargets(availableTargets, req?.body?.selectedTargets || []);

    await savePreferences({ db, userId, selectedTargets });

    return res.json({
      ok: true,
      preferences: {
        selectedTargets,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to update post-to-all preferences." });
  }
}

export async function createPostToAllNowHandler(req, res) {
  const userId = readUserId(req);
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const caption = normalizeText(req?.body?.caption);
    if (!caption) {
      return res.status(400).json({ ok: false, error: "caption is required" });
    }

    const hashtags = normalizeHashtags(req?.body?.hashtags);
    const linkUrl = normalizeText(req?.body?.linkUrl);
    const imageUrl = normalizeText(req?.body?.imageUrl);
    const videoUrl = normalizeText(req?.body?.videoUrl);
    const instagramAltText = normalizeText(req?.body?.instagramAltText);
    const savePreference = req?.body?.savePreference === undefined ? true : Boolean(req.body.savePreference);

    if (linkUrl && !isValidUrl(linkUrl)) {
      return res.status(400).json({ ok: false, error: "linkUrl must be a valid http(s) URL" });
    }
    if (imageUrl && !isValidUrl(imageUrl)) {
      return res.status(400).json({ ok: false, error: "imageUrl must be a valid http(s) URL" });
    }
    if (videoUrl && !isValidUrl(videoUrl)) {
      return res.status(400).json({ ok: false, error: "videoUrl must be a valid http(s) URL" });
    }
    if (!linkUrl && !imageUrl && !videoUrl) {
      return res.status(400).json({ ok: false, error: "Add at least one: link URL, image URL, or video URL." });
    }

    const db = await getDb();
    const availableTargets = await loadConnectedTargets({ db, userId });
    if (!availableTargets.length) {
      return res.status(400).json({ ok: false, error: "No connected social accounts found." });
    }

    const prefDoc = await db.collection(PREFERENCES_COLLECTION).findOne({ userId, feature: "post_to_all" });
    const bodySelected = filterSelectedTargets(availableTargets, req?.body?.selectedTargets || []);
    const savedSelected = filterSelectedTargets(availableTargets, prefDoc?.selectedTargets || []);

    const selectedTargets = bodySelected.length
      ? bodySelected
      : savedSelected.length
        ? savedSelected
        : availableTargets;

    if (!selectedTargets.length) {
      return res.status(400).json({ ok: false, error: "No valid destinations selected for post-to-all." });
    }

    const selectedPlatforms = new Set(selectedTargets.map((row) => String(row.platform || "").toLowerCase()));
    if (selectedPlatforms.has("instagram") && !imageUrl && !videoUrl) {
      return res.status(400).json({ ok: false, error: "Instagram selected: provide image URL or video URL." });
    }
    if (selectedPlatforms.has("youtube") && !videoUrl) {
      return res.status(400).json({ ok: false, error: "YouTube selected: provide a video URL." });
    }

    if (savePreference) {
      await savePreferences({ db, userId, selectedTargets });
    }

    const results = [];
    for (const target of selectedTargets) {
      try {
        const content = buildPlatformContent({
          platform: target.platform,
          caption,
          hashtags,
          linkUrl,
          imageUrl,
          videoUrl,
          instagramAltText,
        });

        const payload = {
          ...content,
          metadata: {
            source: "post_to_all",
            caption,
            hashtags,
            linkUrl,
            imageUrl,
            videoUrl,
          },
        };

        if (target.platform === "x") {
          const platformPostId = await publishToXDirectly(userId, target, payload);
          results.push({ platform: target.platform, channelId: target.channelId, status: "posted", platformPostId });
          continue;
        }

        if (target.platform === "linkedin") {
          const platformPostId = await publishToLinkedInDirectly(userId, target, payload);
          results.push({ platform: target.platform, channelId: target.channelId, status: "posted", platformPostId });
          continue;
        }

        if (target.platform === "instagram") {
          const platformPostId = await publishToInstagramDirectly(userId, target, payload);
          results.push({ platform: target.platform, channelId: target.channelId, status: "posted", platformPostId });
          continue;
        }

        if (target.platform === "facebook") {
          const platformPostId = await publishToFacebookDirectly(userId, target, payload);
          results.push({ platform: target.platform, channelId: target.channelId, status: "posted", platformPostId });
          continue;
        }

        // Fallback for other platforms: enqueue immediate scheduled post.
        await createScheduledPostsFromRequest(userId, {
          mode: "immediate",
          targets: [
            {
              platform: target.platform,
              channelId: target.channelId,
              displayName: target.displayName,
              username: target.username,
            },
          ],
          content: {
            ...payload,
            videoAssetId: videoUrl || payload.videoAssetId || "",
            thumbnailAssetId: imageUrl || payload.thumbnailAssetId || "",
            instagram_video_url: payload.instagram_video_url || "",
            facebook_video_url: payload.facebook_video_url || "",
          },
        });
        await runDueScheduledPosts(25);
        results.push({ platform: target.platform, channelId: target.channelId, status: "queued" });
      } catch (err) {
        results.push({
          platform: target.platform,
          channelId: target.channelId,
          status: "failed",
          error: err?.message || "Failed to publish",
        });
      }
    }

    return res.json({
      ok: true,
      results,
      summary: buildSummary(results),
      selectedTargets,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Failed to run post-to-all." });
  }
}
