/**
 * Automatic personalised content API service
 */
import { post, get } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Trigger one automatic personalised content generation.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.platform] - e.g. "x", "instagram". Default: priority from onboarding
 * @returns {Promise<{ success: boolean, prompt: string, image: string, platform?: string }>}
 */
export async function generateAutomatic({ userId, platform }) {
  return post(API_ENDPOINTS.AUTOMATIC_GENERATE, { userId, platform });
}

/**
 * Get all automatic images for a user.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<{ success: boolean, items: Array }>}
 */
export async function getAutomaticImages({ userId }) {
  return get(`${API_ENDPOINTS.AUTOMATIC_IMAGES}?userId=${encodeURIComponent(userId)}`);
}

/**
 * Get a fresh download URL for an automatic image.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.imageKey
 * @returns {Promise<{ success: boolean, downloadUrl: string }>}
 */
export async function getAutomaticImageDownloadUrl({ userId, imageKey }) {
  return get(`${API_ENDPOINTS.AUTOMATIC_DOWNLOAD}?userId=${encodeURIComponent(userId)}&imageKey=${encodeURIComponent(imageKey)}`);
}

/**
 * Delete an automatic image by imageKey.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.imageKey
 */
export async function deleteAutomaticImage({ userId, imageKey }) {
  return post(API_ENDPOINTS.AUTOMATIC_DELETE_IMAGE, { userId, imageKey });
}

