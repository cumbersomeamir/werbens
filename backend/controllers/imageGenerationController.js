/**
 * Image generation controller - handles image generation API requests
 */
import { generateImage } from "../services/imageGenerationService.js";
import { addMessageToSession, uploadSessionImage } from "../services/sessionService.js";
import { randomUUID } from "crypto";

export async function imageGenerationHandler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Image generation requires GEMINI_API_KEY in environment variables.",
    });
  }

  const prompt = req.body.prompt?.trim();
  const referenceImageBase64 = req.body.referenceImageBase64?.trim();
  const referenceImageMime = req.body.referenceImageMime ?? "image/jpeg";
  const aspectRatio = req.body.aspectRatio ?? "1:1";
  const sessionId = req.body.sessionId;
  const userId = req.body.userId || "default-user";

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    // Save user message to session
    if (sessionId) {
      await addMessageToSession({
        sessionId,
        userId,
        type: "user",
        content: prompt,
        contentType: "image",
        prompt,
        aspectRatio,
      });
    }

    const result = await generateImage({
      apiKey,
      prompt,
      referenceImageBase64,
      referenceImageMime,
      aspectRatio,
    });

    // Upload image to S3 and save to session (async, don't wait)
    if (sessionId && result.image) {
      // Extract base64 data from data URL
      const base64Data = result.image.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const messageId = randomUUID();

      // Upload to S3 in background (don't block response)
      uploadSessionImage({
        buffer,
        sessionId,
        messageId,
        contentType: "image/png",
      })
        .then((s3Url) => {
          // Save assistant message with S3 URL
          return addMessageToSession({
            sessionId,
            userId,
            type: "assistant",
            content: s3Url,
            contentType: "image",
            prompt,
            aspectRatio,
            imageUrl: s3Url,
          });
        })
        .catch((err) => {
          console.error("Failed to upload image to S3:", err);
          // Still save with data URL as fallback
          return addMessageToSession({
            sessionId,
            userId,
            type: "assistant",
            content: result.image,
            contentType: "image",
            prompt,
            aspectRatio,
          });
        });
    }

    return res.json(result);
  } catch (err) {
    console.error("[generate-image]", err);
    const msg = err instanceof Error ? err.message : "Image generation failed";
    return res.status(502).json({ error: msg });
  }
}
