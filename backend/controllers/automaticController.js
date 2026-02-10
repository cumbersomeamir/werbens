/**
 * Automatic controller - handles automatic personalised content API
 */
import { generateAutomaticContent } from "../services/automaticService.js";

/**
 * POST /api/automatic/generate
 *
 * Triggers one full automatic generation cycle:
 * - Reads Context.general_context for the user
 * - Uses Gemini text to derive a single prompt
 * - Logs that prompt to the Automatic collection (background)
 * - Uses Nano Banana Pro to generate an image from that prompt
 */
export async function automaticGenerateHandler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY not configured" });
  }

  const userId = req.body.userId || req.query.userId || "default-user";

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const result = await generateAutomaticContent({ userId, apiKey });
    return res.json({
      success: true,
      prompt: result.prompt,
      image: result.image,
    });
  } catch (err) {
    console.error("Automatic generation error:", err);
    return res.status(500).json({
      error: "Automatic generation failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

