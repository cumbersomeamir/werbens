/**
 * Model switcher service - determines if prompt is for text or image generation
 * Uses Gemini API independently (no memory)
 */
import { GoogleGenAI } from "@google/genai";
import { CHAT_CONSTANTS } from "../constants/chat.js";

const CLASSIFICATION_PROMPT = `You are a prompt classifier. Analyze the user's prompt and determine if it is requesting:
1. TEXT generation (chat, content creation, writing, editing, questions, explanations, summaries, etc.)
2. IMAGE generation (visual content, pictures, graphics, illustrations, photos, designs, etc.)

Respond with ONLY one word: either "Text" or "Image". Do not include any explanation or additional text.`;

/**
 * Classify prompt as Text or Image generation
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.prompt - User prompt to classify
 * @returns {Promise<"Text" | "Image">}
 */
export async function classifyPrompt({ apiKey, prompt }) {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: CHAT_CONSTANTS.MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: CLASSIFICATION_PROMPT },
          { text: `\n\nUser prompt: ${prompt}` },
        ],
      },
    ],
    config: {
      temperature: 0.1, // Low temperature for consistent classification
      maxOutputTokens: 10, // Only need one word
    },
  });

  // Extract text from response
  const text =
    typeof response?.text === "string"
      ? response.text
      : response?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() || "";

  // Normalize response - check for "Text" or "Image"
  const normalized = text.trim().toLowerCase();
  
  // Check if response contains "image" (more flexible)
  if (normalized.includes("image")) {
    return "Image";
  }
  
  // Check if response contains "text"
  if (normalized.includes("text")) {
    return "Text";
  }

  // Default to Text if unclear (safer default - most prompts are text)
  return "Text";
}
