/**
 * Session controller - handles session management API requests
 */
import {
  getOrCreateSession,
  clearSession,
  getSessionMessages,
} from "../services/sessionService.js";
import { clearMemory } from "../services/memory.js";

/**
 * Get or create session for user
 * POST /api/sessions/get-or-create
 */
export async function getOrCreateSessionHandler(req, res) {
  const { sessionId, userId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  // For now, use a default userId if not provided (can be updated later with auth)
  const user = userId || "default-user";

  try {
    const session = await getOrCreateSession(user, sessionId);
    return res.json({ sessionId: session.sessionId });
  } catch (err) {
    console.error("Session get-or-create error:", err);
    return res.status(500).json({
      error: "Failed to get or create session",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Clear session (for "New Chat")
 * POST /api/sessions/clear
 */
export async function clearSessionHandler(req, res) {
  const { sessionId, userId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  const user = userId || "default-user";

  try {
    // Clear session messages
    await clearSession(sessionId, user);
    // Clear chat memory (Redis/in-memory)
    await clearMemory(sessionId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Session clear error:", err);
    return res.status(500).json({
      error: "Failed to clear session",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Get session messages
 * GET /api/sessions/:sessionId/messages
 */
export async function getSessionMessagesHandler(req, res) {
  const { sessionId } = req.params;
  const userId = req.query.userId || "default-user";

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  try {
    const messages = await getSessionMessages(sessionId, userId);
    return res.json({ messages });
  } catch (err) {
    console.error("Get session messages error:", err);
    return res.status(500).json({
      error: "Failed to get session messages",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
