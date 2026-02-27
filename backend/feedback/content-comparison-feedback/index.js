import { safeNumber } from "../lib/utils.js";

function classifyPost(row) {
  const text = String(row?.text || "").toLowerCase();
  if (text.includes("?") || text.startsWith("what") || text.startsWith("why")) return "question_hook";
  if (/\d/.test(text)) return "data_hook";
  if (text.includes("story") || text.includes("today")) return "story_hook";
  return "claim_hook";
}

export function buildContentComparisonFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];
  const buckets = new Map();

  for (const row of rows) {
    const key = classifyPost(row);
    const prev = buckets.get(key) || { posts: 0, engagementRateTotal: 0 };
    prev.posts += 1;
    prev.engagementRateTotal += safeNumber(row?.metrics?.engagementRate);
    buckets.set(key, prev);
  }

  const clusters = Array.from(buckets.entries()).map(([cluster, value]) => ({
    cluster,
    posts: value.posts,
    avgEngagementRate: value.posts ? Number((value.engagementRateTotal / value.posts).toFixed(4)) : 0,
  }));

  const best = clusters.slice().sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0] || null;

  return {
    status: rows.length ? "ok" : "insufficient_data",
    clusters,
    winningCluster: best?.cluster || null,
  };
}
