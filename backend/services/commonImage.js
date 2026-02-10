/**
 * Common image generation service - single independent call using Nano Banana Pro
 *
 * Reusable anywhere in the codebase that needs "prompt in, image out"
 * with no memory and no extra system prompt.
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { IMAGE_GENERATION_CONSTANTS } from "../constants/imageGeneration.js";

/**
 * Generate an image using Nano Banana Pro (Gemini 3 Pro Image).
 *
 * - No conversation history or memory.
 * - Prompt is sent as-is (optional aspect ratio instruction only when provided).
 *
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.prompt - Image generation prompt (sent as-is)
 * @param {string} [params.referenceImageBase64] - Optional reference image in base64
 * @param {string} [params.referenceImageMime] - MIME type of reference image (default: "image/jpeg")
 * @param {string} [params.aspectRatio] - Optional aspect ratio (e.g. "1:1", "16:9", "9:16")
 * @param {string} [params.model] - Optional model override (defaults to Nano Banana Pro)
 * @param {number} [params.temperature] - Optional temperature override
 * @returns {Promise<{ image: string, usage?: object }>} - data URL of generated image
 */
export async function runCommonImage({
  apiKey,
  prompt,
  referenceImageBase64,
  referenceImageMime = "image/jpeg",
  aspectRatio,
  model = IMAGE_GENERATION_CONSTANTS.MODEL,
  temperature = IMAGE_GENERATION_CONSTANTS.TEMPERATURE,
}) {
  if (!apiKey) {
    throw new Error("runCommonImage: apiKey is required");
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("runCommonImage: prompt must be a non-empty string");
  }

  const client = new GoogleGenAI({ apiKey });

  const aspectRatioPrompt = aspectRatio
    ? `Generate the image with aspect ratio ${aspectRatio}. `
    : "";

  // Reuse the shared image-generation instructions so the model reliably returns an image
  const parts = [
    {
      text: `${IMAGE_GENERATION_CONSTANTS.PROMPT}\n\n${aspectRatioPrompt}User request: ${prompt}`,
    },
  ];
  if (referenceImageBase64) {
    parts.unshift({
      inlineData: { mimeType: referenceImageMime, data: referenceImageBase64 },
    });
  }

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature,
    },
  });

  const responseParts = response?.candidates?.[0]?.content?.parts ?? [];
  const imageParts = responseParts.filter((p) => p.inlineData?.data);
  if (imageParts.length > 0) {
    const last = imageParts[imageParts.length - 1];
    const mime = last.inlineData?.mimeType ?? "image/png";
    const dataUrl = `data:${mime};base64,${last.inlineData.data}`;
    return {
      image: dataUrl,
      usage: response?.usageMetadata,
    };
  }

  const textPart = responseParts.find((p) => p.text);
  if (textPart?.text) {
    console.error("runCommonImage: model returned text only:", textPart.text);
    throw new Error("Image generation failed. Please try again.");
  }
  throw new Error("No image in response");
}
