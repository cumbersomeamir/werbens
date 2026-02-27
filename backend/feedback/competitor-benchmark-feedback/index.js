import { safeNumber } from "../lib/utils.js";

export function buildCompetitorBenchmarkFeedback({ recentPosts }) {
  const rows = Array.isArray(recentPosts) ? recentPosts : [];
  const baseline = rows.length
    ? Number((rows.reduce((sum, row) => sum + safeNumber(row?.metrics?.engagementRate), 0) / rows.length).toFixed(4))
    : 0;

  return {
    status: rows.length ? "partial" : "insufficient_data",
    baselineEngagementRate: baseline,
    source: "api_first_scrape_fallback",
    note: "Auto-discovery for competitor handles is enabled; first phase uses account-self baseline until competitor pipeline warms up.",
  };
}
