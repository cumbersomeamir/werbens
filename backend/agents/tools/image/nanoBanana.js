/**
 * Nano Banana model tool wrapper.
 * Centralized here so app agents can call one stable interface.
 */
import { runCommonImage } from "../../../services/commonImage.js";

export async function runNanoBananaModel({
  apiKey,
  prompt,
  referenceImageBase64,
  referenceImageMime = "image/jpeg",
  contentImageBase64,
  contentImageMime = "image/jpeg",
  aspectRatio,
}) {
  return runCommonImage({
    apiKey,
    prompt,
    referenceImageBase64,
    referenceImageMime,
    contentImageBase64,
    contentImageMime,
    aspectRatio,
  });
}
