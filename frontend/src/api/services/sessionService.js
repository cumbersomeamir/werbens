/**
 * Session API service
 */
import { post, get } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Get or create session
 * @param {string} sessionId
 * @param {string} [userId]
 * @returns {Promise<{sessionId: string}>}
 */
export async function getOrCreateSession(sessionId, userId) {
  return post(API_ENDPOINTS.SESSIONS_GET_OR_CREATE, {
    sessionId,
    userId,
  });
}

/**
 * Clear session (for "New Chat")
 * @param {string} sessionId
 * @param {string} [userId]
 * @returns {Promise<{success: boolean}>}
 */
export async function clearSession(sessionId, userId) {
  return post(API_ENDPOINTS.SESSIONS_CLEAR, {
    sessionId,
    userId,
  });
}

/**
 * Get session messages
 * @param {string} sessionId
 * @param {string} [userId]
 * @returns {Promise<{messages: Array}>}
 */
export async function getSessionMessages(sessionId, userId) {
  const url = API_ENDPOINTS.SESSIONS_MESSAGES(sessionId);
  return get(userId ? `${url}?userId=${encodeURIComponent(userId)}` : url);
}
