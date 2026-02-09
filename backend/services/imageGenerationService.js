/**
 * Image generation service - handles Gemini image generation
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { IMAGE_GENERATION_CONSTANTS } from "../constants/imageGeneration.js";

/**
 * Generate image using Gemini 3 Pro Image (Nano Banana Pro)
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.prompt - Image generation prompt
 * @param {string} [params.referenceImageBase64] - Optional reference image in base64
 * @param {string} [params.referenceImageMime] - MIME type of reference image (default: "image/jpeg")
 * @param {string} [params.aspectRatio] - Aspect ratio (e.g., "1:1", "16:9", "9:16") (default: "1:1")
 * @returns {Promise<{image: string}>} - Returns data URL of generated image
 */
export async function generateImage({ apiKey, prompt, referenceImageBase64, referenceImageMime = "image/jpeg", aspectRatio = "1:1" }) {
  const client = new GoogleGenAI({ apiKey });

  const aspectRatioPrompt = aspectRatio ? `Generate the image with aspect ratio ${aspectRatio}. ` : "";
  const parts = [{ text: `${IMAGE_GENERATION_CONSTANTS.PROMPT}\n\n${aspectRatioPrompt}User request: ${prompt}` }];
  if (referenceImageBase64) {
    parts.unshift({ inlineData: { mimeType: referenceImageMime, data: referenceImageBase64 } });
  }

  const response = await client.models.generateContent({
    model: IMAGE_GENERATION_CONSTANTS.MODEL,
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature: IMAGE_GENERATION_CONSTANTS.TEMPERATURE,
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  const imageParts = responseParts.filter((p) => p.inlineData?.data);
  if (imageParts.length > 0) {
    const last = imageParts[imageParts.length - 1];
    const mime = last.inlineData?.mimeType ?? "image/png";
    const dataUrl = `data:${mime};base64,${last.inlineData.data}`;
    return { image: dataUrl };
  }

  const textPart = responseParts.find((p) => p.text);
  if (textPart?.text) {
    throw new Error("Model returned text only. Try a more detailed prompt or different image reference.");
  }
  throw new Error("No image in response");
}
