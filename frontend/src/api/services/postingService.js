/**
 * Social posting API service
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Create a social media post
 * @param {string} userId
 * @param {Object} payload - Post payload
 * @returns {Promise<Object>}
 */
export async function createPost(userId, payload) {
  if (!userId) throw new Error("userId is required");
  return post(API_ENDPOINTS.SOCIAL_POST, {
    userId,
    ...payload,
  });
}
