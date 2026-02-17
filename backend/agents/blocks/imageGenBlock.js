/**
 * Image generation block executor - uses runCommonImage (Nano Banana Pro)
 */
import { runCommonImage } from "../../services/commonImage.js";

/**
 * Resolve template with context variables
 */
function resolveTemplate(template, context) {
  if (!template || typeof template !== "string") return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = context[key];
    return val != null ? String(val) : "";
  });
}

/**
 * Execute image generation block
 * Uses: reference_image (style), fetched_image (content from URL), and prompt with comments.
 * @param {Object} block - Flow block
 * @param {Object} context - Flow execution context
 * @param {Object} options - { apiKey, userId }
 * @returns {Promise<{ image: string, imageBase64?: string }>}
 */
export async function executeImageGenBlock(block, context, options = {}) {
  const { apiKey } = options;
  if (!apiKey) throw new Error("Image gen block requires apiKey");

  const prompt = resolveTemplate(block.config?.prompt || "", context);
  if (!prompt.trim()) throw new Error("Image gen block: empty prompt");

  let referenceImageBase64 = null;
  let referenceImageMime = "image/jpeg";
  let contentImageBase64 = null;
  let contentImageMime = "image/jpeg";

  if (block.config?.referenceFromBlock) {
    const refKey = `ref_image_${block.config.referenceFromBlock}`;
    referenceImageBase64 = context[refKey];
    referenceImageMime = context[`${refKey}_mime`] || "image/jpeg";
  } else if (context.reference_image) {
    referenceImageBase64 = context.reference_image;
    referenceImageMime = context.reference_image_mime || "image/jpeg";
  }

  const fetched = context.fetched_image || context.fetchedImage;
  if (fetched) {
    contentImageBase64 = fetched;
    contentImageMime = context.fetched_image_mime || context.fetchedImage_mime || "image/jpeg";
  }

  const result = await runCommonImage({
    apiKey,
    prompt,
    referenceImageBase64: referenceImageBase64 || undefined,
    referenceImageMime,
    contentImageBase64: contentImageBase64 || undefined,
    contentImageMime,
    aspectRatio: block.config?.aspectRatio,
  });

  return {
    image: result.image,
    imageBase64: result.image?.startsWith("data:") ? result.image.split(",")[1] : result.image,
  };
}
