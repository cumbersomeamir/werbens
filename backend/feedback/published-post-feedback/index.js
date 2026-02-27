import { safeNumber } from "../lib/utils.js";

export function buildPublishedPostFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];
  const top = rows
    .slice()
    .sort((a, b) => safeNumber(b?.metrics?.engagementRate) - safeNumber(a?.metrics?.engagementRate))[0] || null;

  return {
    status: rows.length ? "ok" : "insufficient_data",
    sampleSize: rows.length,
    topPostId: top?.id || null,
    avgEngagementRate: rows.length
      ? Number((rows.reduce((s, row) => s + safeNumber(row?.metrics?.engagementRate), 0) / rows.length).toFixed(4))
      : 0,
    avgImpressions: rows.length
      ? Number((rows.reduce((s, row) => s + safeNumber(row?.metrics?.impressions), 0) / rows.length).toFixed(2))
      : 0,
  };
}
