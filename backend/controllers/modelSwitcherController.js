/**
 * Model switcher controller - handles prompt classification requests
 */
import { classifyPrompt } from "../services/modelSwitcherService.js";

export async function classifyPromptHandler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const result = await classifyPrompt({
      apiKey,
      prompt: prompt.trim(),
    });

    return res.json({ type: result });
  } catch (err) {
    console.error("Model switcher error:", err);
    // Default to Text on error to not break the flow
    return res.json({ type: "Text" });
  }
}
