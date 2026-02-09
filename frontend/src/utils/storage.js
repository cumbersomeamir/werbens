/**
 * Storage utilities
 */

const CHAT_SESSION_KEY = "werbens_chat_session_id";

export function getOrCreateSessionId() {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id = window.localStorage.getItem(CHAT_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CHAT_SESSION_KEY, id);
  }
  return id;
}

export function getSessionId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAT_SESSION_KEY);
}

export function clearSessionId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAT_SESSION_KEY);
}
