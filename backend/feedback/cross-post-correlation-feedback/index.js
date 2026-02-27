import { safeNumber } from "../lib/utils.js";

export function buildCrossPostCorrelationFeedback({ recentPosts }) {
  const rows = (Array.isArray(recentPosts) ? recentPosts : [])
    .slice()
    .sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime());

  if (rows.length < 3) {
    return {
      status: "insufficient_data",
      lag1Correlation: 0,
      note: "Need at least 3 posts for lag correlation.",
    };
  }

  const x = [];
  const y = [];
  for (let i = 0; i < rows.length - 1; i += 1) {
    x.push(safeNumber(rows[i]?.metrics?.engagementRate));
    y.push(safeNumber(rows[i + 1]?.metrics?.engagementRate));
  }

  const meanX = x.reduce((a, b) => a + b, 0) / x.length;
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const correlation = denomX > 0 && denomY > 0 ? numerator / Math.sqrt(denomX * denomY) : 0;

  return {
    status: "ok",
    lag1Correlation: Number(correlation.toFixed(4)),
    sampleSize: x.length,
  };
}
