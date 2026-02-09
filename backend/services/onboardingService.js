/**
 * Onboarding service - handles onboarding data operations
 */
import { getDb } from "../db.js";
import { upsertUser } from "../lib/users.js";

export async function saveOnboardingData({ userId, username, platforms, business, goals }) {
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    throw new Error("At least one platform is required");
  }

  if (userId) {
    await upsertUser({ userId: String(userId).trim(), username: username ? String(username) : null });
  }

  const db = await getDb();
  const collection = db.collection("Onboarding");

  const doc = {
    userId: userId || null,
    username: username || null,
    platforms,
    business: business || null,
    goals: goals || [],
    completedAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);

  return {
    success: true,
    id: result.insertedId,
  };
}
