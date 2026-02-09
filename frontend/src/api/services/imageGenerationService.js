/**
 * Image generation API service
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Generate image
 * @param {Object} params
 * @param {string} params.prompt - Image generation prompt
 * @param {string} [params.referenceImageBase64] - Optional reference image in base64
 * @param {string} [params.referenceImageMime] - MIME type of reference image
 * @param {string} [params.aspectRatio] - Aspect ratio (default: "1:1")
 * @param {string} [params.sessionId] - Optional session ID
 * @param {string} [params.userId] - Optional user ID
 * @returns {Promise<{image: string}>}
 */
export async function generateImage({ prompt, referenceImageBase64, referenceImageMime = "image/jpeg", aspectRatio = "1:1", sessionId, userId }) {
  return post(API_ENDPOINTS.GENERATE_IMAGE, {
    prompt,
    referenceImageBase64,
    referenceImageMime,
    aspectRatio,
    sessionId,
    userId,
  });
}

/**
 * Convert File to base64
 * @param {File} file
 * @returns {Promise<{base64: string, mime: string}>}
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      resolve({
        base64,
        mime: file.type || "image/jpeg",
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
