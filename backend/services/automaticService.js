/**
 * Automatic personalised content service
 *
 * Uses:
 * - Onboarding.general_onboarding_context from MongoDB (onboarding questions + user choices)
 * - runCommonChat (Gemini text) to derive a single prompt
 * - runCommonImage (Nano Banana Pro) to generate an image from that prompt
 * - Uploads images to S3 and saves metadata to Automatic collection
 */
import { getDb } from "../db.js";
import { runCommonChat } from "./commonChat.js";
import { runCommonImage } from "./commonImage.js";
import { collateAndSaveOnboardingContext } from "../onboarding-context/onboarding-data-collator.js";
import { uploadImageToS3, getPresignedUrl } from "./s3Service.js";

/**
 * Generate one automatic personalised image for a user.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.apiKey - Gemini API key
 * @returns {Promise<{ prompt: string, image: string }>} - image is presigned S3 URL (valid for 1 hour)
 */
export async function generateAutomaticContent({ userId, apiKey }) {
  if (!userId) {
    throw new Error("generateAutomaticContent: userId is required");
  }
  if (!apiKey) {
    throw new Error("generateAutomaticContent: apiKey is required");
  }

  // 1) Load onboarding context from MongoDB (Onboarding collection)
  const db = await getDb();
  const onboardingColl = db.collection("Onboarding");
  const onboardingDoc = await onboardingColl.findOne({ userId: userId.trim() });

  if (!onboardingDoc) {
    throw new Error(
      "No onboarding data found for this user. Please complete onboarding first."
    );
  }

  // Check if general_onboarding_context exists, if not generate it on-the-fly
  let generalOnboardingContext = onboardingDoc?.general_onboarding_context?.trim();
  
  if (!generalOnboardingContext) {
    // Generate it now if onboarding data exists but context hasn't been collated yet
    try {
      generalOnboardingContext = await collateAndSaveOnboardingContext(userId);
    } catch (err) {
      console.error("Error generating onboarding context:", err.message);
      throw new Error(
        "Failed to generate onboarding context. Please try again or complete onboarding."
      );
    }
  }

  // 2) Ask Gemini (text) for a single content prompt based on onboarding context
  const metaPrompt = [
    "This is some info about the user from onboarding:",
    generalOnboardingContext,
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

  // 3) Generate image using Nano Banana Pro (Gemini image model) from the prompt
  const { image: imageDataUrl } = await runCommonImage({
    apiKey,
    prompt,
    // Aspect ratio can be tuned later if needed
  });

  if (!imageDataUrl) {
    throw new Error("Image generation returned no image.");
  }

  // 4) Convert data URL to buffer and upload to S3
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  
  // Determine content type from data URL
  const contentTypeMatch = imageDataUrl.match(/^data:image\/(\w+);base64,/);
  const contentType = contentTypeMatch ? `image/${contentTypeMatch[1]}` : "image/png";
  
  // Generate S3 key
  const timestamp = Date.now();
  const s3Key = `automatic/${userId}/${timestamp}.png`;
  
  // Upload to S3 (no ACL needed, bucket is private)
  await uploadImageToS3({
    buffer: imageBuffer,
    key: s3Key,
    contentType,
  });

  // 5) Generate presigned URL (valid for 1 hour)
  const presignedUrl = await getPresignedUrl(s3Key, 3600);

  // 6) Save to MongoDB (Automatic collection) - store only S3 key, not URL
  const db2 = await getDb();
  const collection = db2.collection("Automatic");
  const now = new Date();

  const item = {
    prompt,
    imageKey: s3Key, // Store only the S3 key, not the URL
    createdAt: now,
  };

  await collection.updateOne(
    { userId },
    {
      $setOnInsert: { userId, createdAt: now },
      $set: { updatedAt: now },
      $push: {
        items: item,
      },
    },
    { upsert: true }
  );

  return { prompt, image: presignedUrl };
}

/**
 * Get all automatic images for a user
 * @param {string} userId
 * @returns {Promise<Array>} Array of items with prompt, imageUrl (presigned), imageKey, createdAt
 */
export async function getAutomaticImages(userId) {
  if (!userId) {
    throw new Error("getAutomaticImages: userId is required");
  }

  const db = await getDb();
  const collection = db.collection("Automatic");
  const doc = await collection.findOne({ userId: userId.trim() });

  if (!doc || !doc.items || doc.items.length === 0) {
    return [];
  }

  // Generate presigned URLs for all items (valid for 1 hour)
  const itemsWithUrls = await Promise.all(
    doc.items.map(async (item) => {
      if (!item.imageKey) {
        // Legacy support: if imageUrl exists but no imageKey, return as-is
        return {
          ...item,
          imageUrl: item.imageUrl || null,
        };
      }
      
      const presignedUrl = await getPresignedUrl(item.imageKey, 3600);
      return {
        ...item,
        imageUrl: presignedUrl,
      };
    })
  );

  // Return items sorted by createdAt (newest first)
  return itemsWithUrls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a fresh presigned URL for downloading an image
 * @param {string} userId
 * @param {string} imageKey - S3 key of the image
 * @returns {Promise<string>} Fresh presigned URL (valid for 1 hour)
 */
export async function getAutomaticImageDownloadUrl(userId, imageKey) {
  if (!userId) {
    throw new Error("getAutomaticImageDownloadUrl: userId is required");
  }
  if (!imageKey) {
    throw new Error("getAutomaticImageDownloadUrl: imageKey is required");
  }

  // Verify the image belongs to this user
  const db = await getDb();
  const collection = db.collection("Automatic");
  const doc = await collection.findOne({ userId: userId.trim() });

  if (!doc || !doc.items || !doc.items.some((item) => item.imageKey === imageKey)) {
    throw new Error("Image not found or access denied");
  }

  // Generate fresh presigned URL with Content-Disposition header to force download (valid for 1 hour)
  const presignedUrl = await getPresignedUrl(imageKey, 3600, true);
  return presignedUrl;
}
