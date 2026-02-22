/**
 * Helpers to resolve an Instagram post URL into the underlying image URL/base64.
 */

const INSTAGRAM_POST_PATH_RE = /^\/(p|reel|tv)\//i;
const INSTAGRAM_HOST_RE = /(^|\.)instagram\.com$/i;
const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const INSTAGRAM_OEMBED_ENDPOINT = "https://www.instagram.com/api/v1/oembed/?url=";

function decodeCandidate(raw) {
  return String(raw || "")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .trim();
}

function firstMatch(text, regexes) {
  for (const re of regexes) {
    const m = text.match(re);
    if (m?.[1]) return decodeCandidate(m[1]);
  }
  return null;
}

export function isInstagramPostUrl(url) {
  try {
    const parsed = new URL(url);
    return INSTAGRAM_HOST_RE.test(parsed.hostname) && INSTAGRAM_POST_PATH_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function extractInstagramImageUrlFromHtml(html) {
  if (!html || typeof html !== "string") return null;
  return firstMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /"display_url":"([^"]+)"/i,
    /"thumbnail_src":"([^"]+)"/i,
  ]);
}

async function fetchInstagramPageHtml(postUrl) {
  const res = await fetch(postUrl, {
    headers: {
      "user-agent": DEFAULT_UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`Instagram page fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchInstagramOembed(postUrl) {
  const endpoint = `${INSTAGRAM_OEMBED_ENDPOINT}${encodeURIComponent(postUrl)}`;
  const res = await fetch(endpoint, {
    headers: {
      "user-agent": DEFAULT_UA,
      accept: "application/json",
    },
  });

  if (!res.ok) {
    return null;
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    return null;
  }

  const thumbnailUrl =
    typeof json?.thumbnail_url === "string" && json.thumbnail_url.trim()
      ? decodeCandidate(json.thumbnail_url)
      : null;

  if (!thumbnailUrl) {
    return null;
  }

  return {
    imageUrl: thumbnailUrl,
    mediaId: json?.media_id || null,
    authorName: json?.author_name || null,
  };
}

export async function fetchImageAsBase64(url, { referer } = {}) {
  const res = await fetch(url, {
    headers: {
      "user-agent": DEFAULT_UA,
      ...(referer ? { referer } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status} ${res.statusText}`);
  }
  const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    throw new Error("Resolved Instagram media URL is not an image");
  }
  const buffer = await res.arrayBuffer();
  return {
    base64: Buffer.from(buffer).toString("base64"),
    mime: contentType,
  };
}

export async function resolveInstagramPostImage(postUrl, { html } = {}) {
  if (!isInstagramPostUrl(postUrl)) {
    throw new Error("Not a valid Instagram post URL");
  }

  const oembed = await fetchInstagramOembed(postUrl);
  let imageUrl = oembed?.imageUrl || null;

  if (!imageUrl) {
    const pageHtml = typeof html === "string" ? html : await fetchInstagramPageHtml(postUrl);
    imageUrl = extractInstagramImageUrlFromHtml(pageHtml);
  }

  if (!imageUrl) {
    throw new Error("Could not resolve image from Instagram post. Please verify the post URL.");
  }

  const image = await fetchImageAsBase64(imageUrl, { referer: postUrl });
  return {
    imageUrl,
    base64: image.base64,
    mime: image.mime,
  };
}
