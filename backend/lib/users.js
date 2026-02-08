import { getDb } from "../db.js";

/**
 * Upsert a user so all collections can link via userId (unique) and username.
 * Call from onboarding and social connect flows.
 */
export async function upsertUser({ userId, username }) {
  if (!userId || typeof userId !== "string") return;
  const db = await getDb();
  const coll = db.collection("Users");
  const now = new Date();
  await coll.updateOne(
    { userId: userId.trim() },
    {
      $set: { username: username || null, updatedAt: now },
      $setOnInsert: { userId: userId.trim(), createdAt: now },
    },
    { upsert: true }
  );
}
