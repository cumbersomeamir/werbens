/**
 * Social analytics service - handles social analytics data operations
 */
import { getDb } from "../db.js";

export async function getSocialAnalyticsData(userId) {
  const db = await getDb();
  const coll = db.collection("SocialMedia");
  const docs = await coll
    .find({ userId })
    // Ensure analytics items are grouped by platform (and stable within platform)
    .sort({ platform: 1, username: 1, channelId: 1, updatedAt: -1 })
    .toArray();
  
  const list = docs.map((d) => ({
    userId: d.userId,
    username: d.username,
    platform: d.platform,
    channelId: d.channelId ?? "",
    profile: d.profile || null,
    posts: d.posts || [],
    videos: d.videos || [],
    boards: d.boards || [],
    pins: d.pins || [],
    media: d.media || [],
    insights: d.insights || null,
    lastFetchedAt: d.lastFetchedAt,
    updatedAt: d.updatedAt,
  }));

  return { data: list };
}
