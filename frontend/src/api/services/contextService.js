/**
 * Context API service
 */
import { get, post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Get user context
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getContext(userId) {
  if (!userId) return null;
  return get(`${API_ENDPOINTS.CONTEXT}?userId=${encodeURIComponent(userId)}`);
}

/**
 * Update user context (collate and summarize)
 * @param {string} userId
 * @returns {Promise<{success: boolean, context: Object}>}
 */
export async function updateContext(userId) {
  if (!userId) throw new Error("userId required");
  return post(API_ENDPOINTS.CONTEXT_UPDATE, { userId });
}
