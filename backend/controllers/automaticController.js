/**
 * Automatic controller - handles automatic personalised content API
 */
import { generateAutomaticContent, getAutomaticImages, getAutomaticImageDownloadUrl } from "../services/automaticService.js";

/**
 * POST /api/automatic/generate
 *
 * Triggers one full automatic generation cycle:
 * - Reads Onboarding.general_onboarding_context for the user
 * - Uses Gemini text to derive a single prompt
 * - Uses Nano Banana Pro to generate an image from that prompt
 * - Uploads image to S3 and saves metadata to Automatic collection
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

/**
 * GET /api/automatic/images
 *
 * Returns all automatic images for a user
 */
export async function automaticGetImagesHandler(req, res) {
  const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const items = await getAutomaticImages(userId);
    return res.json({
      success: true,
      items,
    });
  } catch (err) {
    console.error("Error fetching automatic images:", err);
    return res.status(500).json({
      error: "Failed to fetch automatic images",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * GET /api/automatic/download
 *
 * Returns a fresh presigned URL for downloading an image
 */
export async function automaticDownloadHandler(req, res) {
  const userId = req.query.userId || req.body.userId;
  const imageKey = req.query.imageKey || req.body.imageKey;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  if (!imageKey) {
    return res.status(400).json({ error: "imageKey required" });
  }

  try {
    const downloadUrl = await getAutomaticImageDownloadUrl(userId, imageKey);
    return res.json({
      success: true,
      downloadUrl,
    });
  } catch (err) {
    console.error("Error generating download URL:", err);
    return res.status(500).json({
      error: "Failed to generate download URL",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

