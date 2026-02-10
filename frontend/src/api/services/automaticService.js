/**
 * Automatic personalised content API service
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Trigger one automatic personalised content generation.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<{ success: boolean, prompt: string, image: string }>}
 */
export async function generateAutomatic({ userId }) {
  return post(API_ENDPOINTS.AUTOMATIC_GENERATE, { userId });
}

