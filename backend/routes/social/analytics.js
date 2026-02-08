import { getDb } from "../../db.js";

/**
 * GET /api/social/analytics?userId=...
 * Returns SocialMedia docs for the user (all platforms). No tokens; only data for analytics UI.
 */
export async function getSocialAnalytics(req, res) {
  const userId = (req.query?.userId ?? req.body?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = await getDb();
  const coll = db.collection("SocialMedia");
  const docs = await coll.find({ userId }).toArray();
  const list = docs.map((d) => ({
    userId: d.userId,
    username: d.username,
    platform: d.platform,
    channelId: d.channelId ?? "",
    profile: d.profile || null,
    posts: d.posts || [],
    videos: d.videos || [],
    lastFetchedAt: d.lastFetchedAt,
    updatedAt: d.updatedAt,
  }));
  return res.json({ data: list });
}
