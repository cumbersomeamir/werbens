/**
 * URL fetch block - downloads content from URL (e.g. image)
 */
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

  const res = await fetch(url.trim());
  if (!res.ok) {
    throw new Error(`URL fetch failed: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const isImage = contentType.startsWith("image/");

  if (isImage) {
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.split(";")[0].trim() || "image/jpeg";
    const outputKey = block.config?.outputKey || "fetched_image";

    return {
      [outputKey]: base64,
      [`${outputKey}_mime`]: mime,
      [`${outputKey}_url`]: url,
    };
  }

  // Fallback: return as text
  const text = await res.text();
  const outputKey = block.config?.outputKey || "fetched_content";
  return { [outputKey]: text };
}
