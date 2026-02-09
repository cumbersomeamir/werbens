/**
 * Chat API service
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

const CHAT_SESSION_KEY = "werbens_chat_session_id";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = window.localStorage.getItem(CHAT_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CHAT_SESSION_KEY, id);
  }
  return id;
}

/**
 * Generate chat response
 * @param {Object} params
 * @param {string} params.message - User message
 * @param {string} [params.system] - System prompt
 * @param {string} [params.sessionId] - Optional session ID (auto-generated if not provided)
 * @param {string} [params.userId] - Optional user ID
 * @returns {Promise<{message: string, text: string, usage?: object}>}
 */
export async function generateChatResponse({ message, system, sessionId, userId }) {
  const session = sessionId || getOrCreateSessionId();
  const defaultSystem = "You are a helpful content creation assistant. Generate high-quality, engaging content based on user requests.";

  return post(API_ENDPOINTS.CHAT, {
    sessionId: session,
    message,
    system: system || defaultSystem,
    userId,
  });
}

export { getOrCreateSessionId };
