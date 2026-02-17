/**
 * Context service - handles context data operations
 */
import { getDb } from "../db.js";
import { collateAndSummarizeContext } from "../context/data-collator/data-collator-gemini.js";

/**
 * Get user context from MongoDB
 * @param {string} userId
 * @returns {Promise<Object|null>} Context object or null
 */
export async function getContext(userId) {
  try {
    const db = await getDb();
    const collection = db.collection("Context");

    const context = await collection.findOne({ userId });

    return context;
  } catch (err) {
    console.error("Error getting context:", err.message);
    return null;
  }
}

/**
 * Update user context by collating and summarizing all data
 * @param {string} userId
 * @returns {Promise<Object>} Updated context object
 */
export async function updateContext(userId) {
  try {
    // Step 1: Collate and summarize using Gemini
    const structuredContext = await collateAndSummarizeContext(userId);

    // Step 2: Save to MongoDB
    const db = await getDb();
    const collection = db.collection("Context");

    const contextDoc = {
      userId,
      ...structuredContext,
      updatedAt: new Date(),
    };

    // Upsert (update if exists, insert if not)
    await collection.updateOne(
      { userId },
      { $set: contextDoc },
      { upsert: true }
    );

    return contextDoc;
  } catch (err) {
    console.error("Error updating context:", err.message);
    throw err;
  }
}

/**
 * Update a single platform's context (user-edited)
 * @param {string} userId
 * @param {string} platform - "x", "instagram", "youtube", "linkedin", "pinterest", "facebook"
 * @param {string} value - new context text
 * @returns {Promise<Object>} Updated context doc
 */
export async function updateContextPlatform(userId, platform, value) {
  const key = `${platform}_context`;
  const db = await getDb();
  const collection = db.collection("Context");

  await collection.updateOne(
    { userId: userId.trim() },
    {
      $set: {
        [key]: value,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  const doc = await collection.findOne({ userId: userId.trim() });
  return doc;
}
