/**
 * URL fetch block - downloads content from URL (e.g. image)
 */
import {
  isInstagramPostUrl,
  resolveInstagramPostImage,
} from "../tools/fetch/instagramPostImage.js";

export async function executeUrlFetchBlock(block, context, options = {}) {
  const urlKey = block.config?.urlKey || "url";
  let url = context[urlKey] || block.config?.url;
  if (!url && options.humanInputs) {
    for (const inpId of block.inputs || []) {
      const v = options.humanInputs[inpId];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) {
        url = v;
        break;
      }
    }
    if (!url) {
      for (const v of Object.values(options.humanInputs)) {
        if (typeof v === "string" && /^https?:\/\//i.test(v)) {
          url = v;
          break;
        }
      }
    }
  }
  if (!url || typeof url !== "string") {
    throw new Error("URL fetch block: no URL in context or config. Ensure the URL input block is filled before this step.");
  }

  const cleanUrl = url.trim();
  const outputKey = block.config?.outputKey || "fetched_image";
  const isInstagramUrl = isInstagramPostUrl(cleanUrl);
  const shouldResolveInstagram =
    block.config?.resolveInstagramPostImage === true || isInstagramUrl;

  if (shouldResolveInstagram && isInstagramUrl) {
    const resolved = await resolveInstagramPostImage(cleanUrl);
    return {
      [outputKey]: resolved.base64,
      [`${outputKey}_mime`]: resolved.mime || "image/jpeg",
      [`${outputKey}_url`]: resolved.imageUrl,
      instagram_post_url: cleanUrl,
    };
  }

  const res = await fetch(cleanUrl);
  if (!res.ok) {
    throw new Error(`URL fetch failed: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const isImage = contentType.startsWith("image/");

  if (isImage) {
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.split(";")[0].trim() || "image/jpeg";

    return {
      [outputKey]: base64,
      [`${outputKey}_mime`]: mime,
      [`${outputKey}_url`]: cleanUrl,
    };
  }

  if (shouldResolveInstagram) {
    const html = await res.text();
    const resolved = await resolveInstagramPostImage(cleanUrl, { html });
    return {
      [outputKey]: resolved.base64,
      [`${outputKey}_mime`]: resolved.mime || "image/jpeg",
      [`${outputKey}_url`]: resolved.imageUrl,
      instagram_post_url: cleanUrl,
    };
  }

  // Fallback: return as text
  const text = await res.text();
  if (block.config?.requireImage) {
    throw new Error("URL fetch block expected an image but received non-image content.");
  }
  const textOutputKey = block.config?.outputKey || "fetched_content";
  return { [textOutputKey]: text };
}
