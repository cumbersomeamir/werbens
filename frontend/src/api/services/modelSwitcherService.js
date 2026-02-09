/**
 * Model switcher API service - classifies prompts as Text or Image
 */
import { post } from "../client.js";
import { API_ENDPOINTS } from "../endpoints.js";

/**
 * Classify prompt as Text or Image generation
 * @param {string} prompt - User prompt to classify
 * @returns {Promise<"Text" | "Image">}
 */
export async function classifyPrompt(prompt) {
  if (!prompt || !prompt.trim()) {
    return "Text"; // Default to Text if empty
  }

  try {
    const result = await post(API_ENDPOINTS.MODEL_SWITCHER_CLASSIFY, {
      prompt: prompt.trim(),
    });
    return result.type || "Text";
  } catch (error) {
    console.error("Model switcher error:", error);
    // Default to Text on error to not break the flow
    return "Text";
  }
}
