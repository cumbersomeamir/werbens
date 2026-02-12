/**
 * Automatic personalised content service
 *
 * Uses:
 * - automatic-context + automatic-prompts (onboarding + platform context)
 * - runCommonImage (Nano Banana Pro) to generate an image from that prompt
 * - Uploads images to S3 and saves metadata to Automatic collection
 */
import { getDb } from "../db.js";
import { runCommonImage } from "./commonImage.js";
import { generatePrompt } from "../automatic-prompts/generatePrompt.js";
import { uploadImageToS3, getPresignedUrl } from "./s3Service.js";

/**
 * Generate one automatic personalised image for a user.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.platform] - e.g. "x", "instagram". Default: priority from onboarding
 * @param {string} params.apiKey - Gemini API key
 * @returns {Promise<{ prompt: string, image: string, platform: string }>} - image is presigned S3 URL (valid for 1 hour)
 */
export async function generateAutomaticContent({ userId, platform, apiKey }) {
  if (!userId) {
    throw new Error("generateAutomaticContent: userId is required");
  }
  if (!apiKey) {
    throw new Error("generateAutomaticContent: apiKey is required");
  }

  // 1) Check onboarding exists
  const db = await getDb();
  const onboardingDoc = await db.collection("Onboarding").findOne({ userId: userId.trim() });
  if (!onboardingDoc) {
    throw new Error(
      "No onboarding data found for this user. Please complete onboarding first."
    );
  }

  // 2) Generate prompt using automatic-context + automatic-prompts (platform-specific)
  const { prompt, platform: resolvedPlatform } = await generatePrompt({
    userId,
    platform,
    apiKey,
  });

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
    platform: resolvedPlatform || null,
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

  return { prompt, image: presignedUrl, imageKey: s3Key, platform: resolvedPlatform };
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

/**
 * Delete an automatic image by imageKey
 * @param {string} userId
 * @param {string} imageKey - S3 key of the image
 */
export async function deleteAutomaticImage(userId, imageKey) {
  if (!userId) throw new Error("deleteAutomaticImage: userId is required");
  if (!imageKey) throw new Error("deleteAutomaticImage: imageKey is required");

  const db = await getDb();
  const collection = db.collection("Automatic");

  const result = await collection.updateOne(
    { userId: userId.trim() },
    { $pull: { items: { imageKey } } }
  );

  if (result.matchedCount === 0) {
    throw new Error("User document not found");
  }

  return { success: true };
}
