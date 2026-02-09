/**
 * Chat controller - handles chat API requests
 */
import { generateChatResponse } from "../services/chatService.js";
import { addMessageToSession } from "../services/sessionService.js";

export async function chatHandler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const { sessionId, message, system, userId } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message required" });
  }

  const user = userId || "default-user";

  try {
    // Save user message to session
    await addMessageToSession({
      sessionId,
      userId: user,
      type: "user",
      content: message,
      contentType: "text",
    });

    const result = await generateChatResponse({
      apiKey,
      sessionId,
      message,
      system,
    });

    // Save assistant response to session
    await addMessageToSession({
      sessionId,
      userId: user,
      type: "assistant",
      content: result.message || result.text || "",
      contentType: "text",
    });

    return res.json(result);
  } catch (err) {
    console.error("Gemini chat error:", err);
    return res.status(500).json({
      error: "Chat failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
