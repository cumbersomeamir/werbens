/**
 * Social analytics service - handles social analytics data operations
 */
import { getDb } from "../db.js";

/** Build set of valid (platform, channelId) pairs from connected SocialAccounts */
function getValidAccountKeys(accounts) {
  const keys = new Set();
  for (const acc of accounts || []) {
    const platform = (acc.platform || "").toLowerCase();
    const channels = acc.channels || [];
    if (platform === "youtube" && Array.isArray(channels)) {
      for (const ch of channels) {
        const cid = ch?.channelId ?? ch?.id;
        if (cid) keys.add(`youtube:${String(cid)}`);
      }
    } else if (platform === "facebook" && Array.isArray(channels)) {
      for (const ch of channels) {
        const p = (ch.platform || ch.type || "").toLowerCase();
        if (p === "facebook") {
          const cid = ch.pageId ?? ch.channelId ?? ch.id;
          if (cid) keys.add(`facebook:${String(cid)}`);
        }
        if (p === "instagram") {
          const cid = ch.channelId ?? ch.igId ?? ch.id;
          if (cid) keys.add(`instagram:${String(cid)}`);
        }
      }
    } else {
      const cid = acc.platformUserId ?? acc.channelId ?? "";
      if (platform) keys.add(`${platform}:${String(cid)}`);
    }
  }
  return keys;
}

export async function getSocialAnalyticsData(userId) {
  const db = await getDb();
  const trimmedUserId = String(userId || "").trim();
  const accountsColl = db.collection("SocialAccounts");
  const socialColl = db.collection("SocialMedia");

  const accounts = await accountsColl.find({ userId: trimmedUserId }).toArray();
  const validKeys = getValidAccountKeys(accounts);

  const docs = await socialColl
    .find({ userId: trimmedUserId })
    .sort({ platform: 1, username: 1, channelId: 1, updatedAt: -1 })
    .toArray();

  const filtered =
    validKeys.size > 0
      ? docs.filter((d) => {
          const platform = (d.platform || "").toLowerCase();
          const channelId = String(d.channelId ?? d.profile?.id ?? "").trim();
          const key = `${platform}:${channelId}`;
          if (validKeys.has(key)) return true;
          if (platform === "x" && !channelId) {
            const xAcc = accounts.find((a) => (a.platform || "").toLowerCase() === "x");
            return xAcc && validKeys.has(`x:${String(xAcc.platformUserId ?? "")}`);
          }
          return false;
        })
      : [];

  const seen = new Set();
  const deduped = filtered.filter((d) => {
    const k = `${d.platform}:${String(d.channelId ?? d.profile?.id ?? "")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const list = deduped.map((d) => ({
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
