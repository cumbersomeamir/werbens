/**
 * Social analytics controller - handles social analytics API requests
 */
import { getSocialAnalyticsData } from "../services/socialAnalyticsService.js";

export async function getSocialAnalytics(req, res) {
  const userId = (req.query?.userId ?? req.body?.userId)?.trim();
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const result = await getSocialAnalyticsData(userId);
    return res.json(result);
  } catch (err) {
    console.error("getSocialAnalytics error:", err.message);
    return res.status(500).json({ error: "Failed to load analytics", data: [] });
  }
}
