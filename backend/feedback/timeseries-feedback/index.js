import { safeNumber } from "../lib/utils.js";

export function buildTimeseriesFeedback({ snapshots }) {
  const rows = Array.isArray(snapshots) ? snapshots : [];
  if (!rows.length) {
    return {
      status: "insufficient_data",
      checkpointsCovered: 0,
      avg24hEngagementRate: 0,
      checkpointDistribution: {},
    };
  }

  const byCheckpoint = {};
  for (const row of rows) {
    const key = String(row?.checkpoint || "unknown");
    if (!byCheckpoint[key]) byCheckpoint[key] = { count: 0, engagementRateTotal: 0 };
    byCheckpoint[key].count += 1;
    byCheckpoint[key].engagementRateTotal += safeNumber(row?.metrics?.engagementRate);
  }

  const avg24hRows = rows.filter((row) => String(row?.checkpoint) === "24h");
  const avg24hEngagementRate = avg24hRows.length
    ? Number(
        (avg24hRows.reduce((sum, row) => sum + safeNumber(row?.metrics?.engagementRate), 0) /
          avg24hRows.length).toFixed(4)
      )
    : 0;

  return {
    status: "ok",
    checkpointsCovered: Object.keys(byCheckpoint).length,
    avg24hEngagementRate,
    checkpointDistribution: byCheckpoint,
  };
}
