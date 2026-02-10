/**
 * Common Gemini service - single independent call with no memory
 *
 * This utility is intended to be reused anywhere in the codebase
 * that needs a simple "prompt in, text out" Gemini request.
 */
import { GoogleGenAI } from "@google/genai";
import { CHAT_CONSTANTS } from "../constants/chat.js";

/**
 * Run a single Gemini text generation call with no memory.
 *
 * - No conversation history is loaded or saved.
 * - No extra instructions or wrapper text is added around the prompt.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.prompt - Raw user prompt to send as-is
 * @param {string} [params.model] - Optional model override (defaults to CHAT_CONSTANTS.MODEL)
 * @param {number} [params.temperature] - Optional temperature override (defaults to CHAT_CONSTANTS.TEMPERATURE)
 * @param {number} [params.maxOutputTokens] - Optional max tokens override (defaults to CHAT_CONSTANTS.MAX_OUTPUT_TOKENS)
 * @returns {Promise<{ text: string, usage?: object }>}
 */
export async function runCommonChat({
  apiKey,
  prompt,
  model = CHAT_CONSTANTS.MODEL,
  temperature = CHAT_CONSTANTS.TEMPERATURE,
  maxOutputTokens = CHAT_CONSTANTS.MAX_OUTPUT_TOKENS,
}) {
  if (!apiKey) {
    throw new Error("runCommonChat: apiKey is required");
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("runCommonChat: prompt must be a non-empty string");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      temperature,
      maxOutputTokens,
    },
  });

  // Extract plain text from the response
  const text =
    typeof response?.text === "string"
      ? response.text
      : response?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() || "";

  const usage = response?.usageMetadata;

  return {
    text,
    usage,
  };
}

