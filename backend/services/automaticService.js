/**
 * Automatic personalised content service
 *
 * Uses:
 * - Context.general_context from MongoDB
 * - runCommonChat (Gemini text) to derive a single prompt
 * - runCommonImage (Nano Banana Pro) to generate an image from that prompt
 *
 * Prompts are logged to the "Automatic" collection in MongoDB in the background.
 */
import { getDb } from "../db.js";
import { getContext } from "./contextService.js";
import { runCommonChat } from "./commonChat.js";
import { runCommonImage } from "./commonImage.js";

/**
 * Generate one automatic personalised image for a user.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.apiKey - Gemini API key
 * @returns {Promise<{ prompt: string, image: string }>}
 */
export async function generateAutomaticContent({ userId, apiKey }) {
  if (!userId) {
    throw new Error("generateAutomaticContent: userId is required");
  }
  if (!apiKey) {
    throw new Error("generateAutomaticContent: apiKey is required");
  }

  // 1) Load user context from MongoDB
  const context = await getContext(userId);
  const generalContext = context?.general_context?.trim();

  if (!generalContext) {
    throw new Error(
      "No general context found for this user. Please generate context first."
    );
  }

  // 2) Ask Gemini (text) for a single content prompt based on general context
  const metaPrompt = [
    "This is some info about the user:",
    generalContext,
    "",
    "Give me a prompt which will create appropriate content for this user.",
    "Think by first principles.",
    "And only give one prompt.",
  ].join("\n");

  const { text: rawPrompt } = await runCommonChat({
    apiKey,
    prompt: metaPrompt,
  });

  const prompt = (rawPrompt || "").trim();
  if (!prompt) {
    throw new Error("Failed to generate prompt from user context.");
  }

  // 3) Log prompt to MongoDB in the background (non-blocking for the user)
  void (async () => {
    try {
      const db = await getDb();
      const collection = db.collection("Automatic");
      const now = new Date();

      await collection.updateOne(
        { userId },
        {
          $setOnInsert: { userId, createdAt: now },
          $set: { updatedAt: now },
          $push: {
            past_prompts: {
              prompt,
              createdAt: now,
            },
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("Error saving automatic prompt:", err);
    }
  })();

  // 4) Generate image using Nano Banana Pro (Gemini image model) from the prompt
  const { image } = await runCommonImage({
    apiKey,
    prompt,
    // Aspect ratio can be tuned later if needed
  });

  if (!image) {
    throw new Error("Image generation returned no image.");
  }

  return { prompt, image };
}

