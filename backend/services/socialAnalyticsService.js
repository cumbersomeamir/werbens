/**
 * Social analytics service - handles social analytics data operations
 */
import { getDb } from "../db.js";

export async function getSocialAnalyticsData(userId) {
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
    boards: d.boards || [],
    pins: d.pins || [],
    media: d.media || [],
    insights: d.insights || null,
    lastFetchedAt: d.lastFetchedAt,
    updatedAt: d.updatedAt,
  }));

  return { data: list };
}
